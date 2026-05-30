# Referral System Design

**Date:** 2026-05-30
**Status:** Approved
**Scope:** Member dashboard (`/dashboard/referrals`) + points awarding + leaderboard

---

## Overview

Members share a unique referral link (`/register?ref={regNo}`). When someone registers through that link, the referrer earns points. A new dashboard page lets members see who they referred, track points earned, and compare against other top referrers on a leaderboard.

The data foundation already exists: `users.referred_by` stores the referrer's reg number, and `member_points` holds the points ledger. This feature builds the awarding logic and UI on top of what's there.

---

## Points Rules

| Event                                     | Points          |
| ----------------------------------------- | --------------- |
| Referral successfully registers           | +50 pts         |
| Referral reaches Active / Verified status | +25 pts (bonus) |

Points are awarded once per event per referred member — no double-awarding. Both rules are enforced in the database via `SECURITY DEFINER` functions, not in client code.

---

## Architecture

### Database

**Actual schema (confirmed):**

- Points are stored on `users.points` (bigint) — not in `member_points` (that table is empty/unused)
- `users.referred_by` (text) stores the referrer's `registration_number`
- `users.registration_number` (varchar) is the unique reg number per member
- `users.joined_at` (timestamptz) is the join date

**New table: `referral_awards`**

```sql
CREATE TABLE public.referral_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id),
  referred_member_id uuid NOT NULL REFERENCES users(id),
  award_type text NOT NULL CHECK (award_type IN ('registration', 'verification')),
  points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_member_id, award_type)
);
```

This serves two purposes: idempotency guard (unique constraint prevents double-awarding) and the data source for `verificationBonusAwarded` on each card.

**Two new RPC functions:**

**`award_referral_points(p_new_member_id uuid)`**

- Looks up `referred_by` on the new member row to get the referrer's `registration_number`
- Finds the referrer's `id` via `registration_number`
- Inserts into `referral_awards (referrer_id, referred_member_id, award_type='registration', points=50)` — unique constraint prevents double-awarding
- On success: `UPDATE users SET points = points + 50 WHERE id = referrer_id`
- Returns `void`

**`award_referral_verification_bonus(p_member_id uuid)`**

- Called when admin sets status to `'Active'` or `'Approved'`
- Same referrer lookup via `referred_by` → `registration_number` → `id`
- Inserts into `referral_awards` with `award_type='verification', points=25` — unique constraint prevents double-awarding
- On success: `UPDATE users SET points = points + 25 WHERE id = referrer_id`
- Returns `void`

Both functions: `SECURITY DEFINER`, `REVOKE EXECUTE FROM PUBLIC/anon`, `GRANT EXECUTE TO authenticated`.

### Service (`src/services/referralService.ts`)

| Method                     | Returns                       | Description                                                                |
| -------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `getMyReferrals()`         | `Promise<ReferredMember[]>`   | Members where `referred_by = currentUser.regNo`, ordered `created_at DESC` |
| `getMyReferralStats()`     | `Promise<ReferralStats>`      | `{ total, active, pending, pointsEarned }`                                 |
| `getReferralLeaderboard()` | `Promise<LeaderboardEntry[]>` | Top 10 referrers by referral count, with current user's rank injected      |

### Types (`src/types/referrals.ts`)

```ts
export interface ReferredMember {
  id: string
  name: string // users.full_name
  registrationNumber: string // users.registration_number
  platform: 'GHANA' | 'DIASPORA'
  region?: string
  constituency?: string
  country?: string
  status: string
  avatarUrl?: string | null
  joinedAt: string // users.joined_at
  verificationBonusAwarded: boolean // from referral_awards table
}

export interface ReferralStats {
  total: number
  active: number
  pending: number
  pointsEarned: number
}

export interface ReferralLeaderboardEntry {
  regNo: string
  name: string
  avatarUrl?: string | null
  referralCount: number
  isCurrentUser: boolean
}
```

### Caller integration

**Registration:** `registrationService.submit()` calls `supabase.rpc('award_referral_points', { p_new_member_id: newMemberId })` after the DB insert succeeds, if `refParam` is set.

**Verification:** The admin service method that sets member status to Active/Approved calls `supabase.rpc('award_referral_verification_bonus', { p_member_id: memberId })` after the status update.

---

## UI

### New route

`/dashboard/referrals` — lazy-loaded in `src/routes.tsx`

### Files

| File                                             | Action                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Supabase DB                                      | Create `referral_awards` table + migration                                       |
| Supabase DB                                      | Create `award_referral_points` RPC function                                      |
| Supabase DB                                      | Create `award_referral_verification_bonus` RPC function                          |
| `src/types/referrals.ts`                         | Create                                                                           |
| `src/services/referralService.ts`                | Create                                                                           |
| `src/pages/dashboard/Referrals.tsx`              | Create — page shell, state, data fetching                                        |
| `src/pages/dashboard/referrals/ReferralCard.tsx` | Create — single referred member card                                             |
| `src/components/DashboardLayout.tsx`             | Add "Referrals" nav item under Personal group                                    |
| `src/routes.tsx`                                 | Add lazy route for `/dashboard/referrals`                                        |
| `src/services/registrationService.ts`            | Call `award_referral_points` RPC after insert                                    |
| `src/services/adminService.ts`                   | Call `award_referral_verification_bonus` RPC on status update to Active/Approved |

### Page layout (`Referrals.tsx`)

**KPI row (4 tiles):**

- Total Referred (charcoal bar)
- Active Members (green bar)
- Pending (gold bar)
- Points Earned (red bar)

**Referral list — stacked cards:**

```
┌──────────────────────────────────────────────────┐
│ Kwame Mensah                        ● Active      │
│ Ghana Network · Ashanti Region                    │
│ Joined 12 May 2026        +50 pts  +25 bonus ✓   │
└──────────────────────────────────────────────────┘
```

- Avatar (initials fallback) + name + platform/region line + join date
- Status badge (pill-ok / pill-warn / pill-mute)
- Points chips: `+50 pts` always shown; `+25 bonus` shown only if `verificationBonusAwarded`
- Empty state: icon + "No referrals yet — share your link to invite patriots." + Share button (opens existing ShareModal)
- Loading state: 3 skeleton cards

### ReferralCard fields

- Member name (medium weight)
- Platform + region/country (muted, 13px)
- Join date (`toLocaleDateString`, UTC)
- Status badge
- Points earned chips (right-aligned)

### Leaderboard (bottom of same page)

Panel titled "Top Referrers" — table of top 10:

```
#   Name                    Referrals
1   Kofi Asante             34
2   Abena Frimpong          28
3   You  ←──── highlighted  12
```

- Current user row highlighted with `background: hsl(var(--primary) / 0.08)`
- If current user is not in top 10, append their row at the bottom with actual rank
- Avatar (24px circle) + name + count
- No pagination — top 10 only

### Sidebar

Add to `DashboardLayout.tsx` Personal group:

```tsx
{ to: '/dashboard/referrals', icon: 'group_add', label: 'Referrals' }
```

Badge: total referral count (same pattern as Liked Posts badge).

---

## Error Handling

| Condition                                 | Behaviour                                                |
| ----------------------------------------- | -------------------------------------------------------- |
| `getMyReferrals()` fails                  | Toast error, show empty state                            |
| `award_referral_points` RPC fails         | Log warning, registration still succeeds (non-blocking)  |
| `award_referral_verification_bonus` fails | Log warning, status update still succeeds (non-blocking) |
| No referrer on new member                 | RPC is not called — skip silently                        |

---

## Out of Scope

- Multi-level / recursive referral trees
- Points varying by membership tier of the referred member
- Withdrawing or redeeming referral points (separate feature)
- Email notifications to the referrer when their referral registers
- Admin view of referral chains (can use existing member profile `referred_by` field)
