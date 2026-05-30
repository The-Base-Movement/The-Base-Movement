# Constituencies & Chapters Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Ghana-based chapters with constituencies backed by the existing `ghana_constituencies` table; keep chapters for Diaspora members only; add member dashboard and admin pages for constituency management.

**Architecture:** Extend `ghana_constituencies` in place with hub columns; delete Ghana rows from `chapters`; add a new `constituencyService`; filter `chapterService` to Diaspora only; add four new routes with two new member pages and two new admin pages; make the dashboard sidebar nav platform-aware.

**Tech Stack:** React 18 + TypeScript, Vite, React Router v6, Supabase (supabase-js), TailwindCSS + custom CSS design system, Material Symbols icons.

**Spec:** `docs/superpowers/specs/2026-05-30-constituencies-chapters-split-design.md`

---

## File Map

| Action      | Path                                               |
| ----------- | -------------------------------------------------- |
| Modify (DB) | `ghana_constituencies` table — add hub columns     |
| Create (DB) | `constituency_activities` table                    |
| Modify (DB) | `chapters` table — delete Ghana rows + clean users |
| Modify      | `src/types/admin.ts`                               |
| Create      | `src/services/constituencyService.ts`              |
| Modify      | `src/services/chapterService.ts`                   |
| Modify      | `src/pages/Chapters.tsx`                           |
| Modify      | `src/pages/chapters/DashboardKpiRow.tsx`           |
| Modify      | `src/pages/chapters/DashboardFilterControls.tsx`   |
| Modify      | `src/pages/chapters/PublicFilterSection.tsx`       |
| Modify      | `src/pages/chapters/PublicMobileFilterDrawer.tsx`  |
| Modify      | `src/pages/admin/Chapters.tsx`                     |
| Modify      | `src/routes.tsx`                                   |
| Modify      | `src/components/DashboardLayout.tsx`               |
| Create      | `src/pages/Constituencies.tsx`                     |
| Create      | `src/pages/ConstituencyDetails.tsx`                |
| Create      | `src/pages/admin/Constituencies.tsx`               |
| Create      | `src/pages/admin/ConstituencyLeadHub.tsx`          |

---

## Task 1: DB Migration 1 — Extend `ghana_constituencies`

**Files:** Supabase MCP `apply_migration`

- [ ] **Step 1: Apply migration via Supabase MCP**

```sql
ALTER TABLE ghana_constituencies
  ADD COLUMN IF NOT EXISTS leader_id        UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS leader_name      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS status           VARCHAR(50) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS meeting_schedule TEXT,
  ADD COLUMN IF NOT EXISTS local_focus      TEXT,
  ADD COLUMN IF NOT EXISTS email            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone_number     VARCHAR(255);

CREATE TABLE IF NOT EXISTS constituency_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id INTEGER NOT NULL REFERENCES ghana_constituencies(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  type            VARCHAR(100),
  activity_date   DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

- [ ] **Step 2: Verify**

Run in Supabase SQL editor:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ghana_constituencies'
ORDER BY ordinal_position;
```

Expected: `leader_id`, `leader_name`, `description`, `status`, `meeting_schedule`, `local_focus`, `email`, `phone_number` appear in the list.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): extend ghana_constituencies with hub columns + constituency_activities table"
```

---

## Task 2: Add `Constituency` Types to `src/types/admin.ts`

**Files:**

- Modify: `src/types/admin.ts`

- [ ] **Step 1: Append the two interfaces at the end of the file**

```ts
export interface Constituency {
  id: number
  name: string
  regionId: number
  regionName: string
  memberCount: number
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

export interface ConstituencyActivity {
  id: string
  title: string
  description?: string
  type: string
  activityDate: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/admin.ts
git commit -m "feat(types): add Constituency and ConstituencyActivity interfaces"
```

---

## Task 3: Create `src/services/constituencyService.ts`

**Files:**

- Create: `src/services/constituencyService.ts`

- [ ] **Step 1: Create the file**

```ts
import { supabase } from '@/lib/supabase'
import type { Constituency, ConstituencyActivity } from '@/types/admin'

export function constituencySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

class ConstituencyService {
  private static instance: ConstituencyService
  private constructor() {}

  static getInstance(): ConstituencyService {
    if (!ConstituencyService.instance) {
      ConstituencyService.instance = new ConstituencyService()
    }
    return ConstituencyService.instance
  }

  async getConstituencies(): Promise<Constituency[]> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('*, region:ghana_regions(name)')
      .order('name', { ascending: true })

    if (error) {
      console.error('[CONSTITUENCY] Fetch failed:', error)
      return []
    }

    const { data: memberRows } = await supabase
      .from('users')
      .select('constituency')
      .not('constituency', 'is', null)

    const liveCounts: Record<string, number> = {}
    ;(memberRows || []).forEach((u: { constituency: string | null }) => {
      if (u.constituency) {
        const key = u.constituency.toLowerCase()
        liveCounts[key] = (liveCounts[key] || 0) + 1
      }
    })

    const leaderIds = (data || [])
      .map((c) => c.leader_id as string | null)
      .filter(Boolean) as string[]

    const leaderAvatarMap: Record<string, string> = {}
    if (leaderIds.length > 0) {
      const { data: leaderRows } = await supabase
        .from('users')
        .select('id, avatar_url')
        .in('id', leaderIds)
      ;(leaderRows || []).forEach((u: { id: string; avatar_url: string | null }) => {
        if (u.id && u.avatar_url) leaderAvatarMap[u.id] = u.avatar_url
      })
    }

    return (data || []).map((c) => ({
      id: c.id as number,
      name: c.name as string,
      regionId: c.region_id as number,
      regionName: (c.region as { name: string } | null)?.name || '',
      memberCount: liveCounts[(c.name as string).toLowerCase()] ?? 0,
      leaderId: (c.leader_id as string | null) || undefined,
      leaderName: (c.leader_name as string | null) || undefined,
      leaderAvatarUrl: (c.leader_id && leaderAvatarMap[c.leader_id as string]) || undefined,
      description: (c.description as string | null) || undefined,
      status: (c.status as string) || 'Active',
      meetingSchedule: (c.meeting_schedule as string | null) || undefined,
      localFocus: (c.local_focus as string | null) || undefined,
      email: (c.email as string | null) || undefined,
      phoneNumber: (c.phone_number as string | null) || undefined,
    }))
  }

  async getConstituencyBySlug(slug: string): Promise<Constituency | null> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('*, region:ghana_regions(name)')

    if (error || !data) return null

    const row = data.find((c) => constituencySlug(c.name as string) === slug)
    if (!row) return null

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('constituency', row.name as string)

    let leaderAvatarUrl: string | undefined
    if (row.leader_id) {
      const { data: ld } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', row.leader_id as string)
        .maybeSingle()
      if (ld?.avatar_url) leaderAvatarUrl = ld.avatar_url as string
    }

    return {
      id: row.id as number,
      name: row.name as string,
      regionId: row.region_id as number,
      regionName: (row.region as { name: string } | null)?.name || '',
      memberCount: count || 0,
      leaderId: (row.leader_id as string | null) || undefined,
      leaderName: (row.leader_name as string | null) || undefined,
      leaderAvatarUrl,
      description: (row.description as string | null) || undefined,
      status: (row.status as string) || 'Active',
      meetingSchedule: (row.meeting_schedule as string | null) || undefined,
      localFocus: (row.local_focus as string | null) || undefined,
      email: (row.email as string | null) || undefined,
      phoneNumber: (row.phone_number as string | null) || undefined,
    }
  }

  async getConstituencyById(id: number): Promise<Constituency | null> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('*, region:ghana_regions(name)')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return null

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('constituency', data.name as string)

    let leaderAvatarUrl: string | undefined
    if (data.leader_id) {
      const { data: ld } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', data.leader_id as string)
        .maybeSingle()
      if (ld?.avatar_url) leaderAvatarUrl = ld.avatar_url as string
    }

    return {
      id: data.id as number,
      name: data.name as string,
      regionId: data.region_id as number,
      regionName: (data.region as { name: string } | null)?.name || '',
      memberCount: count || 0,
      leaderId: (data.leader_id as string | null) || undefined,
      leaderName: (data.leader_name as string | null) || undefined,
      leaderAvatarUrl,
      description: (data.description as string | null) || undefined,
      status: (data.status as string) || 'Active',
      meetingSchedule: (data.meeting_schedule as string | null) || undefined,
      localFocus: (data.local_focus as string | null) || undefined,
      email: (data.email as string | null) || undefined,
      phoneNumber: (data.phone_number as string | null) || undefined,
    }
  }

  async getConstituencyActivities(id: number): Promise<ConstituencyActivity[]> {
    const { data, error } = await supabase
      .from('constituency_activities')
      .select('*')
      .eq('constituency_id', id)
      .order('activity_date', { ascending: false })

    if (error) return []

    return (data || []).map((a) => ({
      id: a.id as string,
      title: a.title as string,
      description: (a.description as string | null) || undefined,
      type: a.type as string,
      activityDate: a.activity_date as string,
    }))
  }

  async addActivity(
    constituencyId: number,
    activity: { title: string; description?: string; type: string; activityDate: string }
  ): Promise<boolean> {
    const { error } = await supabase.from('constituency_activities').insert({
      constituency_id: constituencyId,
      title: activity.title,
      description: activity.description || null,
      type: activity.type,
      activity_date: activity.activityDate,
    })
    if (error) {
      console.error('[CONSTITUENCY] Add activity failed:', error)
      return false
    }
    return true
  }

  async deleteActivity(activityId: string): Promise<boolean> {
    const { error } = await supabase.from('constituency_activities').delete().eq('id', activityId)
    if (error) {
      console.error('[CONSTITUENCY] Delete activity failed:', error)
      return false
    }
    return true
  }

  async updateConstituency(
    id: number,
    patch: Partial<
      Pick<
        Constituency,
        | 'leaderId'
        | 'leaderName'
        | 'description'
        | 'status'
        | 'meetingSchedule'
        | 'localFocus'
        | 'email'
        | 'phoneNumber'
      >
    >
  ): Promise<boolean> {
    const updateData: Record<string, string | null | undefined> = {}
    if (patch.leaderId !== undefined) updateData.leader_id = patch.leaderId || null
    if (patch.leaderName !== undefined) updateData.leader_name = patch.leaderName || null
    if (patch.description !== undefined) updateData.description = patch.description || null
    if (patch.status !== undefined) updateData.status = patch.status
    if (patch.meetingSchedule !== undefined)
      updateData.meeting_schedule = patch.meetingSchedule || null
    if (patch.localFocus !== undefined) updateData.local_focus = patch.localFocus || null
    if (patch.email !== undefined) updateData.email = patch.email || null
    if (patch.phoneNumber !== undefined) updateData.phone_number = patch.phoneNumber || null

    const { error } = await supabase.from('ghana_constituencies').update(updateData).eq('id', id)

    if (error) {
      console.error('[CONSTITUENCY] Update failed:', error)
      return false
    }
    return true
  }
}

export const constituencyService = ConstituencyService.getInstance()
```

- [ ] **Step 2: Commit**

```bash
git add src/services/constituencyService.ts
git commit -m "feat(service): add constituencyService with CRUD for ghana_constituencies"
```

---

## Task 4: Filter `chapterService.getChapters()` to Diaspora Only

**Files:**

- Modify: `src/services/chapterService.ts` (line ~54 — the `.from('chapters').select(...)` call inside `getChapters()`)

- [ ] **Step 1: Add `.neq('country', 'Ghana')` to the query**

Find the `getChapters()` method. The query currently reads:

```ts
const { data, error } = await supabase
  .from('chapters')
  .select(
    `
    *,
    leadership:chapter_leaders(*),
    activities:chapter_activities(*)
  `
  )
  .order('name', { ascending: true })
```

Change to:

```ts
const { data, error } = await supabase
  .from('chapters')
  .select(
    `
    *,
    leadership:chapter_leaders(*),
    activities:chapter_activities(*)
  `
  )
  .neq('country', 'Ghana')
  .order('name', { ascending: true })
```

- [ ] **Step 2: Commit**

```bash
git add src/services/chapterService.ts
git commit -m "feat(service): filter chapterService.getChapters() to Diaspora only"
```

---

## Task 5: Simplify `src/pages/Chapters.tsx` to Diaspora-Only

**Files:**

- Modify: `src/pages/Chapters.tsx`
- Modify: `src/pages/chapters/DashboardKpiRow.tsx`
- Modify: `src/pages/chapters/DashboardFilterControls.tsx`
- Modify: `src/pages/chapters/PublicFilterSection.tsx`
- Modify: `src/pages/chapters/PublicMobileFilterDrawer.tsx`

Since all chapters from `ChaptersContext` are now Diaspora, remove the Ghana/Diaspora tab split.

- [ ] **Step 1: Update `DashboardKpiRow.tsx` — remove Ghana KPI**

Replace the entire file with:

```tsx
interface DashboardKpiRowProps {
  totalCount: number
  activeCount: number
  countryCount: number
}

export function DashboardKpiRow({ totalCount, activeCount, countryCount }: DashboardKpiRowProps) {
  const kpis = [
    {
      label: 'Diaspora chapters',
      value: totalCount,
      sub: 'International hubs',
      bar: 'hsl(var(--primary))',
      icon: 'public',
    },
    {
      label: 'Active chapters',
      value: activeCount,
      sub: 'Currently active',
      bar: 'hsl(var(--accent))',
      icon: 'check_circle',
    },
    {
      label: 'Countries',
      value: countryCount,
      sub: 'Global presence',
      bar: 'hsl(var(--on-surface))',
      icon: 'travel_explore',
    },
  ]

  return (
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
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {kpi.label}
            </span>
            <span
              className="material-symbols-outlined desktop-only"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}
            >
              {kpi.icon}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 'var(--kpi-num-size)',
              color: 'hsl(var(--on-surface))',
              lineHeight: 1,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            {kpi.value}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Update `DashboardFilterControls.tsx` — remove `activeTab`/`setActiveTab` props**

Open `src/pages/chapters/DashboardFilterControls.tsx`. Remove `activeTab` and `setActiveTab` from the props interface and destructuring. Remove the Ghana/Diaspora tab buttons block (the `<div>` containing the two tab buttons). Remove the `{activeTab === 'ghana' && ...}` conditional around the region filter — regions no longer apply to Diaspora-only chapters, so remove the region filter block entirely.

The props interface should become (remove `activeTab`, `setActiveTab`, keep the rest):

```ts
interface DashboardFilterControlsProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  selectedRegion: string
  setSelectedRegion: (v: string) => void
  regions: string[]
  chapters: Chapter[]
  sortOrder: 'az' | 'za' | 'members-desc' | 'members-asc'
  setSortOrder: (v: 'az' | 'za' | 'members-desc' | 'members-asc') => void
  showActiveOnly: boolean
  setShowActiveOnly: (v: boolean) => void
  onRequestChapter: () => void
}
```

Remove the `activeTab` and `setActiveTab` from the destructuring line as well.

- [ ] **Step 3: Update `PublicFilterSection.tsx` — remove `activeTab`/`setActiveTab` props**

Open `src/pages/chapters/PublicFilterSection.tsx`. Remove `activeTab` and `setActiveTab` from the props interface. Remove the Ghana button, Diaspora button, and the `{activeTab === 'ghana' && ...}` region dropdown block. The filter section becomes search-only (or search + sort).

- [ ] **Step 4: Update `PublicMobileFilterDrawer.tsx` — remove `activeTab`/`setActiveTab` props**

Open `src/pages/chapters/PublicMobileFilterDrawer.tsx`. Remove `activeTab` and `setActiveTab` from the props interface and destructuring. Remove any tab button UI and the `activeTab === 'ghana'` region conditional.

- [ ] **Step 5: Update `Chapters.tsx` — remove Ghana/Diaspora split**

In `src/pages/Chapters.tsx`, make these changes:

a) Remove `activeTab` state and `setActiveTab` calls.

b) Remove `ghanaChapters` and `diasporaChapters` variables. Replace `activeChapters` with just `chapters`.

c) Update `filteredChapters` — remove the `activeTab` reference in the region filter:

```ts
const filteredChapters = chapters
  .filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city_or_region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = showActiveOnly ? c.status === 'Active' : true
    return matchSearch && matchStatus
  })
  .sort((a, b) => {
    if (sortOrder === 'az') return a.name.localeCompare(b.name)
    if (sortOrder === 'za') return b.name.localeCompare(a.name)
    if (sortOrder === 'members-desc') return (b.member_count || 0) - (a.member_count || 0)
    return (a.member_count || 0) - (b.member_count || 0)
  })
```

d) Update `DashboardKpiRow` call — replace props:

```tsx
<DashboardKpiRow
  totalCount={chapters.length}
  activeCount={chapters.filter((c) => c.status === 'Active').length}
  countryCount={new Set(chapters.map((c) => c.country)).size}
/>
```

e) Remove `activeTab` and `setActiveTab` from `sharedFilterProps`.

f) Remove `ghanaCount` and `diasporaCount` from any remaining usage.

- [ ] **Step 6: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors before committing.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Chapters.tsx src/pages/chapters/DashboardKpiRow.tsx src/pages/chapters/DashboardFilterControls.tsx src/pages/chapters/PublicFilterSection.tsx src/pages/chapters/PublicMobileFilterDrawer.tsx
git commit -m "feat(chapters): simplify to Diaspora-only — remove Ghana tab and region filter"
```

---

## Task 6: Update Admin `Chapters.tsx` — Remove Ghana Network Filter

**Files:**

- Modify: `src/pages/admin/Chapters.tsx`

- [ ] **Step 1: Remove `networkFilter` state and Ghana option**

In `src/pages/admin/Chapters.tsx`:

a) Remove the `networkFilter` state: ~~`const [networkFilter, setNetworkFilter] = useState<'All' | 'Ghana' | 'Diaspora'>('All')`~~

b) Remove `ghanaRegions` state and its fetch from `adminService.getRegions()` — Diaspora chapters don't use Ghana regions.

c) In `availableRegions` memo, remove the `networkFilter === 'Ghana'` branch:

```ts
const availableRegions = useMemo(() => {
  const set = new Set(chapters.filter((c) => c.region).map((c) => c.region!))
  return Array.from(set).sort()
}, [chapters])
```

d) In `filteredChapters` memo, remove the `matchesNetwork` variable and its `.filter` condition.

e) Remove any UI elements (buttons/dropdown) that render the `networkFilter` selector. Search for `networkFilter` in the JSX and remove those elements.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Chapters.tsx
git commit -m "feat(admin): remove Ghana network filter from Chapters — Diaspora only"
```

---

## Task 7: Add Constituency Routes to `src/routes.tsx`

**Files:**

- Modify: `src/routes.tsx`

- [ ] **Step 1: Add lazy imports at the top of the file (after the existing dashboard lazy imports block)**

After line 93 (`const Referrals = lazy(...)`), add:

```ts
const Constituencies = lazy(() => import('./pages/Constituencies'))
const ConstituencyDetails = lazy(() => import('./pages/ConstituencyDetails'))
const AdminConstituencies = lazy(() => import('./pages/admin/Constituencies'))
const AdminConstituencyLeadHub = lazy(() => import('./pages/admin/ConstituencyLeadHub'))
```

- [ ] **Step 2: Add dashboard routes**

Inside the `DashboardLayout` children array (after the `referrals` route at line 166), add:

```ts
{ path: '/dashboard/constituencies', element: <Constituencies /> },
{ path: '/dashboard/constituencies/:slug', element: <ConstituencyDetails /> },
```

- [ ] **Step 3: Add admin routes**

Inside the `AdminLayout` children array (after the `WithChapters` block at line ~198), add:

```ts
{ path: '/admin/constituencies', element: <AdminConstituencies /> },
{ path: '/admin/constituencies/:id', element: <AdminConstituencyLeadHub /> },
```

- [ ] **Step 4: Commit**

```bash
git add src/routes.tsx
git commit -m "feat(routes): add /dashboard/constituencies and /admin/constituencies routes"
```

---

## Task 8: Update `DashboardLayout.tsx` — Platform-Aware Nav

**Files:**

- Modify: `src/components/DashboardLayout.tsx`

- [ ] **Step 1: Add state variables after the existing state declarations (around line 38)**

```ts
const [userPlatform, setUserPlatform] = useState<string | null>(null)
const [myConstituencyLink, setMyConstituencyLink] = useState<string | null>(null)
```

- [ ] **Step 2: Update `checkChapterRole()` to be platform-aware**

Replace the existing `checkChapterRole` function (inside the `useEffect` at line ~57) with:

```ts
const checkChapterRole = async () => {
  try {
    if (!session?.user) return

    const { data: userRow } = await supabase
      .from('users')
      .select('platform, constituency, chapter')
      .eq('id', session.user.id)
      .maybeSingle()

    const platform = (userRow?.platform as string) || 'GHANA'
    setUserPlatform(platform)

    if (platform === 'GHANA') {
      const constituency = userRow?.constituency as string | null
      if (constituency) {
        setMyConstituencyLink(
          `/dashboard/constituencies/${constituency
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')}`
        )
      }
      return
    }

    // DIASPORA: existing chapter link logic
    const [leadChapter, dbChapter] = await Promise.all([
      adminService.getLeadChapter(session.user.id),
      adminService.getUserChapter(session.user.id),
    ])

    if (leadChapter) {
      const slug = toSlug(leadChapter)
      setMyChapterLink({
        to: `/dashboard/chapters/${slug}`,
        icon: 'manage_accounts',
        subLinkTo: `/dashboard/chapter-hub/${slug}`,
      })
      return
    }

    if (dbChapter) {
      setMyChapterLink({
        to: `/dashboard/chapters/${toSlug(dbChapter)}`,
        icon: 'group',
      })
    }
  } catch {
    /* non-critical */
  }
}
```

Note: `supabase` needs to be imported if not already. Add at the top of the file:

```ts
import { supabase } from '@/lib/supabase'
```

- [ ] **Step 3: Add breadcrumb labels for constituency routes**

Find the breadcrumb helper function (around line 203, the block that checks `path ===`). Add after the chapters entries:

```ts
if (path === '/dashboard/constituencies') return 'Constituencies'
if (path.startsWith('/dashboard/constituencies/')) return 'Constituency'
```

- [ ] **Step 4: Update the Community nav section (around line 389)**

Replace the Community `items` array with a platform-conditional version:

```ts
{
  label: 'Community',
  items: [
    { to: '/dashboard/members', icon: 'groups', label: 'Members' },
    ...(userPlatform === 'GHANA'
      ? [
          {
            to: '/dashboard/constituencies',
            icon: 'location_city',
            label: 'Constituencies',
          },
          ...(myConstituencyLink
            ? [
                {
                  to: myConstituencyLink,
                  icon: 'my_location',
                  label: 'My Constituency',
                },
              ]
            : []),
        ]
      : [
          { to: '/dashboard/chapters', icon: 'account_balance', label: 'Chapters' },
          ...(myChapterLink
            ? [
                {
                  to: myChapterLink.to,
                  icon: myChapterLink.icon,
                  label: 'My Chapter',
                  subItems: myChapterLink.subLinkTo
                    ? [
                        {
                          to: myChapterLink.subLinkTo,
                          icon: 'manage_accounts',
                          label: 'Chapter Dashboard',
                        },
                      ]
                    : undefined,
                },
              ]
            : []),
        ]),
    { to: '/dashboard/leadership', icon: 'groups_3', label: 'Leadership' },
  ],
},
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 6: Commit**

```bash
git add src/components/DashboardLayout.tsx
git commit -m "feat(nav): platform-aware sidebar — Ghana members see Constituencies, Diaspora see Chapters"
```

---

## Task 9: Create `src/pages/Constituencies.tsx` — Member Dashboard Grid

**Files:**

- Create: `src/pages/Constituencies.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { constituencyService, constituencySlug } from '@/services/constituencyService'
import { supabase } from '@/lib/supabase'
import type { Constituency } from '@/types/admin'

const GHANA_REGIONS = [
  'All Regions',
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

export default function Constituencies() {
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [searchTerm, setSearchTerm] = useState('')
  const [myConstituency, setMyConstituency] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [all, session] = await Promise.all([
        constituencyService.getConstituencies(),
        supabase.auth.getSession(),
      ])
      setConstituencies(all)

      if (session.data.session?.user) {
        const { data } = await supabase
          .from('users')
          .select('constituency')
          .eq('id', session.data.session.user.id)
          .maybeSingle()
        setMyConstituency((data?.constituency as string | null) || null)
      }

      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = constituencies.filter((c) => {
    const matchRegion = selectedRegion === 'All Regions' || c.regionName === selectedRegion
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.regionName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchRegion && matchSearch
  })

  return (
    <div className="main">
      <div className="ph" style={{ marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Constituencies
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              margin: '4px 0 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Ghana Network — {constituencies.length} constituencies across 16 regions
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          {
            label: 'Total constituencies',
            value: constituencies.length,
            bar: 'hsl(var(--primary))',
            icon: 'location_city',
          },
          {
            label: 'With coordinators',
            value: constituencies.filter((c) => c.leaderId).length,
            bar: 'hsl(var(--accent))',
            icon: 'manage_accounts',
          },
          {
            label: 'Total members',
            value: constituencies.reduce((s, c) => s + c.memberCount, 0),
            bar: 'hsl(var(--on-surface))',
            icon: 'groups',
          },
        ].map((kpi) => (
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
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {kpi.label}
              </span>
              <span
                className="material-symbols-outlined desktop-only"
                style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}
              >
                {kpi.icon}
              </span>
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 'var(--kpi-num-size)',
                color: 'hsl(var(--on-surface))',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search constituencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            height: 36,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            boxSizing: 'border-box',
            width: 220,
          }}
        />
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{
            height: 36,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            boxSizing: 'border-box',
          }}
        >
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {(searchTerm || selectedRegion !== 'All Regions') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedRegion('All Regions')
            }}
          >
            Clear
          </button>
        )}
        <span
          style={{
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="panel"
              style={{ height: 120, background: 'hsl(var(--container-low))' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="panel"
          style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 12 }}>
            search_off
          </span>
          <p style={{ fontFamily: "'Public Sans', sans-serif", margin: 0 }}>
            No constituencies match your search.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((c) => {
            const isMyConstituency =
              myConstituency && c.name.toLowerCase() === myConstituency.toLowerCase()
            return (
              <Link
                key={c.id}
                to={`/dashboard/constituencies/${constituencySlug(c.name)}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="panel"
                  style={{
                    padding: '16px 18px 16px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    outline: isMyConstituency
                      ? '2px solid hsl(var(--primary))'
                      : '2px solid transparent',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: isMyConstituency
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--on-surface-muted))',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {c.regionName}
                    </span>
                    {isMyConstituency && (
                      <span className="pill pill-ok" style={{ fontSize: 10, padding: '2px 8px' }}>
                        Mine
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      margin: '0 0 8px',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {c.name}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    <span>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, verticalAlign: 'middle', marginRight: 3 }}
                      >
                        groups
                      </span>
                      {c.memberCount} member{c.memberCount !== 1 ? 's' : ''}
                    </span>
                    {c.leaderName && (
                      <span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 13, verticalAlign: 'middle', marginRight: 3 }}
                        >
                          manage_accounts
                        </span>
                        {c.leaderName}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Constituencies.tsx
git commit -m "feat(page): add /dashboard/constituencies member grid page"
```

---

## Task 10: Create `src/pages/ConstituencyDetails.tsx` — Member Hub

**Files:**

- Create: `src/pages/ConstituencyDetails.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { constituencyService } from '@/services/constituencyService'
import { supabase } from '@/lib/supabase'
import type { Constituency, ConstituencyActivity } from '@/types/admin'

interface ConstituencyMember {
  id: string
  name: string
  regNo: string
  constituency: string
  region: string
  status: string
  avatarUrl?: string
}

export default function ConstituencyDetails() {
  const { slug } = useParams<{ slug: string }>()
  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<ConstituencyMember[]>([])
  const [activities, setActivities] = useState<ConstituencyActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'activities'>('members')

  useEffect(() => {
    if (!slug) return

    const load = async () => {
      const c = await constituencyService.getConstituencyBySlug(slug)
      setConstituency(c)

      if (c) {
        const [acts, { data: memberRows }] = await Promise.all([
          constituencyService.getConstituencyActivities(c.id),
          supabase
            .from('users')
            .select('id, full_name, registration_number, constituency, region, status, avatar_url')
            .ilike('constituency', c.name)
            .is('deleted_at', null),
        ])

        setActivities(acts)
        setMembers(
          (memberRows || []).map((u) => ({
            id: u.id as string,
            name: (u.full_name as string) || 'Unknown',
            regNo: (u.registration_number as string) || '',
            constituency: (u.constituency as string) || '',
            region: (u.region as string) || '',
            status: (u.status as string) || 'Pending',
            avatarUrl: (u.avatar_url as string | null) || undefined,
          }))
        )
      }

      setIsLoading(false)
    }

    load()
  }, [slug])

  if (isLoading) {
    return (
      <div className="main">
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Loading constituency…
          </p>
        </div>
      </div>
    )
  }

  if (!constituency) {
    return (
      <div className="main">
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Constituency not found.{' '}
            <Link to="/dashboard/constituencies" style={{ color: 'hsl(var(--primary))' }}>
              Back to all constituencies
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      {/* Header */}
      <div
        className="panel"
        style={{ padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'hsl(var(--primary))',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Link
              to="/dashboard/constituencies"
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 8,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                arrow_back
              </span>
              Constituencies
            </Link>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 4px',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {constituency.name}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {constituency.regionName} Region
            </p>
          </div>
          <span className={`pill ${constituency.status === 'Active' ? 'pill-ok' : 'pill-warn'}`}>
            {constituency.status}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { icon: 'groups', label: `${members.length} member${members.length !== 1 ? 's' : ''}` },
            {
              icon: 'manage_accounts',
              label: constituency.leaderName
                ? `Coordinator: ${constituency.leaderName}`
                : 'No coordinator assigned',
            },
            ...(constituency.meetingSchedule
              ? [{ icon: 'event', label: constituency.meetingSchedule }]
              : []),
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {stat.icon}
              </span>
              {stat.label}
            </div>
          ))}
        </div>

        {constituency.description && (
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            {constituency.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['members', 'activities'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'members' && (
              <span
                style={{
                  marginLeft: 6,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0 6px',
                  fontSize: 11,
                }}
              >
                {members.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          {members.length === 0 ? (
            <p
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No members registered in this constituency yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Member', 'Reg No.', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'hsl(var(--container-low))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                            >
                              person
                            </span>
                          </div>
                        )}
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {m.regNo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`pill ${
                          m.status === 'Active' || m.status === 'Approved'
                            ? 'pill-ok'
                            : m.status === 'Pending'
                              ? 'pill-warn'
                              : 'pill-mute'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activities tab */}
      {activeTab === 'activities' && (
        <div>
          {activities.length === 0 ? (
            <div
              className="panel"
              style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, marginBottom: 12 }}
              >
                event_busy
              </span>
              <p style={{ fontFamily: "'Public Sans', sans-serif", margin: 0 }}>
                No activities recorded yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.map((a) => (
                <div key={a.id} className="panel" style={{ padding: '16px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          margin: '0 0 4px',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {a.title}
                      </p>
                      {a.description && (
                        <p
                          style={{
                            fontSize: 13,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: 0,
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {a.description}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <span
                        className="pill pill-mute"
                        style={{ fontSize: 11, marginBottom: 4, display: 'inline-block' }}
                      >
                        {a.type}
                      </span>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {new Date(a.activityDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ConstituencyDetails.tsx
git commit -m "feat(page): add /dashboard/constituencies/:slug hub page (members + activities)"
```

---

## Task 11: Create `src/pages/admin/Constituencies.tsx` — Admin Management Page

**Files:**

- Create: `src/pages/admin/Constituencies.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { constituencyService } from '@/services/constituencyService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Constituency } from '@/types/admin'

const GHANA_REGIONS = [
  'All Regions',
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

export default function AdminConstituencies() {
  const navigate = useNavigate()
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('All Regions')

  useEffect(() => {
    constituencyService.getConstituencies().then((all) => {
      setConstituencies(all)
      setIsLoading(false)
    })
  }, [])

  const filtered = constituencies.filter((c) => {
    const matchRegion = regionFilter === 'All Regions' || c.regionName === regionFilter
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.regionName.toLowerCase().includes(search.toLowerCase()) ||
      (c.leaderName || '').toLowerCase().includes(search.toLowerCase())
    return matchRegion && matchSearch
  })

  const totalMembers = constituencies.reduce((s, c) => s + c.memberCount, 0)
  const activeCount = constituencies.filter((c) => c.status === 'Active').length
  const unledCount = constituencies.filter((c) => !c.leaderId).length

  const kpis = [
    {
      label: 'Total constituencies',
      value: constituencies.length,
      bar: 'hsl(var(--primary))',
      icon: 'location_city',
    },
    { label: 'Active', value: activeCount, bar: 'hsl(var(--accent))', icon: 'check_circle' },
    { label: 'Unled', value: unledCount, bar: 'hsl(var(--destructive))', icon: 'person_off' },
    { label: 'Total members', value: totalMembers, bar: 'hsl(var(--on-surface))', icon: 'groups' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Constituencies"
        subtitle="Ghana Network — constituency management"
        icon="location_city"
      />

      {/* KPIs */}
      <div className="kpis" style={{ margin: '24px 0' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {kpi.label}
              </span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}
              >
                {kpi.icon}
              </span>
            </div>
            <div
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, region, or coordinator…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            height: 36,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            boxSizing: 'border-box',
            width: 280,
          }}
        />
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          style={{
            height: 36,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            boxSizing: 'border-box',
          }}
        >
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span
          style={{
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            alignSelf: 'center',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <p
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Loading…
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Constituency', 'Region', 'Members', 'Coordinator', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {c.name}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {c.regionName}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {c.memberCount}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: c.leaderName
                          ? 'hsl(var(--on-surface))'
                          : 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {c.leaderName || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`pill ${c.status === 'Active' ? 'pill-ok' : 'pill-warn'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/admin/constituencies/${c.id}`)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Constituencies.tsx
git commit -m "feat(admin): add /admin/constituencies management page"
```

---

## Task 12: Create `src/pages/admin/ConstituencyLeadHub.tsx` — Admin Hub Detail

**Files:**

- Create: `src/pages/admin/ConstituencyLeadHub.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { constituencyService } from '@/services/constituencyService'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Constituency, ConstituencyActivity } from '@/types/admin'

interface ConstituencyMember {
  id: string
  name: string
  regNo: string
  status: string
  avatarUrl?: string
}

export default function ConstituencyLeadHub() {
  const { id } = useParams<{ id: string }>()
  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<ConstituencyMember[]>([])
  const [activities, setActivities] = useState<ConstituencyActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'activities' | 'settings'>('members')

  // Activity form state
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actType, setActType] = useState('Meeting')
  const [actDate, setActDate] = useState('')
  const [isSavingAct, setIsSavingAct] = useState(false)

  // Settings form state
  const [leaderName, setLeaderName] = useState('')
  const [description, setDescription] = useState('')
  const [meetingSchedule, setMeetingSchedule] = useState('')
  const [email, setEmail] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const numericId = Number(id)

  const load = async () => {
    if (!numericId) return
    const c = await constituencyService.getConstituencyById(numericId)
    setConstituency(c)

    if (c) {
      const [acts, { data: memberRows }] = await Promise.all([
        constituencyService.getConstituencyActivities(c.id),
        supabase
          .from('users')
          .select('id, full_name, registration_number, status, avatar_url')
          .ilike('constituency', c.name)
          .is('deleted_at', null),
      ])
      setActivities(acts)
      setMembers(
        (memberRows || []).map((u) => ({
          id: u.id as string,
          name: (u.full_name as string) || 'Unknown',
          regNo: (u.registration_number as string) || '',
          status: (u.status as string) || 'Pending',
          avatarUrl: (u.avatar_url as string | null) || undefined,
        }))
      )
      setLeaderName(c.leaderName || '')
      setDescription(c.description || '')
      setMeetingSchedule(c.meetingSchedule || '')
      setEmail(c.email || '')
    }

    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!constituency || !actTitle || !actDate) return
    setIsSavingAct(true)
    const ok = await constituencyService.addActivity(constituency.id, {
      title: actTitle,
      description: actDesc || undefined,
      type: actType,
      activityDate: actDate,
    })
    if (ok) {
      toast.success('Activity added')
      setActTitle('')
      setActDesc('')
      setActDate('')
      const updated = await constituencyService.getConstituencyActivities(constituency.id)
      setActivities(updated)
    } else {
      toast.error('Failed to add activity')
    }
    setIsSavingAct(false)
  }

  const handleDeleteActivity = async (actId: string) => {
    if (!constituency) return
    const ok = await constituencyService.deleteActivity(actId)
    if (ok) {
      setActivities((prev) => prev.filter((a) => a.id !== actId))
      toast.success('Activity removed')
    } else {
      toast.error('Failed to remove activity')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!constituency) return
    setIsSavingSettings(true)
    const ok = await constituencyService.updateConstituency(constituency.id, {
      leaderName: leaderName || undefined,
      description: description || undefined,
      meetingSchedule: meetingSchedule || undefined,
      email: email || undefined,
    })
    if (ok) {
      toast.success('Settings saved')
      await load()
    } else {
      toast.error('Failed to save settings')
    }
    setIsSavingSettings(false)
  }

  if (isLoading) {
    return (
      <div>
        <p
          style={{
            padding: 40,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Loading…
        </p>
      </div>
    )
  }

  if (!constituency) {
    return (
      <div>
        <p
          style={{
            padding: 40,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Constituency not found.{' '}
          <Link to="/admin/constituencies" style={{ color: 'hsl(var(--primary))' }}>
            Back to constituencies
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title={constituency.name}
        subtitle={`${constituency.regionName} Region · ${members.length} members`}
        icon="location_city"
        breadcrumb={[{ label: 'Constituencies', to: '/admin/constituencies' }]}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['members', 'activities', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'members' && (
              <span
                style={{
                  marginLeft: 6,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0 6px',
                  fontSize: 11,
                }}
              >
                {members.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          {members.length === 0 ? (
            <p
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No members in this constituency yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Member', 'Reg No.', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'hsl(var(--container-low))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                            >
                              person
                            </span>
                          </div>
                        )}
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {m.regNo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activities tab */}
      {activeTab === 'activities' && (
        <div className="sidebar-main" style={{ alignItems: 'start' }}>
          {/* Add activity form */}
          <div className="panel" style={{ padding: 24 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 16px',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Add Activity
            </h3>
            <form
              onSubmit={handleAddActivity}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <input
                required
                placeholder="Title"
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                placeholder="Description (optional)"
                value={actDesc}
                onChange={(e) => setActDesc(e.target.value)}
                rows={3}
                style={{
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  boxSizing: 'border-box',
                }}
              >
                {['Meeting', 'Campaign', 'Outreach', 'Training', 'Other'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                required
                type="date"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  boxSizing: 'border-box',
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={isSavingAct}>
                {isSavingAct ? 'Saving…' : 'Add Activity'}
              </button>
            </form>
          </div>

          {/* Activities list */}
          <div>
            {activities.length === 0 ? (
              <div
                className="panel"
                style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
              >
                <p style={{ fontFamily: "'Public Sans', sans-serif", margin: 0 }}>
                  No activities yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activities.map((a) => (
                  <div
                    key={a.id}
                    className="panel"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          margin: '0 0 4px',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {a.title}
                      </p>
                      {a.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: 0,
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {a.description}
                        </p>
                      )}
                      <span
                        className="pill pill-mute"
                        style={{ fontSize: 10, marginTop: 6, display: 'inline-block' }}
                      >
                        {a.type}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: '0 0 8px',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {new Date(a.activityDate).toLocaleDateString()}
                      </p>
                      <button
                        className="btn btn-outline-dest btn-sm"
                        onClick={() => handleDeleteActivity(a.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="panel" style={{ padding: 24, maxWidth: 560 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 20px',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Constituency Details
          </h3>
          <form
            onSubmit={handleSaveSettings}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {[
              {
                label: 'Coordinator Name',
                value: leaderName,
                onChange: setLeaderName,
                placeholder: 'Full name',
              },
              {
                label: 'Meeting Schedule',
                value: meetingSchedule,
                onChange: setMeetingSchedule,
                placeholder: 'e.g. First Saturday of each month',
              },
              {
                label: 'Contact Email',
                value: email,
                onChange: setEmail,
                placeholder: 'constituency@thebase.org',
              },
            ].map((field) => (
              <div key={field.label}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {field.label}
                </label>
                <input
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface))',
                    background: 'hsl(var(--background))',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the constituency's focus and activities…"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingSettings}
              style={{ alignSelf: 'flex-start' }}
            >
              {isSavingSettings ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Check whether `AdminPageHeader` accepts a `breadcrumb` prop**

```bash
grep -n "breadcrumb" C:/MAMP/htdocs/The-Base/src/components/admin/AdminPageHeader.tsx
```

If the `breadcrumb` prop doesn't exist, remove it from the `<AdminPageHeader />` call.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/ConstituencyLeadHub.tsx
git commit -m "feat(admin): add /admin/constituencies/:id hub — members, activities, settings"
```

---

## Task 13: DB Migration 2 — Delete Ghana Chapters

> Run this after all UI changes are committed and verified.

**Files:** Supabase MCP `apply_migration`

- [ ] **Step 1: Apply migration via Supabase MCP**

```sql
-- Clear chapter field for users assigned to a Ghana chapter
UPDATE users
SET chapter = NULL
WHERE chapter IN (
  SELECT name FROM chapters WHERE country = 'Ghana' OR country IS NULL
);

-- Remove FK-dependent rows first
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

-- Delete Ghana chapter rows
DELETE FROM chapters WHERE country = 'Ghana' OR country IS NULL;
```

- [ ] **Step 2: Verify**

```sql
SELECT COUNT(*) FROM chapters WHERE country = 'Ghana' OR country IS NULL;
```

Expected: `0`

```sql
SELECT COUNT(*) FROM chapters;
```

Expected: Only Diaspora chapter rows remain (non-zero if you have Diaspora chapters).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): delete Ghana chapter rows and clear users.chapter references"
```

---

## Task 14: Final TypeScript Check + Cleanup Commit

**Files:** All modified files

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors. Fix any remaining type errors before proceeding.

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: successful build with no errors.

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors from constituencies/chapters split"
```

---

## Notes for Implementer

- **`AdminPageHeader` breadcrumb**: Check whether it accepts a `breadcrumb` prop before using it. If not, add a manual breadcrumb `<Link>` above the header component in `ConstituencyLeadHub.tsx`.
- **`supabase` import in `DashboardLayout`**: If not already imported at the top of the file, add `import { supabase } from '@/lib/supabase'`.
- **Ghana chapter row count**: The current seed data has ~5 Ghana chapters (Accra Central, Cape Coast, Kumasi Hub, Takoradi, Tamale). Migration 2 will delete these. If any members have `chapter` set to one of these names, their `chapter` field will be nulled.
- **`DashboardMobileFilterDrawer`**: Also uses `activeTab`/`setActiveTab` — apply the same prop removal as in Task 5 Step 4.
- **Constituency member counts**: The `constituencyService.getConstituencies()` fetches all user constituency strings in one query for efficiency. If the platform has >10k users, consider adding a Postgres function for aggregated counts instead.
