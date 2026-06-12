# User Activity Log — Implementation Guide — 2026-05-28

## Overview

Adds a per-member activity log to the dashboard: a recent activity panel on the dashboard home and a dedicated `/dashboard/activity` page. Tracks 7 days of member actions. Also restricts the Tawk.to live chat widget to public and dashboard pages only (excluding the admin panel).

---

## 1. Database

### Table: `user_activity_logs`

```sql
create table public.user_activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  description text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index on public.user_activity_logs (user_id, created_at desc);
```

**`action_type` values:** `login` | `logout` | `profile_update` | `donation` | `poll_vote` | `store_order` | `password_change`

### RLS Policies

```sql
alter table public.user_activity_logs enable row level security;

-- Members can only read their own logs
create policy "members_read_own_activity"
  on public.user_activity_logs for select
  using (auth.uid() = user_id);

-- No client-side inserts — writes go through service role only
```

### 7-Day Cleanup (pg_cron)

```sql
create or replace function delete_old_activity_logs()
returns void language sql as $$
  delete from public.user_activity_logs
  where created_at < now() - interval '7 days';
$$;

select cron.schedule(
  'cleanup-activity-logs',
  '0 0 * * *',
  'select delete_old_activity_logs()'
);
```

---

## 2. Service Layer

**File:** `src/services/userActivityService.ts`

### `logActivity(action_type, description, metadata?)`

Inserts a row using the Supabase client. Called at action points — the service is responsible for attaching the current `auth.uid()` from the session.

### `getUserActivity(userId, limit?)`

Fetches rows for the given user within the last 7 days, ordered by `created_at DESC`. Default limit: 20 rows (panel uses 5, full page uses 20+).

```ts
// Shape returned to UI
interface ActivityEntry {
  id: string
  action_type: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}
```

---

## 3. Log Call Sites

| Action          | File                               | Trigger point                                     |
| --------------- | ---------------------------------- | ------------------------------------------------- |
| Login           | `src/context/AuthContext.tsx`      | After `supabase.auth.signInWithPassword` succeeds |
| Logout          | `src/context/AuthContext.tsx`      | Inside `logout()` before sign-out                 |
| Profile update  | `src/pages/dashboard/Settings.tsx` | After successful profile save                     |
| Password change | `src/pages/dashboard/Settings.tsx` | After successful password update                  |
| Donation        | `src/services/donationService.ts`  | After payment confirmation                        |
| Poll vote       | `src/services/pollService.ts`      | After vote insert                                 |
| Store order     | Checkout page                      | After order confirmation                          |

---

## 4. UI Components

### 4a. RecentActivityPanel (Dashboard Home)

**Location:** Added to `src/pages/dashboard/Dashboard.tsx`

- Fetches last 5 activity entries on mount
- Renders as a `.panel` with a list of entries (icon + description + relative time)
- "View all activity" link navigates to `/dashboard/activity`
- Shows a muted empty state if no activity yet

**Icon map by action_type:**

| action_type       | Material Symbol      |
| ----------------- | -------------------- |
| `login`           | `login`              |
| `logout`          | `logout`             |
| `profile_update`  | `manage_accounts`    |
| `password_change` | `lock_reset`         |
| `donation`        | `volunteer_activism` |
| `poll_vote`       | `how_to_vote`        |
| `store_order`     | `shopping_bag`       |

### 4b. Activity Page (`/dashboard/activity`)

**Route:** `/dashboard/activity` — lazy loaded in `src/routes.tsx`

**File:** `src/pages/dashboard/Activity.tsx`

- Full list of activity entries for the past 7 days
- Grouped by date (Today, Yesterday, then date headings)
- Each entry: icon + description + timestamp
- Empty state if no activity in the past 7 days
- Uses `AdminPageHeader` equivalent for dashboard (page title "My Activity")

---

## 5. Tawk.to Widget Restriction

**Current state:** `<TawkChat />` is mounted in `App.tsx` — appears on all pages including admin.

**Fix:** Move `<TawkChat />` out of `App.tsx` and into `PublicLayout` and `DashboardLayout` only. Remove it from `AdminLayout`.

**Files to update:**

- `src/App.tsx` — remove `<TawkChat />`
- `src/components/layouts/PublicLayout.tsx` (or equivalent) — add `<TawkChat />`
- `src/components/DashboardLayout.tsx` — add `<TawkChat />`
- `src/components/layouts/AdminLayout.tsx` — do not add

---

## 6. File Checklist

- [ ] Supabase migration: `user_activity_logs` table + RLS + pg_cron job
- [ ] `src/services/userActivityService.ts` — new file
- [ ] `src/context/AuthContext.tsx` — log login + logout
- [ ] `src/pages/dashboard/Settings.tsx` — log profile_update + password_change
- [ ] `src/services/donationService.ts` — log donation
- [ ] `src/services/pollService.ts` — log poll_vote
- [ ] Checkout page — log store_order
- [ ] `src/pages/dashboard/Dashboard.tsx` — add RecentActivityPanel
- [ ] `src/pages/dashboard/Activity.tsx` — new page
- [ ] `src/routes.tsx` — add `/dashboard/activity` route
- [ ] `src/App.tsx` — remove `<TawkChat />`
- [ ] `src/components/DashboardLayout.tsx` — add `<TawkChat />`
- [ ] Public layout file — add `<TawkChat />`
