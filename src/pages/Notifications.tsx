import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/admin'

type Filter = 'all' | 'unread' | 'direct'

const TYPE_ICON: Record<string, string> = {
  Alert: 'warning',
  Action: 'task_alt',
  'Direct Message': 'mail',
  Info: 'info',
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

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [markingAll, setMarkingAll] = useState(false)
  const [openItem, setOpenItem] = useState<Notification | null>(null)

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
    return true
  })

  async function markRead(id: string) {
    await adminService.markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markUnread(id: string) {
    await supabase.from('notifications').update({ is_read: false }).eq('id', id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)))
  }

  function openNotification(n: Notification) {
    setOpenItem(n)
    if (!n.is_read) void markRead(n.id)
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

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    {
      id: 'direct',
      label: 'Direct Messages',
      count: items.filter((n) => n.type === 'Direct Message').length,
    },
  ]

  return (
    <div className="main">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-outline" onClick={markAllRead} disabled={markingAll}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              done_all
            </span>
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
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
            {f.count !== undefined && f.count > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  padding: '1px 6px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {f.count}
              </span>
            )}
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
            {filter === 'unread' ? 'All caught up.' : 'No notifications here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map((n) => {
            const icon = TYPE_ICON[n.type] ?? 'info'
            const color = TYPE_COLOR[n.type] ?? 'hsl(var(--on-surface-muted))'
            return (
              <div
                key={n.id}
                onClick={() => openNotification(n)}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  background: n.is_read ? 'hsl(var(--background))' : 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background .15s',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-pill)',
                    background: n.is_read ? 'hsl(var(--container-low))' : 'hsl(var(--card))',
                    border: `1.5px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>
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
                            background: 'hsl(var(--primary))',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {formatDate(n.created_at)}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (n.is_read) void markUnread(n.id)
                          else void markRead(n.id)
                        }}
                        style={{ padding: '2px 6px', minWidth: 0 }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                        >
                          {n.is_read ? 'mark_email_unread' : 'mark_email_read'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '4px 0 0',
                      lineHeight: 1.5,
                    }}
                  >
                    {n.message}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      padding: '2px 8px',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    {n.type}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {openItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setOpenItem(null)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-pill)',
                  border: `1.5px solid ${TYPE_COLOR[openItem.type] ?? 'hsl(var(--on-surface-muted))'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    color: TYPE_COLOR[openItem.type] ?? 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {TYPE_ICON[openItem.type] ?? 'info'}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {openItem.title}
                </p>
                <p
                  style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}
                >
                  {openItem.type} — {formatDate(openItem.created_at)}
                </p>
              </div>
              <button
                aria-label="Close"
                className="btn btn-ghost btn-sm"
                onClick={() => setOpenItem(null)}
                style={{ padding: '2px 6px', minWidth: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>
            <div style={{ padding: '18px' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {openItem.message}
              </p>
            </div>
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  void markUnread(openItem.id)
                  setOpenItem(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  mark_email_unread
                </span>
                Mark as unread
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setOpenItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
