import type { Broadcast } from '@/services/adminService'
import { priorityStyle, targetLabel, pillBase } from './styles'

interface BroadcastHistoryProps {
  isLoading: boolean
  filteredBroadcasts: Broadcast[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  broadcastMetrics: Record<string, { total: number; read: number }>
  fetchMetrics: (id: string) => Promise<void>
}

export function BroadcastHistory({
  isLoading,
  filteredBroadcasts,
  searchQuery,
  setSearchQuery,
  broadcastMetrics,
  fetchMetrics,
}: BroadcastHistoryProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Broadcast history
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 2,
            }}
          >
            HQ-to-field transmission log
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            aria-label="Search broadcasts…"
            name="searchQuery"
            id="input-ee6569"
            type="text"
            placeholder="Search broadcasts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              height: 36,
              paddingLeft: 30,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              outline: 'none',
              background: '#fff',
              color: 'hsl(var(--on-surface))',
              width: 220,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            gap: 12,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 40,
              color: 'hsl(var(--border))',
              animation: 'spin 1s linear infinite',
            }}
          >
            hourglass_empty
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Retrieving comm logs…
          </p>
        </div>
      ) : filteredBroadcasts.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            gap: 12,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--border))' }}
          >
            campaign
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            No broadcasts found
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: 800, overflowY: 'auto' }}>
          {filteredBroadcasts.map((b) => {
            const metrics = broadcastMetrics[b.id]
            const readPct =
              metrics && metrics.total > 0 ? Math.round((metrics.read / metrics.total) * 100) : null
            return (
              <div
                key={b.id}
                style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  <span style={{ ...pillBase, ...priorityStyle(b.priority) }}>{b.priority}</span>
                  <span
                    style={{
                      ...pillBase,
                      background: 'hsl(var(--container-low))',
                      color: 'hsl(var(--on-surface-muted))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    {targetLabel(b.target_type, b.target_value)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    marginBottom: 6,
                  }}
                >
                  {b.title}
                </div>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  {b.content}
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        schedule
                      </span>
                      {new Date(b.created_at).toLocaleString()}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        check_circle
                      </span>
                      Confirmed
                    </span>
                    {metrics && readPct !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {metrics.read}/{metrics.total} Read
                        </span>
                        <div
                          style={{
                            width: 64,
                            height: 4,
                            background: 'hsl(var(--border))',
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              background: 'hsl(var(--primary))',
                              width: `${readPct}%`,
                              transition: 'width 1s ease',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => fetchMetrics(b.id)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      refresh
                    </span>
                    Refresh
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
