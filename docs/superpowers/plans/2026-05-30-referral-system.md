# Referral System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a referral tracking system where members earn points (50 on registration, 25 on verification) for people they refer, with a dashboard page showing their referrals and a leaderboard of top referrers.

**Architecture:** DB-enforced point awarding via two SECURITY DEFINER RPC functions; a new `referral_awards` table acts as both idempotency guard and data source; a `referralService` wraps all queries; a single dashboard page at `/dashboard/referrals` shows KPIs, stacked referral cards, and a top-10 leaderboard.

**Tech Stack:** React 18 + TypeScript, Supabase (Postgres RPC + JS client), inline styles + design system CSS classes, React Router v6 lazy routes.

---

## File Map

| File                                                     | Action | Responsibility                                                         |
| -------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `supabase/migrations/20260530000000_referral_system.sql` | Create | `referral_awards` table + 3 RPC functions                              |
| `src/types/referrals.ts`                                 | Create | `ReferredMember`, `ReferralStats`, `ReferralLeaderboardEntry` types    |
| `src/services/referralService.ts`                        | Create | `getMyReferrals()`, `getMyReferralStats()`, `getReferralLeaderboard()` |
| `src/pages/dashboard/referrals/ReferralCard.tsx`         | Create | Single referred-member card component                                  |
| `src/pages/dashboard/Referrals.tsx`                      | Create | Page shell — KPIs, list, leaderboard, ShareModal                       |
| `src/routes.tsx`                                         | Modify | Lazy import + route entry under DashboardLayout                        |
| `src/components/DashboardLayout.tsx`                     | Modify | Nav item, page title, referralCount badge                              |
| `src/services/registrationService.ts`                    | Modify | Call `award_referral_points` RPC after DB insert                       |
| `src/services/memberService.ts`                          | Modify | Call `award_referral_verification_bonus` RPC after approval            |

---

### Task 1: Database — `referral_awards` table + RPC functions

**Files:**

- Create: `supabase/migrations/20260530000000_referral_system.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260530000000_referral_system.sql

-- ── 1. referral_awards table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_awards (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_member_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  award_type         text        NOT NULL CHECK (award_type IN ('registration', 'verification')),
  points             integer     NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_member_id, award_type)
);

ALTER TABLE public.referral_awards ENABLE ROW LEVEL SECURITY;

-- Members may only read their own rows (as the referrer)
CREATE POLICY "referrer can read own awards"
  ON public.referral_awards FOR SELECT TO authenticated
  USING (referrer_id = auth.uid());

-- ── 2. award_referral_points ─────────────────────────────────────
-- Called after a new member registers via a referral link.
CREATE OR REPLACE FUNCTION public.award_referral_points(p_new_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
BEGIN
  SELECT referred_by INTO v_referrer_reg
    FROM users WHERE id = p_new_member_id;

  IF v_referrer_reg IS NULL THEN RETURN; END IF;

  SELECT id INTO v_referrer_id
    FROM users WHERE registration_number = v_referrer_reg;

  IF v_referrer_id IS NULL THEN RETURN; END IF;

  BEGIN
    INSERT INTO referral_awards (referrer_id, referred_member_id, award_type, points)
    VALUES (v_referrer_id, p_new_member_id, 'registration', 50);

    UPDATE users SET points = COALESCE(points, 0) + 50 WHERE id = v_referrer_id;
  EXCEPTION WHEN unique_violation THEN
    NULL; -- Already awarded; skip silently
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_referral_points(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_referral_points(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.award_referral_points(uuid) TO authenticated;

-- ── 3. award_referral_verification_bonus ─────────────────────────
-- Called when a member's status is set to Active / Approved.
CREATE OR REPLACE FUNCTION public.award_referral_verification_bonus(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_reg text;
  v_referrer_id  uuid;
BEGIN
  SELECT referred_by INTO v_referrer_reg
    FROM users WHERE id = p_member_id;

  IF v_referrer_reg IS NULL THEN RETURN; END IF;

  SELECT id INTO v_referrer_id
    FROM users WHERE registration_number = v_referrer_reg;

  IF v_referrer_id IS NULL THEN RETURN; END IF;

  BEGIN
    INSERT INTO referral_awards (referrer_id, referred_member_id, award_type, points)
    VALUES (v_referrer_id, p_member_id, 'verification', 25);

    UPDATE users SET points = COALESCE(points, 0) + 25 WHERE id = v_referrer_id;
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_referral_verification_bonus(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_referral_verification_bonus(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.award_referral_verification_bonus(uuid) TO authenticated;

-- ── 4. get_referral_leaderboard ──────────────────────────────────
-- Returns top 10 referrers by count of non-deleted referred members.
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard()
RETURNS TABLE (
  referrer_id         uuid,
  full_name           text,
  registration_number text,
  avatar_url          text,
  referral_count      bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id                       AS referrer_id,
    u.full_name::text,
    u.registration_number::text,
    u.avatar_url::text,
    COUNT(r.id)::bigint        AS referral_count
  FROM users u
  JOIN users r
    ON r.referred_by = u.registration_number
   AND r.deleted_at IS NULL
  WHERE u.deleted_at IS NULL
  GROUP BY u.id, u.full_name, u.registration_number, u.avatar_url
  ORDER BY referral_count DESC
  LIMIT 10;
$$;

REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_referral_leaderboard() TO authenticated;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__supabase__apply_migration` with name `referral_system` and the SQL above.

- [ ] **Step 3: Verify the table exists**

Run via `mcp__supabase__execute_sql`:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'referral_awards' ORDER BY ordinal_position;
```

Expected: rows for `id`, `referrer_id`, `referred_member_id`, `award_type`, `points`, `created_at`.

- [ ] **Step 4: Verify the functions exist**

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('award_referral_points','award_referral_verification_bonus','get_referral_leaderboard');
```

Expected: 3 rows.

- [ ] **Step 5: Commit the migration file**

```bash
git add supabase/migrations/20260530000000_referral_system.sql
git commit -m "feat(db): add referral_awards table and referral point RPCs"
```

---

### Task 2: Types

**Files:**

- Create: `src/types/referrals.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/referrals.ts

export interface ReferredMember {
  id: string
  name: string // users.full_name
  registrationNumber: string // users.registration_number
  platform: 'GHANA' | 'DIASPORA'
  region?: string
  constituency?: string
  country?: string
  status: string // users.status e.g. 'Pending' | 'Active' | 'Approved' | 'Suspended'
  avatarUrl?: string | null
  joinedAt: string // users.joined_at ISO string
  verificationBonusAwarded: boolean
}

export interface ReferralStats {
  total: number
  active: number
  pending: number
  pointsEarned: number
}

export interface ReferralLeaderboardEntry {
  referrerId: string
  name: string
  registrationNumber: string
  avatarUrl?: string | null
  referralCount: number
  isCurrentUser: boolean
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/referrals.ts
git commit -m "feat(types): add ReferredMember, ReferralStats, ReferralLeaderboardEntry"
```

---

### Task 3: Referral Service

**Files:**

- Create: `src/services/referralService.ts`

- [ ] **Step 1: Create the service file**

```typescript
// src/services/referralService.ts
import { supabase } from '@/lib/supabase'
import type { ReferredMember, ReferralStats, ReferralLeaderboardEntry } from '@/types/referrals'

export const referralService = {
  async getMyReferrals(): Promise<ReferredMember[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    // Resolve current user's registration_number
    const { data: me } = await supabase
      .from('users')
      .select('registration_number')
      .eq('id', user.id)
      .single()
    if (!me?.registration_number) return []

    // Fetch referred members
    const { data: referred, error } = await supabase
      .from('users')
      .select(
        'id, full_name, registration_number, platform, region, constituency, country, status, avatar_url, joined_at'
      )
      .eq('referred_by', me.registration_number)
      .is('deleted_at', null)
      .order('joined_at', { ascending: false })

    if (error || !referred) {
      console.warn('[referralService] getMyReferrals:', error)
      return []
    }

    // Determine which referred members have had the verification bonus awarded
    let awardedSet = new Set<string>()
    if (referred.length > 0) {
      const { data: awards } = await supabase
        .from('referral_awards')
        .select('referred_member_id')
        .eq('referrer_id', user.id)
        .eq('award_type', 'verification')
        .in(
          'referred_member_id',
          referred.map((u) => u.id)
        )
      awardedSet = new Set(awards?.map((a) => a.referred_member_id) ?? [])
    }

    return referred.map((u) => ({
      id: u.id,
      name: u.full_name,
      registrationNumber: u.registration_number,
      platform: u.platform as 'GHANA' | 'DIASPORA',
      region: u.region ?? undefined,
      constituency: u.constituency ?? undefined,
      country: u.country ?? undefined,
      status: u.status,
      avatarUrl: u.avatar_url,
      joinedAt: u.joined_at,
      verificationBonusAwarded: awardedSet.has(u.id),
    }))
  },

  async getMyReferralStats(): Promise<ReferralStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { total: 0, active: 0, pending: 0, pointsEarned: 0 }

    const referrals = await this.getMyReferrals()
    const total = referrals.length
    const active = referrals.filter((r) => r.status === 'Active' || r.status === 'Approved').length
    const pending = referrals.filter((r) => r.status === 'Pending').length

    const { data: awards } = await supabase
      .from('referral_awards')
      .select('points')
      .eq('referrer_id', user.id)
    const pointsEarned = awards?.reduce((sum, a) => sum + (a.points ?? 0), 0) ?? 0

    return { total, active, pending, pointsEarned }
  },

  async getReferralLeaderboard(currentUserRegNo: string): Promise<ReferralLeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_referral_leaderboard')
    if (error || !data) {
      console.warn('[referralService] getReferralLeaderboard:', error)
      return []
    }
    return (
      data as {
        referrer_id: string
        full_name: string
        registration_number: string
        avatar_url: string | null
        referral_count: number
      }[]
    ).map((row, i) => ({
      referrerId: row.referrer_id,
      name: row.full_name,
      registrationNumber: row.registration_number,
      avatarUrl: row.avatar_url,
      referralCount: Number(row.referral_count),
      isCurrentUser: row.registration_number === currentUserRegNo,
    }))
  },
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/referralService.ts
git commit -m "feat(service): add referralService with getMyReferrals, stats, and leaderboard"
```

---

### Task 4: ReferralCard Component

**Files:**

- Create: `src/pages/dashboard/referrals/ReferralCard.tsx`

Note: create the directory `src/pages/dashboard/referrals/` first.

- [ ] **Step 1: Create the component**

```tsx
// src/pages/dashboard/referrals/ReferralCard.tsx
import type { ReferredMember } from '@/types/referrals'

interface Props {
  member: ReferredMember
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  const cls =
    s === 'active' || s === 'approved'
      ? 'pill-ok'
      : s === 'pending'
        ? 'pill-warn'
        : s === 'suspended'
          ? 'pill-err'
          : 'pill-mute'
  return (
    <span className={`pill ${cls}`} style={{ fontSize: 12 }}>
      {status}
    </span>
  )
}

export default function ReferralCard({ member }: Props) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const networkLabel = member.platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network'

  const locationParts =
    member.platform === 'GHANA'
      ? [member.region, member.constituency].filter(Boolean)
      : [member.country].filter(Boolean)
  const locationLine = locationParts.join(' · ')

  const date = new Date(member.joinedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="panel" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--primary))',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 2,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {member.name}
            </p>
            <StatusBadge status={member.status} />
          </div>

          {/* Network + location */}
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {networkLabel}
            {locationLine ? ` · ${locationLine}` : ''}
          </p>

          {/* Date + points */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Joined {date}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="pill pill-ok" style={{ fontSize: 10 }}>
                +50 pts
              </span>
              {member.verificationBonusAwarded && (
                <span
                  className="pill"
                  style={{
                    fontSize: 10,
                    background: 'hsl(var(--accent) / 0.15)',
                    color: 'hsl(var(--accent))',
                  }}
                >
                  +25 bonus ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/dashboard/referrals/ReferralCard.tsx
git commit -m "feat(ui): add ReferralCard component"
```

---

### Task 5: Referrals Page

**Files:**

- Create: `src/pages/dashboard/Referrals.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/dashboard/Referrals.tsx
import { useState, useEffect } from 'react'
import { referralService } from '@/services/referralService'
import { ShareModal } from '@/components/ShareModal'
import type { ReferredMember, ReferralStats, ReferralLeaderboardEntry } from '@/types/referrals'
import ReferralCard from './referrals/ReferralCard'
import SEO from '@/components/SEO'

function SkeletonCard() {
  return (
    <div
      className="panel"
      style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--border))',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '50%',
              height: 14,
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--border))',
            }}
          />
          <div
            style={{
              width: 60,
              height: 20,
              borderRadius: 'var(--radius-pill)',
              background: 'hsl(var(--border))',
            }}
          />
        </div>
        <div
          style={{
            width: '35%',
            height: 12,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--border))',
          }}
        />
        <div
          style={{
            width: '25%',
            height: 11,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--border))',
          }}
        />
      </div>
    </div>
  )
}

export default function Referrals() {
  const [referrals, setReferrals] = useState<ReferredMember[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    active: 0,
    pending: 0,
    pointsEarned: 0,
  })
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)

  const userRegNo = localStorage.getItem('userRegNo') ?? ''
  const shareUrl = userRegNo
    ? `https://thebasemovement.com/register?ref=${userRegNo}`
    : 'https://thebasemovement.com/register'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      referralService.getMyReferrals(),
      referralService.getMyReferralStats(),
      referralService.getReferralLeaderboard(userRegNo),
    ])
      .then(([refs, s, lb]) => {
        if (cancelled) return
        setReferrals(refs)
        setStats(s)
        setLeaderboard(lb)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userRegNo])

  const kpis = [
    {
      label: 'Total Referred',
      value: loading ? '—' : String(stats.total),
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Active Members',
      value: loading ? '—' : String(stats.active),
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Pending',
      value: loading ? '—' : String(stats.pending),
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Points Earned',
      value: loading ? '—' : String(stats.pointsEarned),
      bar: 'hsl(var(--destructive))',
    },
  ]

  return (
    <div className="main">
      <SEO
        title="My Referrals | The Base Movement"
        description="Track the patriots you've invited to The Base Movement."
      />

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          My Referrals
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Patriots you brought into The Base Movement
        </p>
      </div>

      {/* KPI row */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Referral list panel */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {/* Panel header */}
        <div className="ph" style={{ padding: '14px 20px' }}>
          <p
            style={{
              margin: 0,
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Your Referrals
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => setShareOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              share
            </span>
            Share Link
          </button>
        </div>

        {/* List body */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : referrals.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 48,
                  color: 'hsl(var(--on-surface-muted))',
                  fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48",
                }}
              >
                group_add
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                No referrals yet — share your link to invite patriots.
              </p>
              <button className="btn btn-outline btn-sm" onClick={() => setShareOpen(true)}>
                Share your link
              </button>
            </div>
          ) : (
            referrals.map((m) => <ReferralCard key={m.id} member={m} />)
          )}
        </div>
      </div>

      {/* Leaderboard panel */}
      {!loading && leaderboard.length > 0 && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ph" style={{ padding: '14px 20px' }}>
            <p
              style={{
                margin: 0,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Top Referrers
            </p>
          </div>
          <div style={{ paddingBottom: 8 }}>
            {leaderboard.map((entry, i) => (
              <div
                key={entry.referrerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  background: entry.isCurrentUser ? 'hsl(var(--primary) / 0.06)' : undefined,
                  borderBottom:
                    i < leaderboard.length - 1 ? '1px solid hsl(var(--border))' : undefined,
                }}
              >
                <span
                  style={{
                    width: 20,
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textAlign: 'center',
                    flexShrink: 0,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {i + 1}
                </span>
                {/* Avatar */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'hsl(var(--primary))',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {entry.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: entry.isCurrentUser
                      ? 'var(--font-weight-medium, 500)'
                      : 'var(--font-weight-normal, 400)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {entry.isCurrentUser ? 'You' : entry.name}
                </span>
                {/* Count */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {entry.referralCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Invite others to join The Base"
        url={shareUrl}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/dashboard/Referrals.tsx
git commit -m "feat(ui): add Referrals dashboard page with KPIs, list, and leaderboard"
```

---

### Task 6: Wire Routes and Sidebar

**Files:**

- Modify: `src/routes.tsx`
- Modify: `src/components/DashboardLayout.tsx`

- [ ] **Step 1: Add lazy import + route in `src/routes.tsx`**

Add after line 91 (`const MyDonations = lazy(...)`):

```tsx
const Referrals = lazy(() => import('./pages/dashboard/Referrals'))
```

Add after line 164 (`{ path: '/dashboard/my-donations', element: <MyDonations /> },`):

```tsx
{ path: '/dashboard/referrals', element: <Referrals /> },
```

- [ ] **Step 2: Add page title in `DashboardLayout.tsx`**

In the `getPageTitle()` function, find the block ending with `return 'Member Portal'` and add before it:

```tsx
if (path === '/dashboard/referrals') return 'Referrals'
```

- [ ] **Step 3: Add `referralCount` state and fetch in `DashboardLayout.tsx`**

After the existing `const [likedCount, setLikedCount] = useState(0)` line, add:

```tsx
const [referralCount, setReferralCount] = useState(0)
```

Inside the `useEffect` that syncs liked posts (the one with `fetchLikedCount`), add a parallel fetch after `fetchLikedCount()`:

```tsx
const fetchReferralCount = async () => {
  try {
    const { referralService } = await import('@/services/referralService')
    const refs = await referralService.getMyReferrals()
    setReferralCount(refs.length)
  } catch {
    /* non-critical */
  }
}
fetchReferralCount()
```

- [ ] **Step 4: Add nav item to sidebar Personal group in `DashboardLayout.tsx`**

Find the `Personal` group items array:

```tsx
{
  label: 'Personal',
  items: [
    { to: '/dashboard/liked', icon: 'favorite', label: 'Liked Posts' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
  ],
},
```

Add the referrals item between liked and settings:

```tsx
{
  label: 'Personal',
  items: [
    { to: '/dashboard/liked', icon: 'favorite', label: 'Liked Posts' },
    { to: '/dashboard/referrals', icon: 'group_add', label: 'Referrals' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
  ],
},
```

- [ ] **Step 5: Add referralCount badge to sidebar**

In the sidebar nav item rendering, find the block that shows the `likedCount` badge (looks for `item.to === '/dashboard/liked' && likedCount > 0`). Directly below the liked-count badge code (inside the same span that wraps the label), add a referral count badge using the same pattern:

```tsx
{
  item.to === '/dashboard/referrals' && referralCount > 0 && (
    <span
      style={{
        background: 'hsl(var(--accent))',
        color: '#181d19',
        fontSize: 10,
        fontWeight: 600,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        marginLeft: 8,
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {referralCount}
    </span>
  )
}
```

Also add the collapsed-sidebar dot badge for referrals (same position as the liked collapsed badge):

```tsx
{
  item.to === '/dashboard/referrals' && referralCount > 0 && isSidebarCollapsed && (
    <span
      style={{
        position: 'absolute',
        top: 10,
        right: 18,
        background: 'hsl(var(--accent))',
        color: '#181d19',
        fontSize: 9,
        fontWeight: 'bold',
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 3px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {referralCount}
    </span>
  )
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Smoke test**

Open `http://localhost:3000/dashboard/referrals` in the browser.
Expected:

- Page loads with "My Referrals" heading
- 4 KPI tiles visible
- "Your Referrals" panel with Share Link button
- "Referrals" nav item visible in sidebar under Personal group

- [ ] **Step 8: Commit**

```bash
git add src/routes.tsx src/components/DashboardLayout.tsx
git commit -m "feat(nav): add /dashboard/referrals route and sidebar nav item"
```

---

### Task 7: Integrate RPCs into Registration and Verification Flows

**Files:**

- Modify: `src/services/registrationService.ts` (lines 104-106)
- Modify: `src/services/memberService.ts` (lines 368-374)

- [ ] **Step 1: Call `award_referral_points` in `registrationService.ts`**

After line `if (dbError) throw dbError` (line 104), add — non-blocking fire-and-forget:

```typescript
// Award referral points to the referrer — fire-and-forget, must not block registration
if (refParam && authData.user?.id) {
  supabase
    .rpc('award_referral_points', { p_new_member_id: authData.user.id })
    .then(({ error }) => {
      if (error) console.warn('[referral] registration points RPC failed:', error)
    })
    .catch(() => {})
}
```

- [ ] **Step 2: Call `award_referral_verification_bonus` in `memberService.ts`**

In `memberService.verifyMember()`, after `return true` (the happy-path return on line 373), modify the method to call the bonus RPC when `approve` is true. Replace the end of the method:

```typescript
// Before (lines 368-374):
if (error) {
  console.error('[DATABASE] Member verification failed:', error)
  return false
}

return true

// After:
if (error) {
  console.error('[DATABASE] Member verification failed:', error)
  return false
}

// Award verification bonus to the referrer — fire-and-forget
if (approve) {
  supabase
    .from('users')
    .select('id')
    .eq('registration_number', id)
    .single()
    .then(({ data: member }) => {
      if (member?.id) {
        supabase
          .rpc('award_referral_verification_bonus', { p_member_id: member.id })
          .then(({ error: rpcErr }) => {
            if (rpcErr) console.warn('[referral] verification bonus RPC failed:', rpcErr)
          })
          .catch(() => {})
      }
    })
    .catch(() => {})
}

return true
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify end-to-end manually**

1. Register a new test member using a share link (`/register?ref=TBM-GH-XXXX`)
2. Check the `referral_awards` table in Supabase — should have one row with `award_type = 'registration'`, `points = 50`
3. Check the referrer's `users.points` — should have increased by 50
4. Go to `/admin/verification`, approve the new member
5. Check `referral_awards` — should now have a second row with `award_type = 'verification'`, `points = 25`
6. Check referrer's `users.points` — should have increased by 25 more
7. Visit `/dashboard/referrals` as the referrer — new member card should appear with `+50 pts` chip and `+25 bonus ✓` chip

- [ ] **Step 5: Commit and push**

```bash
git add src/services/registrationService.ts src/services/memberService.ts
git commit -m "feat(integration): award referral points on registration and verification"
git push
```
