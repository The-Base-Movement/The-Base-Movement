import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  userActivityService,
  type ActivityEntry,
  type ActivityType,
} from '@/services/userActivityService'

const ICON_MAP: Record<ActivityType, string> = {
  login: 'login',
  logout: 'logout',
  profile_update: 'manage_accounts',
  password_change: 'lock_reset',
  donation: 'volunteer_activism',
  poll_vote: 'how_to_vote',
  store_order: 'shopping_bag',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDateHeading(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function groupByDate(entries: ActivityEntry[]): { heading: string; items: ActivityEntry[] }[] {
  const groups: Map<string, ActivityEntry[]> = new Map()
  for (const e of entries) {
    const key = new Date(e.created_at).toDateString()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(e)
  }
  return Array.from(groups.entries()).map(([, items]) => ({
    heading: formatDateHeading(items[0].created_at),
    items,
  }))
}

export default function Activity() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    userActivityService.getUserActivity(user.id, 50).then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [user])

  const groups = groupByDate(entries)

  return (
    <div className="main" style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Dashboard
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'var(--fs-xl, 28px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          My Activity
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Your account activity over the last 7 days.
        </p>
      </div>

      {loading ? (
        <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--primary))',
              animation: 'spin 1.2s linear infinite',
            }}
          >
            sync
          </span>
        </div>
      ) : entries.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', marginBottom: 12 }}
          >
            history
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            No activity in the last 7 days.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map((group) => (
            <div key={group.heading}>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 10px',
                }}
              >
                {group.heading}
              </p>
              <div className="panel" style={{ padding: '0 24px' }}>
                {group.items.map((e, i) => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom:
                        i < group.items.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-md)',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 17, color: 'hsl(var(--primary))' }}
                      >
                        {ICON_MAP[e.action_type] ?? 'history'}
                      </span>
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {e.description}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface-muted))',
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(e.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
