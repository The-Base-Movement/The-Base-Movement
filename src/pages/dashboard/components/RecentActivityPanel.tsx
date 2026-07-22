import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanelHeader } from './PanelHeader'
import {
  userActivityService,
  type ActivityEntry,
  type ActivityType,
} from '@/services/userActivityService'

const ICON_MAP: Partial<Record<ActivityType, string>> = {
  login: 'login',
  logout: 'logout',
  profile_update: 'manage_accounts',
  password_change: 'lock_reset',
  donation: 'volunteer_activism',
  poll_vote: 'how_to_vote',
  store_order: 'shopping_bag',
  notification: 'notifications',
  wishlist: 'favorite',
  helpdesk_ticket: 'support_agent',
  chapter_poll_vote: 'groups',
  feedback: 'rate_review',
  voter_registration: 'how_to_reg',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RecentActivityPanel({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    userActivityService
      .getUserActivityAnalytics(userId, since)
      .then((data) => {
        setEntries(data.entries.slice(0, 12))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId])

  return (
    <div
      className="panel"
      style={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <PanelHeader
        title="My recent activity"
        action={
          <Link
            to="/dashboard/activity"
            style={{
              fontSize: 11,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#fff',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            View all
          </Link>
        }
      />

      <div
        style={{
          padding: '18px 24px',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              margin: 0,
            }}
          >
            Loading…
          </p>
        ) : entries.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              margin: 0,
            }}
          >
            No activity in the last 7 days.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {entries.map((e) => (
              <div
                key={`${e.source ?? 'activity'}-${e.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--primary))', flexShrink: 0 }}
                >
                  {ICON_MAP[e.action_type] ?? 'history'}
                </span>
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
                  {timeAgo(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
