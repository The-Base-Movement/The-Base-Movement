"""
Donor Propensity Model
======================
Scores every member on their likelihood to donate using a weighted
rule-based model across four signal categories:

  1. Donation history  (max 0.60) — has donated, donated multiple times,
                                    donated recently (within 30 days)
  2. Activity signals (max 0.20) — login events and poll votes in last 30d
  3. Membership status (max 0.15) — active/approved status, tenure > 90 days
  4. Engagement bonus (max 0.05)  — holds at least one achievement/badge

Final score is clamped to [0, 1].
Tier mapping: High ≥ 0.65 | Medium ≥ 0.35 | Low < 0.35
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, Path
from pydantic import BaseModel

from auth import require_admin_access
from database import get_client

router = APIRouter(
    prefix="/api/donor",
    dependencies=[Depends(require_admin_access)],
)

THIRTY_DAYS_AGO = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
NINETY_DAYS_AGO = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()


class DonorScore(BaseModel):
    member_id: str
    reg_no: str
    full_name: str
    region: str | None
    constituency: str | None
    status: str
    score: float
    tier: str
    donation_count: int
    last_donation_date: str | None
    activity_events_30d: int
    recommended_action: str


class PropensityResponse(BaseModel):
    generated_at: str
    total_scored: int
    high_propensity: int
    medium_propensity: int
    low_propensity: int
    members: List[DonorScore]


def _tier(score: float) -> str:
    if score >= 0.65:
        return "High"
    if score >= 0.35:
        return "Medium"
    return "Low"


def _action(tier: str, donation_count: int) -> str:
    if tier == "High":
        return "Priority outreach — personalised ask"
    if tier == "Medium" and donation_count == 0:
        return "First-time donor campaign"
    if tier == "Medium":
        return "Re-engagement follow-up"
    return "Awareness & onboarding nurture"


def _score_member(
    member: Dict[str, Any],
    donations_by_member: Dict[str, List[Dict]],
    activity_by_member: Dict[str, int],
    achievers: set,
) -> DonorScore:
    uid = member["id"]
    all_donations = donations_by_member.get(uid, [])
    verified = [d for d in all_donations if d["status"] == "Verified"]
    recent = [d for d in verified if d["created_at"] >= THIRTY_DAYS_AGO]
    joined_at = member.get("joined_at") or ""
    is_veteran = bool(joined_at and joined_at <= NINETY_DAYS_AGO)

    # 1. Donation history (0–0.60)
    donation_score = 0.0
    if verified:
        donation_score += 0.30
    if len(verified) >= 3:
        donation_score += 0.20
    elif len(verified) >= 2:
        donation_score += 0.10
    if recent:
        donation_score += 0.10

    # 2. Activity (0–0.20)
    activity_count = activity_by_member.get(uid, 0)
    activity_score = min(0.20, activity_count * 0.04)

    # 3. Membership (0–0.15)
    membership_score = 0.0
    if member["status"] in ("Active", "Approved"):
        membership_score += 0.10
    if is_veteran:
        membership_score += 0.05

    # 4. Engagement bonus (0–0.05)
    engagement_score = 0.05 if uid in achievers else 0.0

    final = min(1.0, donation_score + activity_score + membership_score + engagement_score)
    last_date = max((d["created_at"] for d in verified), default=None)

    tier = _tier(final)
    return DonorScore(
        member_id=uid,
        reg_no=member.get("reg_no", ""),
        full_name=member.get("full_name", "Unknown"),
        region=member.get("region"),
        constituency=member.get("constituency"),
        status=member.get("status", "Pending"),
        score=round(final, 4),
        tier=tier,
        donation_count=len(verified),
        last_donation_date=last_date,
        activity_events_30d=activity_count,
        recommended_action=_action(tier, len(verified)),
    )


@router.get("/propensity", response_model=PropensityResponse)
async def get_propensity():
    db = get_client()

    # Fetch members
    members_res = (
        db.table("users")
        .select("id, reg_no, full_name, region, constituency, status, joined_at")
        .not_.is_("reg_no", "null")
        .execute()
    )
    members: List[Dict] = members_res.data or []

    # Fetch all donations in one query
    donations_res = (
        db.table("donations")
        .select("member_id, status, created_at, amount")
        .execute()
    )
    donations_by_member: Dict[str, List[Dict]] = {}
    for d in donations_res.data or []:
        uid = d.get("member_id")
        if uid:
            donations_by_member.setdefault(uid, []).append(d)

    # Fetch activity logs (logins + poll votes last 30 days)
    activity_res = (
        db.table("user_activity_logs")
        .select("user_id, action_type")
        .in_("action_type", ["login", "poll_vote", "donation"])
        .gte("created_at", THIRTY_DAYS_AGO)
        .execute()
    )
    activity_by_member: Dict[str, int] = {}
    for a in activity_res.data or []:
        uid = a.get("user_id")
        if uid:
            activity_by_member[uid] = activity_by_member.get(uid, 0) + 1

    # Fetch achievers
    achievers_res = db.table("member_achievements").select("user_id").execute()
    achievers = {a["user_id"] for a in achievers_res.data or []}

    scored = [
        _score_member(m, donations_by_member, activity_by_member, achievers)
        for m in members
    ]
    scored.sort(key=lambda s: s.score, reverse=True)

    return PropensityResponse(
        generated_at=datetime.now(timezone.utc).isoformat(),
        total_scored=len(scored),
        high_propensity=sum(1 for s in scored if s.tier == "High"),
        medium_propensity=sum(1 for s in scored if s.tier == "Medium"),
        low_propensity=sum(1 for s in scored if s.tier == "Low"),
        members=scored,
    )


@router.get("/propensity/{reg_no}", response_model=DonorScore)
async def get_member_propensity(
    reg_no: str = Path(
        ...,
        min_length=3,
        max_length=32,
        pattern=r"^[A-Za-z0-9-]+$",
        description="Member registration number.",
    )
):
    db = get_client()

    member_res = (
        db.table("users")
        .select("id, reg_no, full_name, region, constituency, status, joined_at")
        .eq("reg_no", reg_no)
        .single()
        .execute()
    )
    member = member_res.data

    donations_res = (
        db.table("donations")
        .select("member_id, status, created_at, amount")
        .eq("member_id", member["id"])
        .execute()
    )
    donations_by_member = {member["id"]: donations_res.data or []}

    activity_res = (
        db.table("user_activity_logs")
        .select("user_id, action_type")
        .eq("user_id", member["id"])
        .in_("action_type", ["login", "poll_vote", "donation"])
        .gte("created_at", THIRTY_DAYS_AGO)
        .execute()
    )
    activity_by_member = {member["id"]: len(activity_res.data or [])}

    achievers_res = (
        db.table("member_achievements")
        .select("user_id")
        .eq("user_id", member["id"])
        .execute()
    )
    achievers = {a["user_id"] for a in achievers_res.data or []}

    return _score_member(member, donations_by_member, activity_by_member, achievers)
