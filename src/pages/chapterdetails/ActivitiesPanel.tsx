import type { ChapterActivity } from '@/types/admin'

interface ActivitiesPanelProps {
  activities: ChapterActivity[] | undefined
}

export function ActivitiesPanel({ activities }: ActivitiesPanelProps) {
  return (
    <div className="panel" style={{ padding: '20px 22px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
          >
            calendar_month
          </span>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Recent activities
          </span>
        </div>
        <button
          style={{
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--primary))',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: 0,
          }}
        >
          View all
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activities && activities.length > 0 ? (
          activities.map((activity: ChapterActivity, i: number) => {
            const date = new Date(activity.activityDate)
            const month = date.toLocaleString('en-US', { month: 'short' })
            const day = date.getDate()
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  background: 'hsl(var(--container-low))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {month}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {activity.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginTop: 2,
                      }}
                    >
                      {activity.type}
                    </div>
                  </div>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                >
                  chevron_right
                </span>
              </div>
            )
          })
        ) : (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              border: '1px dashed hsl(var(--border))',
              borderRadius: 4,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              No community events have been announced yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
