import { useState, useMemo } from 'react'
import { SortToggle } from '@/components/ui/SortToggle'

interface PollingAgent {
  id: string
  member_id: string
  member_name: string
  registration_number: string
  polling_station_id: string
  constituency: string | null
  region: string | null
  status: 'assigned' | 'confirmed' | 'deployed' | 'stood_down'
  notes: string | null
  created_at: string
}

interface PollingAgentsListProps {
  pollingAgents: PollingAgent[]
  onRemovePollingAgent: (id: string, name: string) => Promise<void>
}

export function PollingAgentsList({ pollingAgents, onRemovePollingAgent }: PollingAgentsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortedAgents = useMemo(() => {
    const list = pollingAgents.filter((a) => {
      const q = searchQuery.toLowerCase()
      return (
        !q ||
        a.member_name.toLowerCase().includes(q) ||
        a.polling_station_id.toLowerCase().includes(q) ||
        (a.constituency || '').toLowerCase().includes(q)
      )
    })
    return list.sort((a, b) => {
      const nameA = a.member_name || ''
      const nameB = b.member_name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [pollingAgents, searchQuery, sortOrder])
  return (
    <div className="panel">
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div>
          <h3>Polling station agents</h3>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-normal, 400)',
              marginTop: 2,
              marginBottom: 10,
            }}
          >
            Members stationed at specific polling stations on election day.
          </p>
        </div>

        {/* Search & Sort input */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              id="station-agents-search"
              name="station-agents-search"
              aria-label="Search station agents"
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 30,
                paddingLeft: 28,
                paddingRight: 8,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-xs)',
                fontSize: 11,
                fontFamily: "'Public Sans', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <SortToggle value={sortOrder} onChange={setSortOrder} />
        </div>
      </div>
      {sortedAgents.length === 0 ? (
        <p
          style={{
            padding: '24px 18px',
            textAlign: 'center',
            fontFamily: "'Public Sans'",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {pollingAgents.length === 0
            ? 'No station agents appointed. Use the Member Readiness table below to appoint.'
            : 'No agents match your search.'}
        </p>
      ) : (
        <div style={{ padding: '6px 0' }}>
          {sortedAgents.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 18px',
                borderBottom:
                  i < pollingAgents.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Public Sans'",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  flexShrink: 0,
                  color: 'hsl(var(--accent))',
                }}
              >
                {a.member_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12.5,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.member_name}
                </b>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    background: 'hsl(var(--container-low))',
                    padding: '1px 6px',
                    borderRadius: 3,
                    letterSpacing: '.04em',
                  }}
                >
                  {a.polling_station_id}
                </span>
                {a.constituency && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans'",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      marginLeft: 6,
                    }}
                  >
                    {a.constituency}
                  </span>
                )}
              </div>
              <span
                className={
                  a.status === 'deployed'
                    ? 'pill pill-ok'
                    : a.status === 'confirmed'
                      ? 'pill pill-warn'
                      : 'pill pill-mute'
                }
                style={{ fontSize: 9.5, textTransform: 'capitalize' }}
              >
                {a.status}
              </span>
              <button
                onClick={() => onRemovePollingAgent(a.id, a.member_name)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
