import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMediaHubLayout } from './MediaHubContext'
import { mediaHubService, type WallSubmission } from '@/services/mediaHubService'
import { toast } from 'sonner'

const STATUS_PILL: Record<WallSubmission['status'], string> = {
  new: 'pill-warn',
  reviewed: 'pill-ok',
  archived: 'pill-mute',
}

const FILTERS = ['new', 'reviewed', 'archived', 'all'] as const
type Filter = (typeof FILTERS)[number]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function MediaInbox() {
  useMediaHubLayout('Inbox', 'inbox', 'Links sent in by Media and Mobilization members.')

  const [items, setItems] = useState<WallSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('new')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await mediaHubService.getInboxSubmissions()
        if (!cancelled) setItems(data)
      } catch {
        toast.error('Failed to load inbox')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setStatus = useCallback(async (id: string, status: WallSubmission['status']) => {
    const ok = await mediaHubService.updateSubmissionStatus(id, status)
    if (ok) {
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    } else {
      toast.error('Could not update')
    }
  }, [])

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((s) => s.status === filter)),
    [items, filter]
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize', fontSize: 13 }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p
          style={{
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            padding: 20,
            textAlign: 'center',
          }}
        >
          Loading inbox…
        </p>
      ) : filtered.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, marginBottom: 8, display: 'block' }}
          >
            inbox
          </span>
          Nothing here yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s) => (
            <div key={s.id} className="panel" style={{ padding: '14px 16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                <span
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {s.author_name ?? 'Unknown member'}
                </span>
                <span>{timeAgo(s.created_at)}</span>
                <span
                  className={`pill ${STATUS_PILL[s.status]}`}
                  style={{ fontSize: 10, marginLeft: 'auto', textTransform: 'capitalize' }}
                >
                  {s.status}
                </span>
              </div>

              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'hsl(var(--primary))',
                  wordBreak: 'break-all',
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  link
                </span>
                {s.link}
              </a>

              {s.note && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    margin: '8px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {s.note}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {s.status !== 'reviewed' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setStatus(s.id, 'reviewed')}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, marginRight: 4 }}
                    >
                      done
                    </span>
                    Mark reviewed
                  </button>
                )}
                {s.status !== 'archived' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setStatus(s.id, 'archived')}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, marginRight: 4 }}
                    >
                      archive
                    </span>
                    Archive
                  </button>
                )}
                {s.status !== 'new' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(s.id, 'new')}>
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
