import { Link } from 'react-router-dom'
import type { ChapterMember } from './types'

interface HubMembersListProps {
  members: ChapterMember[]
  searchQuery: string
  setSearchQuery: (query: string) => void
}

function statusClass(status: string) {
  if (status === 'Active' || status === 'Approved') return 'pill-ok'
  if (status === 'Pending') return 'pill-warn'
  return 'pill-mute'
}

export function HubMembersList({ members, searchQuery, setSearchQuery }: HubMembersListProps) {
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase()
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.regNo.toLowerCase().includes(q) ||
      m.phone.includes(q)
    )
  })

  const searchBar = (
    <div
      style={{
        padding: '12px 18px',
        borderBottom: '1px solid hsl(var(--border))',
        position: 'relative',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          left: 30,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 16,
          color: 'hsl(var(--on-surface-muted))',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      >
        search
      </span>
      <input
        aria-label="Search by name, reg. ID, or phone"
        name="memberSearch"
        id="hub-member-search"
        type="text"
        placeholder="Search by name, reg. ID, or phone..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          height: 38,
          paddingLeft: 38,
          paddingRight: 12,
          background: 'hsl(var(--container-low))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-xs)',
          fontSize: 13,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )

  const emptyState = (
    <div
      style={{
        padding: '48px 18px',
        textAlign: 'center',
        fontSize: 13,
        color: 'hsl(var(--on-surface-muted))',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {members.length === 0
        ? 'No members have joined this chapter yet.'
        : 'No members match your search.'}
    </div>
  )

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {searchBar}

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              {['Member', 'Reg. ID', 'Region / Constituency', 'Status', 'Joined'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 18px',
                    textAlign: 'left',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5}>{emptyState}</td>
              </tr>
            ) : (
              filteredMembers.map((m) => (
                <tr key={m.regNo} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt={m.name}
                          />
                        ) : (
                          m.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {m.name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {m.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: 'monospace',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.regNo}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {m.region}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {m.constituency}
                    </p>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span className={`pill ${statusClass(m.status)}`}>{m.status}</span>
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.joined}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="mobile-only">
        {filteredMembers.length === 0 ? (
          emptyState
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredMembers.map((m) => (
              <div
                key={m.regNo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    flexShrink: 0,
                    overflow: 'hidden',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={m.name}
                    />
                  ) : (
                    m.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                  )}
                </div>

                {/* Name + reg */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: 'monospace',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.regNo}
                  </p>
                </div>

                {/* Status + View */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className={`pill ${statusClass(m.status)}`}>{m.status}</span>
                  <Link
                    to="/admin/members"
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0 10px', fontSize: 11 }}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
