import type { ConstituencyMember } from './ConstituencyHubTypes'

interface Props {
  memberSearch: string
  setMemberSearch: (v: string) => void
  filteredMembers: ConstituencyMember[]
}

export function MembersTab({ memberSearch, setMemberSearch, filteredMembers }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Search by name, reg no or phone..."
          style={{
            height: 40,
            width: '100%',
            maxWidth: 340,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            boxSizing: 'border-box',
          }}
        />
      </div>
      {filteredMembers.length === 0 ? (
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>No members found.</p>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Member', 'Reg No', 'Phone', 'Region', 'Joined', 'Status'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr
                  key={m.authId}
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-pill)',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-pill)',
                            background: 'hsl(var(--container-low))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                          >
                            person
                          </span>
                        </div>
                      )}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {m.name}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.regNo || '—'}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.phone}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.region}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.joined}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : 'pill-warn'}`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MembersTab
