# Constituencies & Chapters Split — Design Spec

**Date:** 2026-05-30  
**Status:** Approved

## Goal

Replace Ghana-based chapters with constituencies as the primary grouping unit for Ghana Network members. Chapters remain, but are Diaspora-only going forward. Members are auto-assigned to their constituency based on the `users.constituency` field set at registration — no join/request flow needed.

---

## Database

### Migration 1 — Extend `ghana_constituencies` in place

Add hub columns directly to the existing reference table. No new table for hub data.

```sql
ALTER TABLE ghana_constituencies
  ADD COLUMN leader_id        UUID REFERENCES users(id),
  ADD COLUMN leader_name      VARCHAR(255),
  ADD COLUMN description      TEXT,
  ADD COLUMN status           VARCHAR(50) DEFAULT 'Active',
  ADD COLUMN meeting_schedule TEXT,
  ADD COLUMN local_focus      TEXT,
  ADD COLUMN email            VARCHAR(255),
  ADD COLUMN phone_number     VARCHAR(255);

CREATE TABLE constituency_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id INTEGER NOT NULL REFERENCES ghana_constituencies(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  type            VARCHAR(100),
  activity_date   DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### Migration 2 — Delete Ghana chapters

```sql
-- Clear chapter membership for any user assigned to a Ghana chapter
UPDATE users
SET chapter = NULL
WHERE chapter IN (
  SELECT name FROM chapters WHERE country = 'Ghana' OR country IS NULL
);

-- Remove dependent rows first (FK constraints)
DELETE FROM chapter_requests
WHERE chapter_id IN (
  SELECT id FROM chapters WHERE country = 'Ghana' OR country IS NULL
);

DELETE FROM chapter_leaders
WHERE chapter_id IN (
  SELECT id FROM chapters WHERE country = 'Ghana' OR country IS NULL
);

DELETE FROM chapter_activities
WHERE chapter_id IN (
  SELECT id FROM chapters WHERE country = 'Ghana' OR country IS NULL
);

-- Remove all Ghana chapter rows
DELETE FROM chapters WHERE country = 'Ghana' OR country IS NULL;
```

After this migration the `chapters` table contains only Diaspora rows. No `platform` column is needed — the invariant is enforced by the data.

---

## Service Layer

### `chapterService.ts` — minimal change

Add `.neq('country', 'Ghana')` to the `getChapters()` Supabase query as a safety filter. All other methods unchanged.

### New `src/services/constituencyService.ts`

Mirrors the shape of `chapterService`. Key methods:

| Method                                  | Description                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `getConstituencies()`                   | Fetches all `ghana_constituencies` rows with region join and live member counts (`COUNT` from `users WHERE constituency = name`) |
| `getConstituencyBySlug(slug)`           | Looks up by name → slug conversion (lowercase + hyphenate)                                                                       |
| `getConstituencyActivities(id)`         | Fetches `constituency_activities` for one constituency                                                                           |
| `addActivity(constituencyId, activity)` | Inserts into `constituency_activities`                                                                                           |
| `updateConstituency(id, patch)`         | Updates hub columns (leader, description, etc.) — admin only                                                                     |

### `Constituency` type

```ts
interface Constituency {
  id: number // SERIAL from ghana_constituencies
  name: string
  regionId: number
  regionName: string
  memberCount: number // live count from users table
  leaderId?: string
  leaderName?: string
  leaderAvatarUrl?: string
  description?: string
  status: string
  meetingSchedule?: string
  localFocus?: string
  email?: string
  phoneNumber?: string
  activities?: ConstituencyActivity[]
}

interface ConstituencyActivity {
  id: string
  title: string
  description?: string
  type: string
  activityDate: string
}
```

### `ChaptersContext` / `adminService`

`adminService.getChapters()` gains `.neq('country', 'Ghana')`. No shape change, no new context. Constituency pages fetch directly via `constituencyService`.

---

## Routing

### New routes (add to `src/routes.tsx`)

```
/dashboard/constituencies          → src/pages/Constituencies.tsx
/dashboard/constituencies/:slug    → src/pages/ConstituencyDetails.tsx
/admin/constituencies              → src/pages/admin/Constituencies.tsx
/admin/constituencies/:id          → src/pages/admin/ConstituencyLeadHub.tsx
```

No `WithChapters` wrapper on constituency routes — they fetch independently.

---

## Pages

### `/dashboard/constituencies` — `src/pages/Constituencies.tsx`

- Region filter tabs (all 16 Ghana regions)
- Grid of constituency cards: name, region, member count, coordinator name, status pill
- The logged-in member's own constituency is highlighted (match via `users.constituency`)
- No join/request flow — membership is automatic

### `/dashboard/constituencies/:slug` — `src/pages/ConstituencyDetails.tsx`

Full hub page mirroring the existing `ChapterHub`:

- Header: constituency name, region, coordinator info, member count
- Tabs: **Members** | **Activities**
- Members tab: all users whose `users.constituency` matches this constituency name
- Activities tab: `constituency_activities` rows for this constituency

### `/admin/constituencies` — `src/pages/admin/Constituencies.tsx`

- KPI strip: total constituencies, active count, unled count (no leader assigned), total members across all
- Searchable + region-filterable table of all constituencies
- Columns: name, region, members, leader, status
- Row actions: assign leader, edit details, view hub

### `/admin/constituencies/:id` — `src/pages/admin/ConstituencyLeadHub.tsx`

Admin hub detail, mirrors `src/pages/admin/ChapterLeadHub.tsx`:

- Constituency header with KPIs
- Manage activities (add/remove)
- Reassign coordinator
- Member list with verification status

---

## Existing Pages — Changes

| File                                 | Change                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `src/pages/Chapters.tsx`             | Remove Ghana tab; page becomes Diaspora-only. Tab label → "Chapters"                                  |
| `src/pages/admin/Chapters.tsx`       | Remove Ghana network filter; Diaspora-only                                                            |
| `src/components/DashboardLayout.tsx` | Add "Constituencies" nav link (visible to Ghana Network members only); Diaspora members do not see it |

---

## Auto-Assignment Logic

No join flow. A Ghana Network member's constituency is read from `users.constituency` (set at registration). The constituency pages simply query `users WHERE constituency = $name` to build the member list. This means:

- Members who registered without selecting a constituency appear in no constituency hub until their profile is updated
- Admin can bulk-assign by updating `users.constituency` directly

---

## Out of Scope

- Public-facing constituency directory (not requested)
- Migrating existing Ghana chapter activity/leader data (Ghana chapters had no meaningful data — all were seeded as Pending with no leaders)
- `chapter_requests` cleanup (Ghana chapter request rows will be orphaned once chapter rows are deleted — a separate cleanup migration can handle these)
