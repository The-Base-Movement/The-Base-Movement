import { useState, useEffect } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { authService } from '@/services/authService'

interface CronJob {
  jobname: string
  schedule: string
  timezone: string
  active: boolean
  last_run_start: string | null
  last_run_end: string | null
  last_message: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getStatusBadge(job: CronJob) {
  if (!job.active) {
    return <span className="pill pill-mute">Inactive</span>
  }
  if (!job.last_run_end) {
    return <span className="pill pill-warn">Never Run</span>
  }
  if (job.last_message && job.last_message.toLowerCase().includes('error')) {
    return <span className="pill pill-err">Failed</span>
  }
  return <span className="pill pill-ok">Success</span>
}

function getStatusIcon(job: CronJob): React.ReactNode {
  if (!job.active) {
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6f7a71' }}>
        pause_circle
      </span>
    )
  }
  if (!job.last_run_end) {
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#e8b923' }}>
        schedule
      </span>
    )
  }
  if (job.last_message && job.last_message.toLowerCase().includes('error')) {
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ce1126' }}>
        error
      </span>
    )
  }
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#006b3f' }}>
      check_circle
    </span>
  )
}

export default function CronMonitor() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchCronJobs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = authService.getToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/functions/v1/get-cron-jobs', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch cron jobs')
        return
      }

      const data = await response.json()
      setJobs(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Could not fetch cron jobs: ${message}`)
      console.error('[CRON-MONITOR] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCronJobs()
  }, [])

  return (
    <div className="main" style={{ padding: '20px' }}>
      <AdminPageHeader
        title="Cron Monitor"
        description="View scheduled jobs and their execution history"
        icon="schedule"
      />

      {error && (
        <div
          style={{
            background: 'hsl(var(--destructive) / 0.1)',
            border: `1px solid hsl(var(--destructive))`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            color: 'hsl(var(--destructive))',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={fetchCronJobs}
          disabled={isLoading}
          className="btn btn-primary"
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
        {lastUpdated && (
          <span
            style={{
              fontSize: '12px',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Last updated: {lastUpdated.toLocaleTimeString('en-GB')}
          </span>
        )}
      </div>

      {isLoading && jobs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, display: 'block', marginBottom: '8px' }}
          >
            hourglass_empty
          </span>
          Loading cron jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, display: 'block', marginBottom: '8px' }}
          >
            inbox
          </span>
          No cron jobs found
        </div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid hsl(var(--border))`,
                  background: 'hsl(var(--container-low))',
                }}
              >
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Job Name
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Schedule
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Last Run
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => (
                <tr
                  key={job.jobname}
                  style={{
                    borderBottom: `1px solid hsl(var(--border))`,
                    background: idx % 2 === 0 ? 'transparent' : 'hsl(var(--container-low) / 0.5)',
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      color: 'hsl(var(--on-surface))',
                      fontWeight: '500',
                    }}
                  >
                    {job.jobname}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: '"Courier New", monospace',
                      fontSize: '12px',
                    }}
                  >
                    {job.schedule}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: '12px',
                    }}
                  >
                    {formatDate(job.last_run_end)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {getStatusIcon(job)}
                    {getStatusBadge(job)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: '12px',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={job.last_message || ''}
                  >
                    {job.last_message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
