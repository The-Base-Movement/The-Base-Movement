import { useState } from 'react'
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

function jobToForm(job: Job | null | undefined): typeof BLANK {
  if (!job) return BLANK
  return {
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
  }
}

export function JobFormModal({ job, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() => jobToForm(job))
  const [saving, setSaving] = useState(false)

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

  const inputSt = {
    width: '100%',
    height: 34,
    padding: '0 10px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontFamily: "'Public Sans', sans-serif",
    color: 'hsl(var(--on-surface))',
    boxSizing: 'border-box' as const,
  }

  const labelSt = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)' as string,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 4,
  }

  const field = (label: string, key: keyof typeof form, required = false, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelSt}>
        {label}
        {required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
      </label>
      <input
        type={type}
        value={String(form[key] ?? '')}
        onChange={(e) => set(key, e.target.value)}
        style={inputSt}
      />
    </div>
  )

  const selectField = (
    label: string,
    key: keyof typeof form,
    options: { value: string; label: string }[]
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelSt}>{label}</label>
      <select
        value={String(form[key] ?? '')}
        onChange={(e) => set(key, e.target.value)}
        style={{ ...inputSt, background: 'hsl(var(--background))' }}
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

        {field('Job Title', 'title', true)}
        {field('Organisation', 'organization', true)}

        <div style={{ marginBottom: 14 }}>
          <label style={labelSt}>
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
          <label style={labelSt}>Requirements</label>
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
          {field('Location', 'location')}
          {field('Salary Range', 'salary_range')}
          {selectField(
            'Job Type',
            'job_type',
            JOB_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))
          )}
          {selectField(
            'Category',
            'category',
            CATEGORIES.map((c) => ({ value: c, label: c }))
          )}
          {selectField(
            'Network',
            'platform_filter',
            PLATFORMS.map((p) => ({ value: p, label: p }))
          )}
          {selectField(
            'Status',
            'status',
            STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
          )}
        </div>

        {field('Deadline', 'deadline', false, 'date')}

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
