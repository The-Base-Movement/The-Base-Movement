import { useState, useEffect } from 'react'

interface ChapterMember {
  authId: string
  regNo: string
  name: string
  phone: string
  region: string
  constituency: string
  status: string
  joined: string
  avatarUrl?: string
}

interface Props {
  members: ChapterMember[]
  filteredMembers: ChapterMember[]
  memberSearch: string
  onSearchChange: (value: string) => void
}

function MemberAvatar({ member, size = 34 }: { member: ChapterMember; size?: number }) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        background: 'hsl(var(--container-low))',
        border: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'var(--font-weight-medium, 500)',
        fontSize: size < 40 ? 11 : 14,
        flexShrink: 0,
        overflow: 'hidden',
        color: 'hsl(var(--on-surface-muted))',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt={member.name}
        />
      ) : (
        initials
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const isOk = status === 'Active' || status === 'Approved'
  const isWarn = status === 'Pending'
  return (
    <span className={`pill ${isOk ? 'pill-ok' : isWarn ? 'pill-warn' : 'pill-mute'}`}>
      {status}
    </span>
  )
}

function ProfileCard({ member, onClose }: { member: ChapterMember; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Slide-up card */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 101,
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          padding: '24px 20px 36px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.22s ease',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 'var(--radius-pill)',
            background: 'hsl(var(--border))',
            margin: '0 auto 20px',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <MemberAvatar member={member} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 15,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {member.name}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: 'monospace',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {member.regNo}
            </p>
          </div>
          <StatusPill status={member.status} />
        </div>

        {/* Detail rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Phone', value: member.phone },
            { label: 'Region', value: member.region },
            { label: 'Constituency', value: member.constituency },
            { label: 'Joined', value: member.joined },
          ].map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
                background: i % 2 === 0 ? '#fff' : 'hsl(var(--container-low))',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  textAlign: 'right',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}

export function MembersTab({ members, filteredMembers, memberSearch, onSearchChange }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ChapterMember | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        aria-label="Search by name, reg. ID, or phone…"
        name="memberSearch"
        id="input-d74d97"
        type="text"
        placeholder="Search by name, reg. ID, or phone…"
        value={memberSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: '100%',
          height: 38,
          paddingLeft: 38,
          paddingRight: 12,
          background: 'hsl(var(--container-low))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {searchBar}

      {isMobile ? (
        /* ── Mobile: name list with View button ── */
        <div>
          {filteredMembers.length === 0 ? (
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
          ) : (
            filteredMembers.map((m, i) => (
              <div
                key={m.regNo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom:
                    i < filteredMembers.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}
              >
                <MemberAvatar member={m} size={36} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.name}
                  </p>
                  <StatusPill status={m.status} />
                </div>

                <button
                  onClick={() => setSelectedMember(m)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'hsl(var(--on-surface-muted))',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Desktop: full table ── */
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
                        <MemberAvatar member={m} />
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
                      <StatusPill status={m.status} />
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
      )}

      {/* Profile card sheet (mobile) */}
      {selectedMember && (
        <ProfileCard member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}
