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
          <div key={app.id} className="panel" style={{ padding: '16px 20px' }}>
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
                  color: isRemoved ? 'hsl(var(--on-surface-muted))' : 'hsl(var(--on-surface))',
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
