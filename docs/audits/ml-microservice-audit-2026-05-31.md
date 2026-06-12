# ML Intelligence Microservice — Implementation Audit

**Date:** 2026-05-31  
**Status:** ✅ Implemented — awaiting production deployment  
**Corresponds to:** `TODO_REMAINING.md` → Enterprise Technical Integrations → ML Intelligence Microservice

---

## What Was Built

A Python/FastAPI microservice (`ml-service/`) that reads live data from Supabase and exposes
predictive-analytics endpoints consumed by a new admin page (`/admin/ml-intelligence`).

---

## Architecture

```
Frontend (React/Vite)
  └── src/services/mlService.ts        ← typed API client
  └── src/pages/admin/MLIntelligence.tsx ← admin UI (3 tabs)
        │
        │  VITE_ML_SERVICE_URL (default: http://localhost:8000)
        ▼
ml-service/ (Python 3.11+ / FastAPI)
  ├── main.py           ← app entry, CORS, router registration
  ├── config.py         ← pydantic-settings (reads .env)
  ├── database.py       ← Supabase Python client singleton
  └── routers/
      ├── health.py         → GET /health
      ├── donor.py          → GET /api/donor/propensity
      │                     → GET /api/donor/propensity/{reg_no}
      └── mobilization.py   → GET /api/mobilization/forecast
                            → GET /api/mobilization/sentiment
```

---

## API Endpoints

| Method | Path                             | Description                                    |
| ------ | -------------------------------- | ---------------------------------------------- |
| `GET`  | `/health`                        | Service health + Supabase connectivity check   |
| `GET`  | `/api/donor/propensity`          | Score all members; sorted High → Low           |
| `GET`  | `/api/donor/propensity/{reg_no}` | Score a single member by reg number            |
| `GET`  | `/api/mobilization/forecast`     | 30/60/90-day membership projections per region |
| `GET`  | `/api/mobilization/sentiment`    | Regional sentiment index (0–1) with trend      |

---

## Model Design

### 1. Donor Propensity (`routers/donor.py`)

Weighted rule-based scoring across four signal buckets:

| Signal            | Max weight | Source table                                                        |
| ----------------- | ---------- | ------------------------------------------------------------------- |
| Donation history  | 0.60       | `donations` (verified records, recency)                             |
| Activity signals  | 0.20       | `user_activity_logs` (login, poll_vote, donation events — last 30d) |
| Membership status | 0.15       | `users.status` + tenure via `joined_at`                             |
| Achievement bonus | 0.05       | `member_achievements`                                               |

**Tiers:**

- **High** ≥ 0.65 → "Priority outreach — personalised ask"
- **Medium** 0.35–0.64 → "Re-engagement follow-up" or "First-time donor campaign"
- **Low** < 0.35 → "Awareness & onboarding nurture"

### 2. Mobilization Forecast (`routers/mobilization.py` — `/forecast`)

Linear velocity extrapolation per region:

- Compares this 30-day new-join cohort vs the prior 30-day cohort (growth acceleration)
- Projects +30d / +60d / +90d membership by adding `current_velocity × N`
- Confidence rated High / Medium / Low based on regional sample size

### 3. Sentiment Index (`routers/mobilization.py` — `/sentiment`)

Composite weighted score (0–1) per region:

| Factor                                     | Weight |
| ------------------------------------------ | ------ |
| Active/Approved member ratio               | 0.50   |
| Donation participation rate                | 0.30   |
| New-member velocity (this vs prior period) | 0.20   |

Labels: **Strong** ≥ 0.72 | **Positive** ≥ 0.50 | **Neutral** ≥ 0.30 | **Concerning** < 0.30  
Trend: **Rising** / **Stable** / **Falling** vs. prior period baseline

---

## Frontend Integration

### New Files

- `src/services/mlService.ts` — typed fetch wrapper for all 5 endpoints; reads `VITE_ML_SERVICE_URL`
- `src/pages/admin/MLIntelligence.tsx` — three-tab admin page:
  - **Donor Propensity** — KPI strip + searchable/filterable paginated table (15/page)
  - **Regional Forecast** — KPI strip + 30/60/90d projection table with confidence column
  - **Sentiment Index** — KPI strip + per-region bar cards with trend icons
- `src/routes.tsx` — lazy route at `/admin/ml-intelligence`
- `src/components/layouts/AdminLayout.tsx` — nav entry ("ML Intelligence", `auto_awesome` icon) in Overview group

### Service Status Banner

The page shows a live-status dot on load (green = connected, red = offline). When the service is
unreachable the UI shows an inline error with the exact `uvicorn` start command.

---

## How to Run (Local Development)

```bash
# 1. Install Python dependencies
cd ml-service
pip install -r requirements.txt

# 2. Copy env file and fill in your Supabase service role key
cp .env.example .env
# → set SUPABASE_URL and SUPABASE_SERVICE_KEY

# 3. Start the service
uvicorn main:app --reload --port 8000

# 4. Interactive docs available at http://localhost:8000/docs
```

The Vite dev server is already pointed at `http://localhost:8000` via the default value in
`VITE_ML_SERVICE_URL`. No `.env` change required for local dev.

---

## Production Deployment Options

### Option A — Hostinger VPS (Recommended)

The project already has a Hostinger VPS. Deploy as a `systemd` service:

```bash
# On the VPS
git pull
cd ml-service
pip install -r requirements.txt
cp .env.example .env  # fill in secrets

# Create systemd unit at /etc/systemd/system/ml-service.service
[Unit]
Description=The Base ML Intelligence Service
After=network.target

[Service]
WorkingDirectory=/var/www/the-base/ml-service
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
EnvironmentFile=/var/www/the-base/ml-service/.env

[Install]
WantedBy=multi-user.target

sudo systemctl enable ml-service && sudo systemctl start ml-service
```

Then set `VITE_ML_SERVICE_URL=https://ml.thebasemovement.com` (or the VPS IP/subdomain) in the
Vite build environment.

### Option B — Railway / Render

Push `ml-service/` as a standalone repo or sub-directory deploy. Set the three env vars
(`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CORS_ORIGINS`) in the platform's dashboard.

---

## Security Notes

- The service uses the **Supabase service role key** (bypasses RLS) — this key must never be
  exposed to the browser. It lives only in the server-side `.env`.
- CORS is locked to the origins listed in `CORS_ORIGINS`. In production, set this to your exact
  frontend domain.
- All endpoints are read-only (`GET`). No mutations are performed.
- The `/api/donor/propensity` response includes `member_id` UUIDs and names — ensure the
  `/admin/ml-intelligence` route is protected by admin auth (it inherits `AdminLayout`'s auth
  guard automatically).

---

## Remaining Steps (TODO_REMAINING update)

- [ ] Deploy `ml-service/` to Hostinger VPS or Railway
- [ ] Set `VITE_ML_SERVICE_URL` in production Vite build env
- [ ] Set `CORS_ORIGINS` to production frontend domain in VPS `.env`
- [ ] Consider adding a Supabase `pg_cron` job or nightly cache table for propensity scores
      (avoids re-scoring all members on every page load)
- [ ] Future: replace rule-based propensity with scikit-learn logistic regression once labelled
      training data accumulates (donor / non-donor labels from `donations` table)
