# Jobs Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a jobs board where admins post jobs, the public can browse them, and authenticated members can apply with a cover letter and optional resume.

**Architecture:** Two separate pages — `src/pages/Jobs.tsx` (shared public/dashboard, `isDashboard` flag) and `src/pages/admin/Jobs.tsx` (admin management with sub-components). A dedicated `jobService.ts` handles all Supabase calls. DB migration creates `jobs` and `job_applications` tables with RLS.

**Tech Stack:** React 18 + TypeScript, Supabase (auth + DB + Storage), React Router v6, inline styles + design system CSS classes (`.btn`, `.panel`, `.pill`, `.kpis`), Material Symbols icons, sonner toasts.

---

## File Map

| File                                          | Action | Responsibility                              |
| --------------------------------------------- | ------ | ------------------------------------------- |
| `src/services/jobService.ts`                  | Create | All DB reads/writes + resume upload         |
| `src/types/jobs.ts`                           | Create | `Job`, `JobApplication`, `JobFilters` types |
| `src/pages/Jobs.tsx`                          | Create | Public + dashboard browse page              |
| `src/pages/admin/Jobs.tsx`                    | Create | Admin orchestrator                          |
| `src/pages/admin/jobs/JobFormModal.tsx`       | Create | Post/edit job form modal                    |
| `src/pages/admin/jobs/ApplicationsDrawer.tsx` | Create | Right-side applications panel               |
| `src/routes.tsx`                              | Modify | Add 3 new routes                            |

---

## Task 1: Database Migration

**Files:**

- Apply via Supabase MCP tool

- [ ] **Step 1: Apply the migration**

Use `mcp__supabase__apply_migration` with the following SQL:

```sql
-- jobs table
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  description text not null,
  requirements text,
  location text,
  job_type text not null default 'full-time',
  category text not null default 'General',
  salary_range text,
  platform_filter text not null default 'ALL',
  deadline date,
  status text not null default 'draft',
  posted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- job_applications table
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text not null,
  resume_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, member_id)
);

-- RLS
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

-- jobs: anyone can read published
create policy "Public read published jobs"
  on public.jobs for select
  using (status = 'published');

-- jobs: authenticated users can manage all jobs (admin UI is gated by AdminLayout)
create policy "Authenticated users manage jobs"
  on public.jobs for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- job_applications: members can insert their own
create policy "Members can apply"
  on public.job_applications for insert
  with check (auth.uid() = member_id);

-- job_applications: members can read their own
create policy "Members read own applications"
  on public.job_applications for select
  using (auth.uid() = member_id);

-- job_applications: authenticated users can manage all (admin panel gated by AdminLayout)
create policy "Authenticated users manage applications"
  on public.job_applications for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Storage bucket for resumes
insert into storage.buckets (id, name, public)
values ('job-resumes', 'job-resumes', true)
on conflict (id) do nothing;

create policy "Members can upload resumes"
  on storage.objects for insert
  with check (bucket_id = 'job-resumes' and auth.uid() is not null);

create policy "Public read resumes"
  on storage.objects for select
  using (bucket_id = 'job-resumes');
```

- [ ] **Step 2: Verify tables exist**

In Supabase dashboard (or via MCP `list_tables`), confirm `jobs` and `job_applications` are present with the correct columns.

- [ ] **Step 3: Commit note**

```bash
git commit --allow-empty -m "feat: apply jobs board DB migration"
```

---

## Task 2: Types

**Files:**

- Create: `src/types/jobs.ts`

- [ ] **Step 1: Create the types file**

```typescript
export type JobType = 'full-time' | 'part-time' | 'contract' | 'volunteer' | 'internship'
export type JobStatus = 'draft' | 'published' | 'closed'
export type PlatformFilter = 'ALL' | 'GHANA' | 'DIASPORA'
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'

export interface Job {
  id: string
  title: string
  organization: string
  description: string
  requirements?: string
  location?: string
  job_type: JobType
  category: string
  salary_range?: string
  platform_filter: PlatformFilter
  deadline?: string
  status: JobStatus
  posted_by?: string
  created_at: string
  updated_at: string
  application_count?: number
}

export interface JobApplication {
  id: string
  job_id: string
  member_id: string
  cover_letter: string
  resume_url?: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  member?: {
    full_name: string
    registration_number: string
    email: string
    avatar_url?: string
  }
}

export interface JobFilters {
  search?: string
  category?: string
  job_type?: JobType | ''
  platform_filter?: PlatformFilter | ''
  status?: JobStatus | ''
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/jobs.ts
git commit -m "feat: add jobs board types"
```

---

## Task 3: Job Service

**Files:**

- Create: `src/services/jobService.ts`

- [ ] **Step 1: Create the service**

```typescript
import { supabase } from '@/lib/supabase'
import type { Job, JobApplication, JobFilters, ApplicationStatus } from '@/types/jobs'

class JobService {
  private static instance: JobService
  private constructor() {}
  public static getInstance(): JobService {
    if (!JobService.instance) JobService.instance = new JobService()
    return JobService.instance
  }

  async getJobs(filters: JobFilters = {}): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`)
    }
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.job_type) query = query.eq('job_type', filters.job_type)
    if (filters.platform_filter && filters.platform_filter !== 'ALL') {
      query = query.or(`platform_filter.eq.ALL,platform_filter.eq.${filters.platform_filter}`)
    }

    const { data, error } = await query
    if (error) {
      console.warn('[jobService] getJobs:', error)
      return []
    }
    return (data || []) as Job[]
  }

  async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
    if (error) return null
    return data as Job
  }

  async getAllJobsAdmin(filters: JobFilters = {}): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select(`*, job_applications(count)`)
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`)
    }
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.job_type) query = query.eq('job_type', filters.job_type)
    if (filters.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) {
      console.warn('[jobService] getAllJobsAdmin:', error)
      return []
    }
    return (data || []).map((j: Record<string, unknown>) => ({
      ...j,
      application_count: (j.job_applications as { count: number }[] | null)?.[0]?.count ?? 0,
    })) as Job[]
  }

  async createJob(
    data: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'application_count'>
  ): Promise<Job | null> {
    const { data: result, error } = await supabase.from('jobs').insert(data).select().single()
    if (error) {
      console.warn('[jobService] createJob:', error)
      return null
    }
    return result as Job
  }

  async updateJob(id: string, data: Partial<Job>): Promise<boolean> {
    const { error } = await supabase
      .from('jobs')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.warn('[jobService] updateJob:', error)
      return false
    }
    return true
  }

  async deleteJob(id: string): Promise<boolean> {
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) {
      console.warn('[jobService] deleteJob:', error)
      return false
    }
    return true
  }

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

  async getMemberApplications(): Promise<JobApplication[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('member_id', user.id)
    if (error) return []
    return (data || []) as JobApplication[]
  }

  async getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`*, member:profiles(full_name, registration_number, email, avatar_url)`)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[jobService] getApplicationsForJob:', error)
      return []
    }
    return (data || []) as JobApplication[]
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<boolean> {
    const { error } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.warn('[jobService] updateApplicationStatus:', error)
      return false
    }
    return true
  }

  async uploadResume(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('job-resumes')
      .upload(path, file, { upsert: false })
    if (error) {
      console.warn('[jobService] uploadResume:', error)
      return null
    }
    const { data } = supabase.storage.from('job-resumes').getPublicUrl(path)
    return data.publicUrl
  }

  async hasApplied(jobId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('member_id', user.id)
      .maybeSingle()
    return !!data
  }
}

export const jobService = JobService.getInstance()
```

- [ ] **Step 2: Commit**

```bash
git add src/services/jobService.ts src/types/jobs.ts
git commit -m "feat: add jobService and Job types"
```

---

## Task 4: Public / Dashboard Jobs Page

**Files:**

- Create: `src/pages/Jobs.tsx`

- [ ] **Step 1: Create `src/pages/Jobs.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { jobService } from '@/services/jobService'
import type { Job, JobFilters, JobType, PlatformFilter } from '@/types/jobs'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'volunteer', 'internship']
const CATEGORIES = [
  'General',
  'Technology',
  'Finance',
  'Legal',
  'Admin',
  'Communications',
  'Field Operations',
  'Research',
]
const PLATFORMS: PlatformFilter[] = ['ALL', 'GHANA', 'DIASPORA']

const TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  internship: 'Internship',
}

const PILL_COLORS: Record<JobType, string> = {
  'full-time': 'pill-ok',
  'part-time': 'pill-warn',
  contract: 'pill-mute',
  volunteer: 'pill-ok',
  internship: 'pill-warn',
}

export default function Jobs() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const font = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    category: '',
    job_type: '',
    platform_filter: '',
  })

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    const data = await jobService.getJobs(filters)
    setJobs(data)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    jobService.getMemberApplications().then((apps) => {
      setAppliedJobIds(new Set(apps.map((a) => a.job_id)))
    })
  }, [])

  async function openJobDetail(job: Job) {
    setSelectedJob(job)
    const applied = await jobService.hasApplied(job.id)
    setHasApplied(applied)
  }

  function handleApplyClick() {
    if (!isDashboard) {
      navigate('/login')
      return
    }
    setShowApplyModal(true)
  }

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

  return (
    <div style={{ fontFamily: font, maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <SEO
        title="Jobs Board | The Base Movement"
        description="Browse job opportunities within The Base Movement network."
      />

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
          }}
        >
          Jobs Board
        </h1>
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
          Opportunities within The Base Movement network
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          placeholder="Search title or organisation..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          style={{
            flex: '1 1 200px',
            minWidth: 160,
            height: 36,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
            boxSizing: 'border-box',
            color: 'hsl(var(--on-surface))',
          }}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.job_type}
          onChange={(e) => setFilters((f) => ({ ...f, job_type: e.target.value as JobType | '' }))}
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
          }}
        >
          <option value="">All Types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={filters.platform_filter}
          onChange={(e) =>
            setFilters((f) => ({ ...f, platform_filter: e.target.value as PlatformFilter | '' }))
          }
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: font,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
          }}
        >
          <option value="">All Networks</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Job cards grid */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 14,
          }}
        >
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 14,
          }}
        >
          No jobs found.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {jobs.map((job) => (
            <div
              key={job.id}
              className="panel"
              onClick={() => openJobDetail(job)}
              style={{
                padding: '18px 20px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
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
                  background: 'hsl(var(--primary))',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {job.title}
                </p>
                {appliedJobIds.has(job.id) && (
                  <span className="pill pill-ok" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                    Applied
                  </span>
                )}
              </div>
              <p
                style={{ margin: '0 0 10px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                {job.organization}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <span className={`pill ${PILL_COLORS[job.job_type]}`} style={{ fontSize: 11 }}>
                  {TYPE_LABELS[job.job_type]}
                </span>
                <span className="pill pill-mute" style={{ fontSize: 11 }}>
                  {job.category}
                </span>
                {job.platform_filter !== 'ALL' && (
                  <span
                    className="pill"
                    style={{
                      fontSize: 11,
                      background: 'hsl(var(--accent) / 0.15)',
                      color: 'hsl(var(--accent))',
                    }}
                  >
                    {job.platform_filter}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {job.location && (
                  <span>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 13, verticalAlign: 'middle' }}
                    >
                      location_on
                    </span>{' '}
                    {job.location}
                  </span>
                )}
                {job.deadline && (
                  <span>
                    Closes{' '}
                    {new Date(job.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job detail modal */}
      {selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 20,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {selectedJob.title}
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
                  {selectedJob.organization}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  padding: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              <span
                className={`pill ${PILL_COLORS[selectedJob.job_type]}`}
                style={{ fontSize: 11 }}
              >
                {TYPE_LABELS[selectedJob.job_type]}
              </span>
              <span className="pill pill-mute" style={{ fontSize: 11 }}>
                {selectedJob.category}
              </span>
              {selectedJob.platform_filter !== 'ALL' && (
                <span
                  className="pill"
                  style={{
                    fontSize: 11,
                    background: 'hsl(var(--accent) / 0.15)',
                    color: 'hsl(var(--accent))',
                  }}
                >
                  {selectedJob.platform_filter}
                </span>
              )}
              {selectedJob.location && (
                <span className="pill pill-mute" style={{ fontSize: 11 }}>
                  {selectedJob.location}
                </span>
              )}
            </div>

            {selectedJob.salary_range && (
              <p
                style={{ margin: '0 0 12px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                <strong style={{ color: 'hsl(var(--on-surface))' }}>Salary:</strong>{' '}
                {selectedJob.salary_range}
              </p>
            )}
            {selectedJob.deadline && (
              <p
                style={{ margin: '0 0 16px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                <strong style={{ color: 'hsl(var(--on-surface))' }}>Deadline:</strong>{' '}
                {new Date(selectedJob.deadline).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}

            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  margin: '0 0 6px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Description
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedJob.description}
              </p>
            </div>

            {selectedJob.requirements && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Requirements
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedJob.requirements}
                </p>
              </div>
            )}

            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
              {hasApplied ? (
                <button
                  className="btn btn-primary"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  Applied ✓
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleApplyClick}>
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application form modal */}
      {showApplyModal && selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowApplyModal(false)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 540,
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 17,
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Apply — {selectedJob.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
              {selectedJob.organization}
            </p>

            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Cover Letter <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              placeholder="Introduce yourself and explain why you're a great fit..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: font,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />

            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Resume / CV <span style={{ color: 'hsl(var(--on-surface-muted))' }}>(optional)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              style={{
                display: 'block',
                marginBottom: 24,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowApplyModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!coverLetter.trim() || submitting}
                onClick={handleSubmitApplication}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Jobs.tsx
git commit -m "feat: add public/dashboard Jobs browse page"
```

---

## Task 5: Admin Jobs Sub-components

**Files:**

- Create: `src/pages/admin/jobs/JobFormModal.tsx`
- Create: `src/pages/admin/jobs/ApplicationsDrawer.tsx`

- [ ] **Step 1: Create `src/pages/admin/jobs/JobFormModal.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { jobService } from '@/services/jobService'
import type { Job, JobType, JobStatus, PlatformFilter } from '@/types/jobs'
import { toast } from 'sonner'

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'volunteer', 'internship']
const CATEGORIES = [
  'General',
  'Technology',
  'Finance',
  'Legal',
  'Admin',
  'Communications',
  'Field Operations',
  'Research',
]
const PLATFORMS: PlatformFilter[] = ['ALL', 'GHANA', 'DIASPORA']
const STATUSES: JobStatus[] = ['draft', 'published', 'closed']

interface Props {
  job?: Job | null
  onClose: () => void
  onSaved: () => void
}

const BLANK: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'application_count'> = {
  title: '',
  organization: '',
  description: '',
  requirements: '',
  location: '',
  job_type: 'full-time',
  category: 'General',
  salary_range: '',
  platform_filter: 'ALL',
  deadline: '',
  status: 'draft',
  posted_by: undefined,
}

export function JobFormModal({ job, onClose, onSaved }: Props) {
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        organization: job.organization,
        description: job.description,
        requirements: job.requirements ?? '',
        location: job.location ?? '',
        job_type: job.job_type,
        category: job.category,
        salary_range: job.salary_range ?? '',
        platform_filter: job.platform_filter,
        deadline: job.deadline ?? '',
        status: job.status,
        posted_by: job.posted_by,
      })
    } else {
      setForm(BLANK)
    }
  }, [job])

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSave() {
    if (!form.title.trim() || !form.organization.trim() || !form.description.trim()) {
      toast.error('Title, organisation, and description are required.')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      deadline: form.deadline || undefined,
      requirements: form.requirements || undefined,
      location: form.location || undefined,
      salary_range: form.salary_range || undefined,
    }
    const ok = job
      ? await jobService.updateJob(job.id, payload)
      : !!(await jobService.createJob(payload as Parameters<typeof jobService.createJob>[0]))
    if (ok) {
      toast.success(job ? 'Job updated.' : 'Job posted.')
      onSaved()
    } else {
      toast.error('Failed to save job.')
    }
    setSaving(false)
  }

  const input = (label: string, field: keyof typeof form, required = false, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
          marginBottom: 4,
        }}
      >
        {label}
        {required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
      </label>
      <input
        type={type}
        value={String(form[field] ?? '')}
        onChange={(e) => set(field, e.target.value)}
        style={{
          width: '100%',
          height: 34,
          padding: '0 10px',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          fontFamily: "'Public Sans', sans-serif",
          color: 'hsl(var(--on-surface))',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )

  const select = (
    label: string,
    field: keyof typeof form,
    options: { value: string; label: string }[]
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <select
        value={String(form[field] ?? '')}
        onChange={(e) => set(field, e.target.value)}
        style={{
          width: '100%',
          height: 34,
          padding: '0 10px',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          fontFamily: "'Public Sans', sans-serif",
          color: 'hsl(var(--on-surface))',
          background: 'hsl(var(--background))',
          boxSizing: 'border-box',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {job ? 'Edit Job' : 'Post New Job'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {input('Job Title', 'title', true)}
        {input('Organisation', 'organization', true)}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 4,
            }}
          >
            Description <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 4,
            }}
          >
            Requirements
          </label>
          <textarea
            value={form.requirements}
            onChange={(e) => set('requirements', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {input('Location', 'location')}
          {input('Salary Range', 'salary_range')}
          {select(
            'Job Type',
            'job_type',
            JOB_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))
          )}
          {select(
            'Category',
            'category',
            CATEGORIES.map((c) => ({ value: c, label: c }))
          )}
          {select(
            'Network',
            'platform_filter',
            PLATFORMS.map((p) => ({ value: p, label: p }))
          )}
          {select(
            'Status',
            'status',
            STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
          )}
        </div>
        {input('Deadline', 'deadline', false, 'date')}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : job ? 'Save Changes' : 'Post Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/admin/jobs/ApplicationsDrawer.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { jobService } from '@/services/jobService'
import type { Job, JobApplication, ApplicationStatus } from '@/types/jobs'
import { toast } from 'sonner'

const STATUS_OPTIONS: ApplicationStatus[] = [
  'pending',
  'reviewed',
  'shortlisted',
  'rejected',
  'accepted',
]
const STATUS_PILL: Record<ApplicationStatus, string> = {
  pending: 'pill-warn',
  reviewed: 'pill-mute',
  shortlisted: 'pill-ok',
  rejected: 'pill-err',
  accepted: 'pill-ok',
}

interface Props {
  job: Job
  onClose: () => void
}

export function ApplicationsDrawer({ job, onClose }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [viewCoverLetter, setViewCoverLetter] = useState<JobApplication | null>(null)

  useEffect(() => {
    jobService.getApplicationsForJob(job.id).then((data) => {
      setApplications(data)
      setLoading(false)
    })
  }, [job.id])

  async function handleStatusChange(appId: string, status: ApplicationStatus) {
    const ok = await jobService.updateApplicationStatus(appId, status)
    if (ok) {
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)))
      toast.success('Status updated.')
    } else {
      toast.error('Failed to update status.')
    }
  }

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 90 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 500,
          background: 'hsl(var(--background))',
          zIndex: 95,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 2px',
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 15,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Applications
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              {job.title} — {job.organization}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                textAlign: 'center',
                padding: 32,
              }}
            >
              Loading...
            </p>
          ) : applications.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                textAlign: 'center',
                padding: 32,
              }}
            >
              No applications yet.
            </p>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="panel"
                style={{ padding: '14px 16px', marginBottom: 10 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {app.member?.full_name ?? 'Member'}
                    </p>
                    {app.member?.registration_number && (
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {app.member.registration_number}
                      </p>
                    )}
                  </div>
                  <span
                    className={`pill ${STATUS_PILL[app.status]}`}
                    style={{ fontSize: 10, whiteSpace: 'nowrap' }}
                  >
                    {app.status}
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Applied{' '}
                  {new Date(app.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={app.status}
                    onChange={(e) =>
                      handleStatusChange(app.id, e.target.value as ApplicationStatus)
                    }
                    style={{
                      height: 28,
                      padding: '0 8px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      background: 'hsl(var(--background))',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setViewCoverLetter(app)}
                  >
                    Cover Letter
                  </button>
                  {app.resume_url && (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      Resume ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cover letter inner modal */}
      {viewCoverLetter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setViewCoverLetter(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: 520,
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 15,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Cover Letter — {viewCoverLetter.member?.full_name}
              </p>
              <button
                onClick={() => setViewCoverLetter(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {viewCoverLetter.cover_letter}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/jobs/
git commit -m "feat: add admin jobs sub-components (form modal + applications drawer)"
```

---

## Task 6: Admin Jobs Page

**Files:**

- Create: `src/pages/admin/Jobs.tsx`

- [ ] **Step 1: Create `src/pages/admin/Jobs.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { jobService } from '@/services/jobService'
import type { Job, JobFilters } from '@/types/jobs'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { JobFormModal } from './jobs/JobFormModal'
import { ApplicationsDrawer } from './jobs/ApplicationsDrawer'
import { toast } from 'sonner'

const STATUS_PILL: Record<string, string> = {
  draft: 'pill-mute',
  published: 'pill-ok',
  closed: 'pill-warn',
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    status: '',
    category: '',
    job_type: '',
  })

  const [showFormModal, setShowFormModal] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [drawerJob, setDrawerJob] = useState<Job | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await jobService.getAllJobsAdmin(filters)
    setJobs(data)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const total = jobs.length
  const open = jobs.filter((j) => j.status === 'published').length
  const closed = jobs.filter((j) => j.status === 'closed').length
  const totalApps = jobs.reduce((sum, j) => sum + (j.application_count ?? 0), 0)

  const kpis = [
    { label: 'Total Jobs', value: total, bar: 'hsl(var(--on-surface))' },
    { label: 'Open', value: open, bar: 'hsl(var(--primary))' },
    { label: 'Closed', value: closed, bar: 'hsl(var(--accent))' },
    { label: 'Applications', value: totalApps, bar: 'hsl(var(--destructive))' },
  ]

  async function handleClose(job: Job) {
    const ok = await jobService.updateJob(job.id, { status: 'closed' })
    if (ok) {
      toast.success('Job closed.')
      load()
    } else toast.error('Failed to close job.')
  }

  async function handleDelete(job: Job) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    const ok = await jobService.deleteJob(job.id)
    if (ok) {
      toast.success('Job deleted.')
      load()
    } else toast.error('Failed to delete job.')
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Jobs Board"
        icon="work"
        description="Post opportunities and manage member applications."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditJob(null)
              setShowFormModal(true)
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
            Post Job
          </button>
        }
      />

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
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
                background: k.bar,
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
              }}
            >
              {k.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          placeholder="Search title or organisation..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          style={{
            flex: '1 1 180px',
            height: 34,
            padding: '0 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            boxSizing: 'border-box',
          }}
        />
        {(['', 'draft', 'published', 'closed'] as const).map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filters.status === s ? 'btn-active-tab' : 'btn-inactive-tab'}`}
            onClick={() => setFilters((f) => ({ ...f, status: s }))}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p
            style={{
              padding: 32,
              textAlign: 'center',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Loading jobs...
          </p>
        ) : jobs.length === 0 ? (
          <p
            style={{
              padding: 32,
              textAlign: 'center',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No jobs found.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {[
                  'Title',
                  'Organisation',
                  'Type',
                  'Category',
                  'Deadline',
                  'Status',
                  'Applications',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'hsl(var(--on-surface))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {job.title}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'hsl(var(--on-surface-muted))' }}>
                    {job.organization}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'hsl(var(--on-surface-muted))' }}>
                    {job.job_type}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'hsl(var(--on-surface-muted))' }}>
                    {job.category}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.deadline
                      ? new Date(job.deadline).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      className={`pill ${STATUS_PILL[job.status] ?? 'pill-mute'}`}
                      style={{ fontSize: 11 }}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}
                      onClick={() => setDrawerJob(job)}
                    >
                      {job.application_count ?? 0} application
                      {(job.application_count ?? 0) !== 1 ? 's' : ''}
                    </button>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setEditJob(job)
                          setShowFormModal(true)
                        }}
                      >
                        Edit
                      </button>
                      {job.status !== 'closed' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleClose(job)}>
                          Close
                        </button>
                      )}
                      <button
                        className="btn btn-outline-dest btn-sm"
                        onClick={() => handleDelete(job)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showFormModal && (
        <JobFormModal
          job={editJob}
          onClose={() => {
            setShowFormModal(false)
            setEditJob(null)
          }}
          onSaved={() => {
            setShowFormModal(false)
            setEditJob(null)
            load()
          }}
        />
      )}

      {drawerJob && <ApplicationsDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/Jobs.tsx
git commit -m "feat: add admin Jobs management page"
```

---

## Task 7: Wire Up Routes

**Files:**

- Modify: `src/routes.tsx`

- [ ] **Step 1: Add lazy imports** (after line 85, before `export const routes`)

```tsx
const Jobs = lazy(() => import('./pages/Jobs'))
const AdminJobs = lazy(() => import('./pages/admin/Jobs'))
```

- [ ] **Step 2: Add public route** (inside `PublicLayout` children, after the `/polls` route around line 223)

```tsx
{ path: '/jobs', element: <Jobs /> },
```

- [ ] **Step 3: Add dashboard route** (inside `ProtectedRoute > DashboardLayout` children, after `/dashboard/activity` around line 154)

```tsx
{ path: '/dashboard/jobs', element: <Jobs /> },
```

- [ ] **Step 4: Add admin route** (inside `AdminLayout` children, after `/admin/roadmap` around line 199)

```tsx
{ path: '/admin/jobs', element: <AdminJobs /> },
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear, fix them before committing.

- [ ] **Step 6: Commit**

```bash
git add src/routes.tsx
git commit -m "feat: wire up /jobs, /dashboard/jobs, /admin/jobs routes"
```

---

## Task 8: Verify

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test public browse**
  - Navigate to `http://localhost:5173/jobs`
  - Confirm page loads with filter bar and empty state (no published jobs yet)

- [ ] **Step 3: Test admin post**
  - Navigate to `http://localhost:5173/admin/jobs`
  - Click "Post Job", fill in title/org/description, set status to "published", save
  - Confirm job appears in table with correct status pill

- [ ] **Step 4: Test public cards**
  - Navigate to `/jobs` — confirm posted job card appears
  - Click card — confirm detail modal opens with description and "Apply Now"

- [ ] **Step 5: Test member application (logged in)**
  - Log in as a member, navigate to `/dashboard/jobs`
  - Click a job → "Apply Now" → fill cover letter → submit
  - Confirm "Applied ✓" button state

- [ ] **Step 6: Test duplicate apply blocked**
  - Try clicking "Apply Now" again on the same job
  - Confirm button shows "Applied ✓" disabled

- [ ] **Step 7: Test applications drawer**
  - In admin, click the applications count link on the posted job
  - Confirm drawer opens with the application, cover letter visible, status dropdown works

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: jobs board — complete implementation"
```
