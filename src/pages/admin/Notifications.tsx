import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Notification } from '@/types/admin'

type Filter = 'all' | 'unread' | 'direct' | 'alert'

const TYPE_ICON: Record<string, string> = {
  Alert: 'warning',
  Action: 'rocket_launch',
  'Direct Message': 'mail',
  Info: 'psychology',
}

const TYPE_COLOR: Record<string, string> = {
  Alert: 'hsl(var(--destructive))',
  Action: 'hsl(var(--accent))',
  'Direct Message': 'hsl(var(--primary))',
  Info: 'hsl(var(--on-surface-muted))',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const diff = today.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7)
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminNotifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    adminService.getNotifications().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  const unreadCount = items.filter((n) => !n.is_read).length

  const filtered = items.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'direct') return n.type === 'Direct Message'
    if (filter === 'alert') return n.type === 'Alert'
    return true
  })

  async function markRead(id: string) {
    await adminService.markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    if (!unreadCount) return
    setMarkingAll(true)
    const unread = items.filter((n) => !n.is_read)
    await Promise.all(
      unread.map((n) => supabase.from('notifications').update({ is_read: true }).eq('id', n.id))
    )
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  const kpis = [
    { label: 'Total', value: items.length, bar: 'hsl(var(--on-surface))' },
    { label: 'Unread', value: unreadCount, bar: 'hsl(var(--destructive))' },
    {
      label: 'Alerts',
      value: items.filter((n) => n.type === 'Alert').length,
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Direct Messages',
      value: items.filter((n) => n.type === 'Direct Message').length,
      bar: 'hsl(var(--primary))',
    },
  ]

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'alert', label: 'Alerts' },
    { id: 'direct', label: 'Direct Messages' },
  ]

  return (
    <div className="main">
      <AdminPageHeader
        title="Alert Centre"
        icon="notifications"
        description="System alerts, broadcasts, and direct messages delivered to this admin account."
        actions={
          unreadCount > 0 ? (
            <button className="btn btn-sm btn-outline" onClick={markAllRead} disabled={markingAll}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                done_all
              </span>
              {markingAll ? 'Clearing…' : 'Clear all'}
            </button>
          ) : undefined
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--border))' }}
          >
            notifications_none
          </span>
          <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
            {filter === 'unread' ? 'All clear — nothing unread.' : 'No notifications here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map((n) => {
            const icon = TYPE_ICON[n.type] ?? 'notifications'
            const color = TYPE_COLOR[n.type] ?? 'hsl(var(--on-surface-muted))'
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead(n.id)
                }}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  background: n.is_read ? 'hsl(var(--background))' : 'rgba(206,17,38,.03)',
                  border: '1px solid hsl(var(--border))',
                  borderLeft: n.is_read ? '1px solid hsl(var(--border))' : `3px solid ${color}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: n.is_read ? 'default' : 'pointer',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: n.is_read ? 'hsl(var(--container-low))' : color,
                    color: n.is_read ? 'hsl(var(--on-surface-muted))' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {icon}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                      }}
                    >
                      {n.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {!n.is_read && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: 'hsl(var(--destructive))',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '4px 0 6px',
                      lineHeight: 1.5,
                    }}
                  >
                    {n.message}
                  </p>
                  <span
                    className="pill pill-mute"
                    style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}
                  >
                    {n.type}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
