"""
Mobilization Forecast & Sentiment
===================================
Two endpoints:

/api/mobilization/forecast
  Per-region linear-trend membership forecast at 30 / 60 / 90 days.
  Compares this 30-day cohort vs. previous 30-day cohort to derive
  growth acceleration and project forward.

/api/mobilization/sentiment
  Region-level sentiment index (0–1) derived from:
    - Active/Approved member ratio            (weight 0.50)
    - Donation participation rate             (weight 0.30)
    - New-member velocity (30d cohort / total)(weight 0.20)
  Includes trend direction vs. previous period.
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from fastapi import APIRouter
from pydantic import BaseModel

from database import get_client

router = APIRouter(prefix="/api/mobilization")

NOW = datetime.now(timezone.utc)
T30 = (NOW - timedelta(days=30)).isoformat()
T60 = (NOW - timedelta(days=60)).isoformat()
T90 = (NOW - timedelta(days=90)).isoformat()


# ── Forecast ────────────────────────────────────────────────────────────────

class RegionForecast(BaseModel):
    region: str
    current_members: int
    active_members: int
    new_members_30d: int
    new_members_prev_30d: int
    growth_rate_pct: float
    acceleration: float
    forecast_30d: int
    forecast_60d: int
    forecast_90d: int
    confidence: str


class ForecastResponse(BaseModel):
    generated_at: str
    total_regions: int
    national_total: int
    national_active: int
    fastest_growing_region: str
    regions: List[RegionForecast]


def _confidence(total: int, rate: float) -> str:
    if total >= 100 and abs(rate) <= 200:
        return "High"
    if total >= 20:
        return "Medium"
    return "Low"


@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast():
    db = get_client()

    # All regions spine
    regions_res = db.table("ghana_regions").select("name").order("name").execute()
    all_regions = [r["name"] for r in regions_res.data or []]

    # All Ghana-platform users
    users_res = (
        db.table("users")
        .select("id, region, status, joined_at")
        .not_.is_("region", "null")
        .neq("region", "")
        .execute()
    )
    users: List[Dict[str, Any]] = users_res.data or []

    # Donations for participation rate
    donations_res = (
        db.table("donations")
        .select("member_id, status")
        .eq("status", "Verified")
        .execute()
    )
    donor_ids = {d["member_id"] for d in donations_res.data or [] if d.get("member_id")}

    # Aggregate per region
    region_map: Dict[str, Dict] = {
        r: {"total": 0, "active": 0, "new_30d": 0, "prev_30d": 0, "donors": 0}
        for r in all_regions
    }

    for u in users:
        reg = u.get("region", "")
        if reg not in region_map:
            region_map[reg] = {"total": 0, "active": 0, "new_30d": 0, "prev_30d": 0, "donors": 0}
        g = region_map[reg]
        g["total"] += 1
        if u["status"] in ("Active", "Approved"):
            g["active"] += 1
        joined = u.get("joined_at") or ""
        if joined >= T30:
            g["new_30d"] += 1
        elif joined >= T60:
            g["prev_30d"] += 1
        if u["id"] in donor_ids:
            g["donors"] += 1

    results: List[RegionForecast] = []
    for region, g in region_map.items():
        total = g["total"]
        new_30 = g["new_30d"]
        prev_30 = g["prev_30d"]

        # Growth rate = new_30d as % of prior base (prev period)
        prior_base = max(1, total - new_30)
        growth_rate = round((new_30 / prior_base) * 100, 2)

        # Acceleration: how much faster are we growing vs previous period?
        acceleration = round(new_30 - prev_30, 2)

        # Project forward using current 30-day velocity
        velocity = new_30
        results.append(RegionForecast(
            region=region,
            current_members=total,
            active_members=g["active"],
            new_members_30d=new_30,
            new_members_prev_30d=prev_30,
            growth_rate_pct=growth_rate,
            acceleration=acceleration,
            forecast_30d=total + velocity,
            forecast_60d=total + velocity * 2,
            forecast_90d=total + velocity * 3,
            confidence=_confidence(total, growth_rate),
        ))

    results.sort(key=lambda r: r.new_members_30d, reverse=True)
    fastest = results[0].region if results else "N/A"
    national_total = sum(r.current_members for r in results)
    national_active = sum(r.active_members for r in results)

    return ForecastResponse(
        generated_at=NOW.isoformat(),
        total_regions=len(results),
        national_total=national_total,
        national_active=national_active,
        fastest_growing_region=fastest,
        regions=results,
    )


# ── Sentiment ────────────────────────────────────────────────────────────────

class RegionSentiment(BaseModel):
    region: str
    sentiment_score: float
    sentiment_label: str
    active_ratio: float
    donation_participation_rate: float
    velocity_score: float
    trend: str
    total_members: int


class SentimentResponse(BaseModel):
    generated_at: str
    national_sentiment: float
    most_positive_region: str
    most_negative_region: str
    regions: List[RegionSentiment]


def _sentiment_label(score: float) -> str:
    if score >= 0.72:
        return "Strong"
    if score >= 0.50:
        return "Positive"
    if score >= 0.30:
        return "Neutral"
    return "Concerning"


def _trend(current: float, prev: float) -> str:
    delta = current - prev
    if delta > 0.05:
        return "Rising"
    if delta < -0.05:
        return "Falling"
    return "Stable"


@router.get("/sentiment", response_model=SentimentResponse)
async def get_sentiment():
    db = get_client()

    regions_res = db.table("ghana_regions").select("name").order("name").execute()
    all_regions = [r["name"] for r in regions_res.data or []]

    users_res = (
        db.table("users")
        .select("id, region, status, joined_at")
        .not_.is_("region", "null")
        .neq("region", "")
        .execute()
    )
    users: List[Dict] = users_res.data or []

    donations_res = (
        db.table("donations")
        .select("member_id, status")
        .eq("status", "Verified")
        .execute()
    )
    donor_ids = {d["member_id"] for d in donations_res.data or [] if d.get("member_id")}

    region_map: Dict[str, Dict] = {
        r: {"total": 0, "active": 0, "new_30d": 0, "prev_30d": 0, "donors": 0}
        for r in all_regions
    }

    for u in users:
        reg = u.get("region", "")
        if reg not in region_map:
            region_map[reg] = {"total": 0, "active": 0, "new_30d": 0, "prev_30d": 0, "donors": 0}
        g = region_map[reg]
        g["total"] += 1
        if u["status"] in ("Active", "Approved"):
            g["active"] += 1
        joined = u.get("joined_at") or ""
        if joined >= T30:
            g["new_30d"] += 1
        elif joined >= T60:
            g["prev_30d"] += 1
        if u["id"] in donor_ids:
            g["donors"] += 1

    results: List[RegionSentiment] = []
    for region, g in region_map.items():
        total = max(1, g["total"])
        active_ratio = g["active"] / total
        donation_rate = g["donors"] / total
        # Velocity = new joins this period vs prior, normalised 0–1
        max_v = max(g["new_30d"], g["prev_30d"], 1)
        velocity = g["new_30d"] / max_v

        score = round(active_ratio * 0.50 + donation_rate * 0.30 + velocity * 0.20, 4)

        # Prev period score for trend
        prev_active = max(0, g["active"] - g["new_30d"])
        prev_total = max(1, total - g["new_30d"] + g["prev_30d"])
        prev_active_ratio = prev_active / prev_total
        prev_donation_rate = donation_rate  # donation data is not time-sliced per request
        prev_velocity = g["prev_30d"] / max_v
        prev_score = prev_active_ratio * 0.50 + prev_donation_rate * 0.30 + prev_velocity * 0.20

        results.append(RegionSentiment(
            region=region,
            sentiment_score=score,
            sentiment_label=_sentiment_label(score),
            active_ratio=round(active_ratio, 4),
            donation_participation_rate=round(donation_rate, 4),
            velocity_score=round(velocity, 4),
            trend=_trend(score, prev_score),
            total_members=g["total"],
        ))

    results.sort(key=lambda r: r.sentiment_score, reverse=True)

    scores = [r.sentiment_score for r in results if r.total_members > 0]
    national = round(sum(scores) / len(scores), 4) if scores else 0.0

    return SentimentResponse(
        generated_at=NOW.isoformat(),
        national_sentiment=national,
        most_positive_region=results[0].region if results else "N/A",
        most_negative_region=results[-1].region if results else "N/A",
        regions=results,
    )
