import type { ChapterMember } from './types'

interface HubMembersListProps {
  members: ChapterMember[]
  searchQuery: string
  setSearchQuery: (query: string) => void
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

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
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
          id="input-681c07"
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
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
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
                    fontWeight: 'var(--font-weight-semibold, 600)',
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
                <td
                  colSpan={5}
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
                </td>
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
                          borderRadius: 4,
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--font-weight-semibold, 600)',
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
                    <span
                      className={`pill ${
                        m.status === 'Active' || m.status === 'Approved'
                          ? 'pill-ok'
                          : m.status === 'Pending'
                            ? 'pill-warn'
                            : 'pill-mute'
                      }`}
                    >
                      {m.status}
                    </span>
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
    </div>
  )
}
