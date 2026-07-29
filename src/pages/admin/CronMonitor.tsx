import { useState, useEffect } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminService, type CronHttpFailure, type CronJobStatus } from '@/services/adminService'

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

/**
 * pg_cron only records whether the command was dispatched, so this says nothing
 * about what the edge function returned. Misconfigured auth is the failure this
 * page can actually prove, so it is surfaced as its own column.
 */
function hasFailed(job: CronJobStatus): boolean {
  return (
    !!job.dispatch_status &&
    job.dispatch_status !== 'succeeded' &&
    job.dispatch_status !== 'running'
  )
}

function getStatusBadge(job: CronJobStatus) {
  if (!job.active) {
    return <span className="pill pill-mute">Inactive</span>
  }
  if (!job.last_run_start) {
    return <span className="pill pill-warn">Never Run</span>
  }
  if (hasFailed(job)) {
    return <span className="pill pill-err">Failed</span>
  }
  return <span className="pill pill-ok">Success</span>
}

function getStatusIcon(job: CronJobStatus): React.ReactNode {
  if (!job.active) {
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6f7a71' }}>
        pause_circle
      </span>
    )
  }
  if (!job.last_run_start) {
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#e8b923' }}>
        schedule
      </span>
    )
  }
  if (hasFailed(job)) {
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
  const [jobs, setJobs] = useState<CronJobStatus[]>([])
  const [failures, setFailures] = useState<CronHttpFailure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchCronJobs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [data, httpFailures] = await Promise.all([
        adminService.getCronJobStatus(),
        adminService.getCronHttpFailures(),
      ])
      setJobs(data)
      setFailures(httpFailures)
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

      <p
        style={{
          fontSize: '12px',
          color: 'hsl(var(--on-surface-muted))',
          margin: '0 0 12px',
          maxWidth: '70ch',
        }}
      >
        <strong style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>Dispatch</strong> reports
        only that pg_cron fired the request — not what the function returned. A job can read Success
        here and still fail on every run. Check the Auth column and the failures below.
      </p>

      {failures.length > 0 && (
        <div
          className="panel"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderLeft: `3px solid hsl(var(--destructive))`,
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontSize: '13px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Failed HTTP calls in the last 24h
          </p>
          <p
            style={{ margin: '0 0 10px', fontSize: '11px', color: 'hsl(var(--on-surface-muted))' }}
          >
            pg_net does not retain the URL after a request completes, so these cannot be tied to a
            specific job.
          </p>
          {failures.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'baseline',
                fontSize: '12px',
                padding: '4px 0',
                borderTop: i === 0 ? 'none' : `1px solid hsl(var(--border))`,
              }}
            >
              <span className={`pill ${f.timed_out ? 'pill-warn' : 'pill-err'}`}>
                {f.timed_out ? 'Timeout' : (f.status_code ?? 'error')}
              </span>
              <span style={{ color: 'hsl(var(--on-surface-muted))' }}>×{f.occurrences}</span>
              <span
                style={{
                  color: 'hsl(var(--on-surface-muted))',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
                title={f.detail}
              >
                {f.detail}
              </span>
              <span style={{ color: 'hsl(var(--on-surface-muted))', whiteSpace: 'nowrap' }}>
                {formatDate(f.most_recent)}
              </span>
            </div>
          ))}
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
                  Dispatch
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Auth
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
                    {formatDate(job.last_run_start)}
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
                  <td style={{ padding: '12px 16px' }}>
                    {job.sends_auth === null ? (
                      <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                    ) : job.sends_auth ? (
                      <span className="pill pill-ok">Token</span>
                    ) : (
                      <span
                        className="pill pill-err"
                        title="This job posts no Authorization header. If the target function is gated, every run returns 401 while Dispatch still reads Success."
                      >
                        No header
                      </span>
                    )}
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
