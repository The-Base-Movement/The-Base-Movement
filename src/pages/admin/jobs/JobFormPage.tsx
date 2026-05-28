import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jobService } from '@/services/jobService'
import type { Job, JobType, JobStatus, PlatformFilter } from '@/types/jobs'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
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

export default function JobFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState(BLANK)
  const [loadingJob, setLoadingJob] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    jobService.getJobByIdAdmin(id).then((job) => {
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
        toast.error('Job not found.')
        navigate('/admin/jobs')
      }
      setLoadingJob(false)
    })
  }, [id, navigate])

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
    const ok = isEdit
      ? await jobService.updateJob(id!, payload)
      : !!(await jobService.createJob(payload as Parameters<typeof jobService.createJob>[0]))
    if (ok) {
      toast.success(isEdit ? 'Job updated.' : 'Job posted.')
      navigate('/admin/jobs')
    } else {
      toast.error('Failed to save job.')
    }
    setSaving(false)
  }

  const inputSt: React.CSSProperties = {
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
  }

  const labelSt: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)' as string,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 5,
  }

  const fieldWrap: React.CSSProperties = { marginBottom: 18 }

  if (loadingJob) {
    return (
      <div className="main">
        <p style={{ padding: 32, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          Loading job...
        </p>
      </div>
    )
  }

  return (
    <div className="main">
      <AdminPageHeader
        title={isEdit ? 'Edit Job' : 'Post New Job'}
        icon="work"
        description={
          isEdit
            ? 'Update the details for this job listing.'
            : 'Create a new job opportunity for The Base Movement network.'
        }
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/jobs')}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              arrow_back
            </span>
            Jobs Board
          </button>
        }
      />

      <div className="panel" style={{ maxWidth: 720, padding: 28 }}>
        {/* Row 1: Title + Organisation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
          <div style={fieldWrap}>
            <label style={labelSt}>
              Job Title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Regional Coordinator"
              style={inputSt}
            />
          </div>
          <div style={fieldWrap}>
            <label style={labelSt}>
              Organisation <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              type="text"
              value={form.organization}
              onChange={(e) => set('organization', e.target.value)}
              placeholder="e.g. The Base Movement"
              style={inputSt}
            />
          </div>
        </div>

        {/* Description */}
        <div style={fieldWrap}>
          <label style={labelSt}>
            Description <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={6}
            placeholder="Describe the role, responsibilities, and what success looks like..."
            style={{
              ...inputSt,
              height: 'auto',
              padding: '10px 12px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Requirements */}
        <div style={fieldWrap}>
          <label style={labelSt}>Requirements</label>
          <textarea
            value={form.requirements}
            onChange={(e) => set('requirements', e.target.value)}
            rows={4}
            placeholder="List qualifications, experience, or skills required..."
            style={{
              ...inputSt,
              height: 'auto',
              padding: '10px 12px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Row: Type + Category + Network */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelSt}>Job Type</label>
            <select
              value={form.job_type}
              onChange={(e) => set('job_type', e.target.value)}
              style={inputSt}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelSt}>Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              style={inputSt}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelSt}>Network</label>
            <select
              value={form.platform_filter}
              onChange={(e) => set('platform_filter', e.target.value)}
              style={inputSt}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row: Location + Salary + Deadline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelSt}>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Accra or Remote"
              style={inputSt}
            />
          </div>
          <div style={fieldWrap}>
            <label style={labelSt}>Salary Range</label>
            <input
              type="text"
              value={form.salary_range}
              onChange={(e) => set('salary_range', e.target.value)}
              placeholder="e.g. GHS 3,000 – 5,000"
              style={inputSt}
            />
          </div>
          <div style={fieldWrap}>
            <label style={labelSt}>Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              style={inputSt}
            />
          </div>
        </div>

        {/* Status */}
        <div style={{ ...fieldWrap, maxWidth: 200 }}>
          <label style={labelSt}>Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            style={inputSt}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            paddingTop: 16,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Post Job'}
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/admin/jobs')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
