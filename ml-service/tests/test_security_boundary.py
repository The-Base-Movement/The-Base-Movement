import os
import sys
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient


ML_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ML_SERVICE_DIR not in sys.path:
    sys.path.insert(0, ML_SERVICE_DIR)

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "service-role-key")

from auth import AdminIdentity, require_admin_access
from main import app


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = []
        self.expect_single = False

    def select(self, _fields):
        return self

    @property
    def not_(self):
        return self

    def is_(self, field, value):
        self.filters.append(("is_not", field, value))
        return self

    def neq(self, field, value):
        self.filters.append(("neq", field, value))
        return self

    def eq(self, field, value):
        self.filters.append(("eq", field, value))
        return self

    def in_(self, field, values):
        self.filters.append(("in", field, values))
        return self

    def gte(self, field, value):
        self.filters.append(("gte", field, value))
        return self

    def order(self, _field):
        return self

    def limit(self, _value):
        return self

    def single(self):
        self.expect_single = True
        return self

    def maybe_single(self):
        self.expect_single = True
        return self

    def execute(self):
        rows = list(self.rows)
        for op, field, value in self.filters:
            if op == "eq":
                rows = [row for row in rows if row.get(field) == value]
            elif op == "neq":
                rows = [row for row in rows if row.get(field) != value]
            elif op == "in":
                rows = [row for row in rows if row.get(field) in value]
            elif op == "gte":
                rows = [row for row in rows if (row.get(field) or "") >= value]
            elif op == "is_not" and value == "null":
                rows = [row for row in rows if row.get(field) is not None]

        if self.expect_single:
            return FakeResponse(rows[0] if rows else None)
        return FakeResponse(rows)


class FakeDB:
    def __init__(self, tables):
        self.tables = tables

    def table(self, name):
        return FakeQuery(self.tables.get(name, []))


class SecurityBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides.clear()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_bulk_propensity_requires_authorization_header(self):
        response = self.client.get("/api/donor/propensity")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Authorization header is required.")

    def test_bulk_propensity_rejects_non_admin_callers(self):
        def deny_access():
            raise HTTPException(status_code=403, detail="Admin authorization is required.")

        app.dependency_overrides[require_admin_access] = deny_access

        response = self.client.get(
            "/api/donor/propensity",
            headers={"Authorization": "Bearer member-token"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Admin authorization is required.")

    def test_member_propensity_rejects_malformed_registration_numbers(self):
        app.dependency_overrides[require_admin_access] = lambda: AdminIdentity(user_id="admin-1", role="ADMIN")

        response = self.client.get(
            "/api/donor/propensity/bad%20value",
            headers={"Authorization": "Bearer admin-token"},
        )

        self.assertEqual(response.status_code, 422)

    def test_admin_can_fetch_propensity_and_mobilization_analytics(self):
        tables = {
            "users": [
                {
                    "id": "user-1",
                    "reg_no": "TBM-00123",
                    "full_name": "Ada Example",
                    "region": "Greater Accra",
                    "constituency": "Ayawaso West",
                    "status": "Active",
                    "joined_at": "2026-01-01T00:00:00+00:00",
                }
            ],
            "donations": [
                {
                    "member_id": "user-1",
                    "status": "Verified",
                    "created_at": "2026-06-10T00:00:00+00:00",
                    "amount": 100,
                }
            ],
            "user_activity_logs": [
                {
                    "user_id": "user-1",
                    "action_type": "login",
                    "created_at": "2026-06-11T00:00:00+00:00",
                }
            ],
            "member_achievements": [{"user_id": "user-1"}],
            "ghana_regions": [{"name": "Greater Accra"}],
        }
        fake_db = FakeDB(tables)

        app.dependency_overrides[require_admin_access] = lambda: AdminIdentity(user_id="admin-1", role="ADMIN")

        with patch("routers.donor.get_client", return_value=fake_db), patch(
            "routers.mobilization.get_client", return_value=fake_db
        ):
            bulk = self.client.get(
                "/api/donor/propensity",
                headers={"Authorization": "Bearer admin-token"},
            )
            member = self.client.get(
                "/api/donor/propensity/TBM-00123",
                headers={"Authorization": "Bearer admin-token"},
            )
            forecast = self.client.get(
                "/api/mobilization/forecast",
                headers={"Authorization": "Bearer admin-token"},
            )
            sentiment = self.client.get(
                "/api/mobilization/sentiment",
                headers={"Authorization": "Bearer admin-token"},
            )

        self.assertEqual(bulk.status_code, 200)
        self.assertEqual(bulk.json()["total_scored"], 1)
        self.assertEqual(member.status_code, 200)
        self.assertEqual(member.json()["reg_no"], "TBM-00123")
        self.assertEqual(forecast.status_code, 200)
        self.assertEqual(forecast.json()["national_total"], 1)
        self.assertEqual(sentiment.status_code, 200)
        self.assertEqual(sentiment.json()["most_positive_region"], "Greater Accra")


if __name__ == "__main__":
    unittest.main()
