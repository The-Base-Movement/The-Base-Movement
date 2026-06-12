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
