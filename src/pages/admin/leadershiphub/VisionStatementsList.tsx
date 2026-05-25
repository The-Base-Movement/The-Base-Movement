import type { ChapterApplication } from '@/services/adminService'

interface VisionStatementsListProps {
  filteredApps: ChapterApplication[]
}

export function VisionStatementsList({ filteredApps }: VisionStatementsListProps) {
  const pendingApps = filteredApps.filter((a: ChapterApplication) => a.status === 'Pending')

  if (pendingApps.length === 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        marginTop: 24,
      }}
    >
      {pendingApps.slice(0, 2).map((app: ChapterApplication) => (
        <div key={`detail-${app.id}`} className="panel" style={{ padding: 32 }}>
          <span
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 16,
              letterSpacing: '0.05em',
            }}
          >
            Applicant vision statement
          </span>
          <blockquote
            style={{
              borderLeft: '3px solid hsl(var(--accent))',
              paddingLeft: 20,
              margin: '0 0 24px 0',
              fontStyle: 'italic',
              color: 'hsl(var(--on-surface))',
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: 'var(--font-weight-normal, 400)',
            }}
          >
            "{app.vision_statement}"
          </blockquote>
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              padding: 20,
              borderRadius: 4,
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 9,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 8,
                letterSpacing: '0.05em',
              }}
            >
              Experience summary
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.5,
                fontWeight: 'var(--font-weight-normal, 400)',
              }}
            >
              {app.experience_summary}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
