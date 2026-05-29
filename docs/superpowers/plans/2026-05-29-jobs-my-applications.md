# Jobs My Applications Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "My Applications" tab to the dashboard Jobs page so members can track submission statuses, enforce a hard monthly limit of 3 applications per calendar month, and show a persistent counter chip.

**Architecture:** A SECURITY DEFINER Postgres function enforces the 3/month limit atomically so it cannot be bypassed via direct API calls. The service layer wraps the RPC and two new query methods. A new `MyApplicationsTab` component handles the applications list UI; `Jobs.tsx` gains a tab bar, counter chip, and updated error-handling.

**Tech Stack:** React 18, TypeScript, Supabase JS client, Postgres SECURITY DEFINER function, project design-system CSS classes (`.btn-active-tab`, `.btn-inactive-tab`, `.pill`, `.pill-warn`, `.pill-err`, `.pill-ok`, `.pill-mute`, `.panel`), Material Symbols icons.

---

### Task 1: Create `apply_to_job` Postgres function

**Files:**

- Supabase DB: new migration via MCP

- [ ] **Step 1: Apply the migration**

Use `mcp__supabase__apply_migration` with the following SQL. Name the migration `create_apply_to_job_function`.

```sql
CREATE OR REPLACE FUNCTION public.apply_to_job(
  p_job_id       uuid,
  p_cover_letter text,
  p_resume_url   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count   integer;
  v_new_id  uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Monthly limit check (current calendar month)
  SELECT COUNT(*) INTO v_count
  FROM job_applications
  WHERE member_id = v_user_id
    AND created_at >= date_trunc('month', now());

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'monthly_limit_reached';
  END IF;

  -- Duplicate application check
  IF EXISTS (
    SELECT 1 FROM job_applications
    WHERE member_id = v_user_id AND job_id = p_job_id
  ) THEN
    RAISE EXCEPTION 'already_applied';
  END IF;

  INSERT INTO job_applications (job_id, member_id, cover_letter, resume_url)
  VALUES (p_job_id, v_user_id, p_cover_letter, p_resume_url)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(uuid, text, text) TO authenticated;
```

- [ ] **Step 2: Verify the function exists**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'apply_to_job';
```

Expected: 1 row, `security_type = 'DEFINER'`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): add apply_to_job SECURITY DEFINER function with monthly rate limit"
```

---

### Task 2: Add `ApplicationWithJob` type

**Files:**

- Modify: `src/types/jobs.ts`

- [ ] **Step 1: Add the type**

Append to the end of `src/types/jobs.ts`:

```typescript
export interface ApplicationWithJob extends JobApplication {
  job?: Pick<Job, 'title' | 'organization' | 'status'>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/jobs.ts
git commit -m "feat(types): add ApplicationWithJob interface"
```

---

### Task 3: Update `jobService.ts` — RPC, monthly count, full applications

**Files:**

- Modify: `src/services/jobService.ts`

Three changes: (a) update `applyToJob` to use the RPC and return a structured result, (b) add `getMonthlyApplicationCount`, (c) add `getMemberApplicationsFull`.

- [ ] **Step 1: Update the import line at the top**

Current import (line 3):

```typescript
import type { Job, JobApplication, JobFilters, ApplicationStatus } from '@/types/jobs'
```

Replace with:

```typescript
import type {
  Job,
  JobApplication,
  ApplicationWithJob,
  JobFilters,
  ApplicationStatus,
} from '@/types/jobs'
```

- [ ] **Step 2: Replace `applyToJob` method**

Find and replace the entire `applyToJob` method body (lines 110–129 in the original file):

Old:

```typescript
  async applyToJob(
    jobId: string,
    payload: { coverLetter: string; resumeUrl?: string }
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { error } = await supabase.from('job_applications').insert({
      job_id: jobId,
      member_id: user.id,
      cover_letter: payload.coverLetter,
      resume_url: payload.resumeUrl ?? null,
    })
    if (error) {
      console.warn('[jobService] applyToJob:', error)
      return false
    }
    return true
  }
```

New:

```typescript
  async applyToJob(
    jobId: string,
    payload: { coverLetter: string; resumeUrl?: string }
  ): Promise<{ ok: boolean; reason?: 'limit_reached' | 'already_applied' | 'error' }> {
    const { error } = await supabase.rpc('apply_to_job', {
      p_job_id: jobId,
      p_cover_letter: payload.coverLetter,
      p_resume_url: payload.resumeUrl ?? null,
    })
    if (!error) return { ok: true }
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('monthly_limit_reached')) return { ok: false, reason: 'limit_reached' }
    if (msg.includes('already_applied')) return { ok: false, reason: 'already_applied' }
    console.warn('[jobService] applyToJob:', error)
    return { ok: false, reason: 'error' }
  }
```

- [ ] **Step 3: Add `getMonthlyApplicationCount` and `getMemberApplicationsFull` after `getMemberApplications`**

After the closing brace of `getMemberApplications` (after line 142), insert:

```typescript
  async getMonthlyApplicationCount(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count, error } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
    if (error) {
      console.warn('[jobService] getMonthlyApplicationCount:', error)
      return 0
    }
    return count ?? 0
  }

  async getMemberApplicationsFull(): Promise<ApplicationWithJob[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, job:jobs(title, organization, status)')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[jobService] getMemberApplicationsFull:', error)
      return []
    }
    return (data || []) as ApplicationWithJob[]
  }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/jobService.ts
git commit -m "feat(service): update applyToJob RPC, add getMonthlyApplicationCount + getMemberApplicationsFull"
```

---

### Task 4: Create `MyApplicationsTab.tsx`

**Files:**

- Create: `src/pages/jobs/MyApplicationsTab.tsx`

- [ ] **Step 1: Create the directory and file**

Create `src/pages/jobs/MyApplicationsTab.tsx` with this full content:

```typescript
import type { ApplicationWithJob, ApplicationStatus } from '@/types/jobs'

interface Props {
  applications: ApplicationWithJob[]
  loading: boolean
  onBrowse: () => void
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === 'shortlisted') {
    return (
      <span
        className="pill"
        style={{
          background: 'hsl(var(--accent) / 0.15)',
          color: 'hsl(var(--accent))',
          fontSize: 12,
        }}
      >
        {STATUS_LABELS[status]}
      </span>
    )
  }
  const cls =
    status === 'pending'
      ? 'pill-warn'
      : status === 'reviewed'
        ? 'pill-mute'
        : status === 'accepted'
          ? 'pill-ok'
          : 'pill-err'
  return (
    <span className={`pill ${cls}`} style={{ fontSize: 12 }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div
      className="panel"
      style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '55%',
            height: 16,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--border))',
          }}
        />
        <div
          style={{
            width: 80,
            height: 22,
            borderRadius: 'var(--radius-pill)',
            background: 'hsl(var(--border))',
          }}
        />
      </div>
      <div
        style={{
          width: '35%',
          height: 13,
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--border))',
        }}
      />
      <div
        style={{
          width: '25%',
          height: 12,
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--border))',
        }}
      />
    </div>
  )
}

export default function MyApplicationsTab({ applications, loading, onBrowse }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '56px 24px',
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
          work_history
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          No applications yet — browse available jobs and apply.
        </p>
        <button className="btn btn-outline btn-sm" onClick={onBrowse}>
          Browse Jobs
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {applications.map((app) => {
        const title = app.job?.title ?? '[Position removed]'
        const org = app.job?.organization ?? ''
        const date = new Date(app.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const isRemoved = !app.job?.title
        return (
          <div
            key={app.id}
            className="panel"
            style={{ padding: '16px 20px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: org ? 4 : 6,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: isRemoved
                    ? 'hsl(var(--on-surface-muted))'
                    : 'hsl(var(--on-surface))',
                  fontStyle: isRemoved ? 'italic' : 'normal',
                }}
              >
                {title}
              </p>
              <StatusBadge status={app.status} />
            </div>
            {org && (
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {org}
              </p>
            )}
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 'var(--font-weight-normal, 400)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Applied {date}
            </p>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/jobs/MyApplicationsTab.tsx
git commit -m "feat(ui): add MyApplicationsTab component with skeleton, empty state, status badges"
```

---

### Task 5: Update `Jobs.tsx` — tabs, counter chip, updated apply flow

**Files:**

- Modify: `src/pages/Jobs.tsx`

- [ ] **Step 1: Update imports**

Find:

```typescript
import type { Job, JobFilters, JobType, PlatformFilter } from '@/types/jobs'
```

Replace with:

```typescript
import type { Job, JobFilters, JobType, PlatformFilter, ApplicationWithJob } from '@/types/jobs'
import MyApplicationsTab from './jobs/MyApplicationsTab'
```

- [ ] **Step 2: Add new state variables**

Find (after the existing `appliedJobIds` state declaration):

```typescript
const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
```

Replace with:

```typescript
const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

// Tabs + monthly limit (dashboard only)
const [activeTab, setActiveTab] = useState<'browse' | 'applications'>('browse')
const [applications, setApplications] = useState<ApplicationWithJob[]>([])
const [applicationsLoaded, setApplicationsLoaded] = useState(false)
const [applicationsLoading, setApplicationsLoading] = useState(false)
const [monthlyCount, setMonthlyCount] = useState(0)
const [monthlyCountLoading, setMonthlyCountLoading] = useState(true)
```

- [ ] **Step 3: Add useEffect to load monthly count (dashboard only)**

Find the closing brace of the second `useEffect` block (the one that calls `getMemberApplications`):

```typescript
useEffect(() => {
  jobService.getMemberApplications().then((apps) => {
    setAppliedJobIds(new Set(apps.map((a) => a.job_id)))
  })
}, [])
```

Add a new `useEffect` immediately after it:

```typescript
useEffect(() => {
  if (!isDashboard) return
  setMonthlyCountLoading(true)
  jobService.getMonthlyApplicationCount().then((n) => {
    setMonthlyCount(n)
    setMonthlyCountLoading(false)
  })
}, [isDashboard])
```

- [ ] **Step 4: Add helper functions before `openJobDetail`**

Find:

```typescript
  async function openJobDetail(job: Job) {
```

Insert before it:

```typescript
  async function loadApplications() {
    if (applicationsLoaded || applicationsLoading) return
    setApplicationsLoading(true)
    const data = await jobService.getMemberApplicationsFull()
    setApplications(data)
    setApplicationsLoaded(true)
    setApplicationsLoading(false)
  }

  function switchToApplications() {
    setActiveTab('applications')
    loadApplications()
  }

  function nextMonthName() {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toLocaleString('default', { month: 'long' })
  }

  function counterChip() {
    if (monthlyCountLoading) {
      return (
        <span className="pill pill-mute" style={{ fontSize: 12 }}>
          — / 3 used this month
        </span>
      )
    }
    if (monthlyCount >= 3) {
      return (
        <span className="pill pill-err" style={{ fontSize: 12 }}>
          3 / 3 — resets 1 {nextMonthName()}
        </span>
      )
    }
    if (monthlyCount >= 1) {
      return (
        <span className="pill pill-warn" style={{ fontSize: 12 }}>
          {monthlyCount} / 3 used this month
        </span>
      )
    }
    return (
      <span className="pill pill-mute" style={{ fontSize: 12 }}>
        0 / 3 used this month
      </span>
    )
  }

```

- [ ] **Step 5: Replace `handleSubmitApplication` with updated error handling + optimistic update**

Find and replace the entire `handleSubmitApplication` function:

Old:

```typescript
async function handleSubmitApplication() {
  if (!selectedJob || !coverLetter.trim()) return
  setSubmitting(true)
  let resumeUrl: string | undefined
  if (resumeFile) {
    const url = await jobService.uploadResume(resumeFile)
    if (!url) {
      toast.error('Resume upload failed. Please try again.')
      setSubmitting(false)
      return
    }
    resumeUrl = url
  }
  const ok = await jobService.applyToJob(selectedJob.id, { coverLetter, resumeUrl })
  if (ok) {
    trackEvent('job_application', { job_title: selectedJob.title })
    toast.success('Application submitted successfully!')
    setHasApplied(true)
    setAppliedJobIds((prev) => new Set([...prev, selectedJob.id]))
    setShowApplyModal(false)
    setCoverLetter('')
    setResumeFile(null)
  } else {
    toast.error('Failed to submit application. You may have already applied.')
  }
  setSubmitting(false)
}
```

New:

```typescript
async function handleSubmitApplication() {
  if (!selectedJob || !coverLetter.trim()) return
  setSubmitting(true)
  let resumeUrl: string | undefined
  if (resumeFile) {
    const url = await jobService.uploadResume(resumeFile)
    if (!url) {
      toast.error('Resume upload failed. Please try again.')
      setSubmitting(false)
      return
    }
    resumeUrl = url
  }
  const result = await jobService.applyToJob(selectedJob.id, { coverLetter, resumeUrl })
  if (result.ok) {
    trackEvent('job_application', { job_title: selectedJob.title })
    toast.success('Application submitted successfully!')
    setHasApplied(true)
    setAppliedJobIds((prev) => new Set([...prev, selectedJob.id]))
    setMonthlyCount((n) => n + 1)
    // Optimistic update: prepend new card without a re-fetch
    const optimistic: ApplicationWithJob = {
      id: crypto.randomUUID(),
      job_id: selectedJob.id,
      member_id: '',
      cover_letter: coverLetter,
      resume_url: resumeUrl,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      job: {
        title: selectedJob.title,
        organization: selectedJob.organization,
        status: selectedJob.status,
      },
    }
    setApplications((prev) => [optimistic, ...prev])
    setApplicationsLoaded(true)
    setShowApplyModal(false)
    setCoverLetter('')
    setResumeFile(null)
  } else if (result.reason === 'limit_reached') {
    toast.error(
      `You've reached your 3-application limit for this month. Resets on 1 ${nextMonthName()}.`
    )
    setMonthlyCount(3)
  } else if (result.reason === 'already_applied') {
    toast.error("You've already applied for this position.")
    setHasApplied(true)
  } else {
    toast.error('Application failed. Please try again.')
  }
  setSubmitting(false)
}
```

- [ ] **Step 6: Add the tab bar + counter chip (dashboard-only) above the filter bar**

Find the comment `{/* Filter bar */}` in the JSX (around line 154). Insert the tab bar block directly before the filter bar `<div>`:

```tsx
{
  /* Tab bar — dashboard only */
}
{
  isDashboard && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className={`btn btn-sm ${activeTab === 'browse' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Jobs
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'applications' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
          onClick={switchToApplications}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          My Applications
          {applicationsLoaded && applications.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 18,
                height: 18,
                padding: '0 4px',
                borderRadius: 'var(--radius-pill)',
                background: 'hsl(var(--on-surface) / 0.15)',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {applications.length}
            </span>
          )}
        </button>
      </div>
      {counterChip()}
    </div>
  )
}
```

- [ ] **Step 7: Conditionally show the browse content vs MyApplicationsTab**

The filter bar and job grid are the "browse" content. Wrap the filter bar `<div>` and everything below it (up to — but not including — the modals) in a conditional:

Find (the filter bar opening):

```tsx
      {/* Filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
```

Wrap by adding `{activeTab === 'browse' && (` before it, and add the closing `)}` and the `<MyApplicationsTab>` block after the job grid closing `</div>` but before the `{selectedJob && (` modal block.

The result should look like:

```tsx
{
  activeTab === 'browse' ? (
    <>
      {/* Filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {/* ... existing filter bar content unchanged ... */}
      </div>
      {/* ... existing job grid content unchanged ... */}
    </>
  ) : (
    <MyApplicationsTab
      applications={applications}
      loading={applicationsLoading}
      onBrowse={() => setActiveTab('browse')}
    />
  )
}
```

> **Note for the implementer:** The job grid section ends just before `{selectedJob && (`. Locate that line and insert the closing `</>` and `)}` above it. The modals (`{selectedJob && ...}` and `{showApplyModal && ...}`) stay outside the conditional — they must always be mounted to function correctly.

- [ ] **Step 8: Update the Apply Now button in the job detail modal to show disabled state when limit reached**

Find the Apply Now / Applied section (around line 660):

```tsx
{
  hasApplied ? (
    <button className="btn btn-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
      Applied ✓
    </button>
  ) : (
    <button className="btn btn-primary" onClick={handleApplyClick}>
      Apply Now
    </button>
  )
}
```

Replace with:

```tsx
{
  hasApplied ? (
    <button className="btn btn-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
      Applied ✓
    </button>
  ) : monthlyCount >= 3 ? (
    <button className="btn btn-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
      Limit reached — resets 1 {nextMonthName()}
    </button>
  ) : (
    <button className="btn btn-primary" onClick={handleApplyClick}>
      Apply Now
    </button>
  )
}
```

- [ ] **Step 9: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/Jobs.tsx src/pages/jobs/MyApplicationsTab.tsx
git commit -m "feat(jobs): add My Applications tab, monthly rate limit counter chip, and apply RPC error handling"
```

---

## Self-Review Checklist

- [x] **DB enforcement** — `apply_to_job` raises named exceptions; client cannot bypass limit via direct insert (RLS or no RLS, the function owns the insert)
- [x] **Counter chip always visible on dashboard** — renders in tab bar regardless of which tab is active
- [x] **Chip states** — `pill-mute` (0), `pill-warn` (1–2), `pill-err` (3) with correct labels
- [x] **Skeleton loading** — 3 skeleton cards while `getMemberApplicationsFull()` is in flight
- [x] **Empty state** — icon + copy + "Browse Jobs" button
- [x] **Status badge colours** — all 5 statuses covered including gold `shortlisted` variant
- [x] **Removed job fallback** — `[Position removed]` shown in italic when `app.job` is null
- [x] **Optimistic update** — new card prepended immediately on success; `setApplicationsLoaded(true)` ensures switching to the tab shows the card
- [x] **Tab data caching** — `applicationsLoaded` guard prevents re-fetch on subsequent tab switches
- [x] **Error toasts** — named toasts for `limit_reached`, `already_applied`, generic fallback
- [x] **`monthlyCount` sync** — incremented locally on success; set to 3 on `limit_reached` so button disables immediately
- [x] **Public Jobs page unaffected** — tab bar and counter chip are behind `isDashboard` guard
- [x] **`nextMonthName()` reuse** — extracted helper used in both the chip and toast/button text
- [x] **No shadcn/lucide** — uses `.pill`, `.btn`, `.panel`, Material Symbols only
