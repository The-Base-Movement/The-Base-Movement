import { useState, useMemo } from 'react'
import { SortToggle } from '@/components/ui/SortToggle'

interface FieldAgent {
  id: string
  member_id: string
  member_name: string
  registration_number: string
  constituency: string
  region: string | null
  status: 'active' | 'inactive'
  notes: string | null
  created_at: string
  avatar_url: string | null
}

interface FieldAgentsListProps {
  fieldAgents: FieldAgent[]
  onAppointFieldAgent: () => void
  onRemoveFieldAgent: (id: string, name: string) => Promise<void>
}

export function FieldAgentsList({
  fieldAgents,
  onAppointFieldAgent,
  onRemoveFieldAgent,
}: FieldAgentsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortedAgents = useMemo(() => {
    const list = fieldAgents.filter((a) => {
      const q = searchQuery.toLowerCase()
      return (
        !q ||
        a.member_name.toLowerCase().includes(q) ||
        a.constituency.toLowerCase().includes(q) ||
        (a.region || '').toLowerCase().includes(q)
      )
    })
    return list.sort((a, b) => {
      const nameA = a.member_name || ''
      const nameB = b.member_name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [fieldAgents, searchQuery, sortOrder])
  return (
    <div className="panel">
      {/* Header — title, description, button each on own row */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              letterSpacing: '-0.01em',
            }}
          >
            Field agents
          </h3>
          <button
            className="btn btn-primary btn-xs"
            onClick={onAppointFieldAgent}
            style={{ padding: '0 8px', height: 26, fontSize: 11 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              add
            </span>
            Appoint
          </button>
        </div>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          Members deployed to mobilize specific constituencies.
        </p>

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
              id="field-agents-search"
              name="field-agents-search"
              aria-label="Search field agents"
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
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {fieldAgents.length === 0
            ? 'No field agents appointed yet.'
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
                borderBottom: i < fieldAgents.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  flexShrink: 0,
                  color: 'hsl(var(--primary))',
                  overflow: 'hidden',
                }}
              >
                {a.avatar_url ? (
                  <img
                    src={a.avatar_url}
                    alt={a.member_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  a.member_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {a.member_name}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {a.constituency}
                  {a.region ? ` · ${a.region}` : ''}
                </p>
              </div>

              <span className="pill pill-ok" style={{ fontSize: 9.5 }}>
                Active
              </span>
              <button
                onClick={() => onRemoveFieldAgent(a.id, a.member_name)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 'var(--radius-sm)',
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
