---
name: finance-tables-schema
description: Column lists and constraints for the three finance/analytics tables — donations, mobilization_ledger, finance_requests
metadata:
  type: project
---

The Finance Officer analytics surface draws from three tables. Verified live 2026-06-02.

## donations (income source)

Columns: id, member_id (→users.id), campaign_id (→donation_campaigns.id), full_name, phone, amount (numeric), country, payment_method, receipt_url, status (default 'Pending'), show_on_dashboard (bool, default true), created_at, verified_by (→admins.id), verification_notes, updated_at, reference, cleared (bool, default false), description.

- **No CHECK on `status`** — free-text. App convention, not DB, governs values.
- No `category`/`type` column, no `chapter`. Segment income by country, campaign_id, or payment_method.
- Has both `cleared` (bool) and `status` — "cleared income" likely keys on cleared=true.

## mobilization_ledger (expenses/allocations)

Columns: id, chapter, transaction_type, amount (numeric), description, category, timestamp (default now()), created_by (→auth.users.id).

- `transaction_type` CHECK: 'Allocation' | 'Expenditure'.
- `category` is NOT NULL but **has no CHECK** — free-text.
- Date field is `timestamp`, NOT created_at. (See also [[mobilization-ledger-schema]].)

## finance_requests (request workflow, migration 20260602140000)

Columns: id, requester_id (→auth.users.id ON DELETE CASCADE, NOT NULL), request_type, chapter, amount (numeric), description, status (default 'Pending'), officer_comment, reviewed_by (→auth.users.id), created_at (default now()), reviewed_at.

- `request_type` CHECK: 'BudgetAllocation' | 'ExpenseReimbursement' | 'InventoryReplenishment'.
- `status` CHECK: 'Pending' | 'Approved' | 'Rejected'.
- `amount` CHECK: > 0.

**Why:** Finance Officer role (added in recent FINANCE_OFFICER RBAC work) is building an analytics dashboard over these three.
**How to apply:** When writing analytics SQL, remember donations.status and mobilization_ledger.category are free-text (no enum) — don't assume a fixed value set; query distinct values first.
