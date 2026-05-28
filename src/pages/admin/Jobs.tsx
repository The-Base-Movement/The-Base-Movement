import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobService } from '@/services/jobService'
import type { Job, JobFilters } from '@/types/jobs'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ApplicationsDrawer } from './jobs/ApplicationsDrawer'
import { toast } from 'sonner'

const STATUS_PILL: Record<string, string> = {
  draft: 'pill-mute',
  published: 'pill-ok',
  closed: 'pill-warn',
}

export default function AdminJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    status: '',
    category: '',
    job_type: '',
  })
  const [drawerJob, setDrawerJob] = useState<Job | null>(null)

  const load = useCallback(() => {
    void (async () => {
      setLoading(true)
      const data = await jobService.getAllJobsAdmin(filters)
      setJobs(data)
      setLoading(false)
    })()
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
          <button className="btn btn-primary" onClick={() => navigate('/admin/jobs/new')}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {/* Row 1 — search, full width */}
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            placeholder="Search title or organisation..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 34,
              paddingRight: 12,
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
        {/* Row 2 — status tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                        onClick={() => navigate(`/admin/jobs/${job.id}/edit`)}
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

      {drawerJob && <ApplicationsDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />}
    </div>
  )
}
