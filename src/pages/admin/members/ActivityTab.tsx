import { Fragment } from 'react'
import { type Member, type AuditLogEntry, type MemberDonation } from '@/services/adminService'

interface ActivityTabProps {
  member: Member
  logs: AuditLogEntry[]
  donations: MemberDonation[]
}

export function ActivityTab({ member, logs, donations }: ActivityTabProps) {
  const evStyle = (action: string) => {
    const a = action.toLowerCase()
    if (
      a.includes('donat') ||
      a.includes('payment') ||
      a.includes('purchase') ||
      a.includes('bought') ||
      a.includes('store')
    )
      return { bg: 'rgba(218,165,32,.12)', color: '#a87d10', icon: 'payments' }
    if (
      a.includes('login') ||
      a.includes('sign') ||
      a.includes('flag') ||
      a.includes('block') ||
      a.includes('suspend') ||
      a.includes('security') ||
      a.includes('device')
    )
      return {
        bg: 'rgba(206,17,38,.1)',
        color: 'hsl(var(--destructive))',
        icon: 'login',
      }
    if (
      a.includes('edit') ||
      a.includes('update') ||
      a.includes('chang') ||
      a.includes('modif') ||
      a.includes('photo') ||
      a.includes('bio')
    )
      return { bg: '#181d19', color: '#fff', icon: 'edit' }
    if (a.includes('vote') || a.includes('poll'))
      return { bg: '#f1f5ee', color: 'hsl(var(--primary))', icon: 'how_to_vote' }
    return { bg: '#f1f5ee', color: 'hsl(var(--primary))', icon: 'history' }
  }
  const totalGiven = donations.reduce((s, d) => s + d.amount, 0)
  const barHeights = [20, 35, 25, 40, 60, 45, 55, 70, 62, 80, 72, 95]
  return (
    <div className="panel-twocol">
      <div>
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="ph2">
            <h3>Recent activity</h3>
            <span className="meta">audit trail</span>
          </div>
          <div style={{ padding: '18px 24px' }}>
            {logs.length > 0
              ? logs.slice(0, 8).map((log, i, arr) => {
                  const s = evStyle(log.action)
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '12px 0',
                        position: 'relative',
                      }}
                    >
                      {i < arr.length - 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 13,
                            top: 36,
                            bottom: -12,
                            width: 1,
                            background: 'hsl(var(--border))',
                          }}
                        />
                      )}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: s.bg,
                          color: s.color,
                          flexShrink: 0,
                          zIndex: 1,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {s.icon}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>
                          <b
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                            }}
                          >
                            {log.action}
                          </b>
                        </p>
                        <span
                          style={{
                            fontSize: 10.5,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-normal, 400)',
                            letterSpacing: '.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {new Date(log.timestamp).toLocaleDateString()} · {log.adminName}
                        </span>
                      </div>
                    </div>
                  )
                })
              : [
                  {
                    icon: 'how_to_vote',
                    text: 'Profile created and added to directory',
                    time: member.joined || 'On join',
                  },
                  {
                    icon: 'verified',
                    text: 'Status set to ' + (member.status || 'Pending'),
                    time: 'On registration',
                  },
                  {
                    icon: 'place',
                    text: 'Region assigned: ' + (member.region || '—'),
                    time: 'Auto',
                  },
                ].map((e, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 0',
                      position: 'relative',
                    }}
                  >
                    {i < arr.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 13,
                          top: 36,
                          bottom: -12,
                          width: 1,
                          background: 'hsl(var(--border))',
                        }}
                      />
                    )}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f1f5ee',
                        color: 'hsl(var(--primary))',
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {e.icon}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{e.text}</p>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                          letterSpacing: '.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {e.time}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph2">
            <h3>Contribution history</h3>
            <span className="meta">12 months · ₵</span>
          </div>
          <div style={{ padding: '18px 24px' }}>
            <div
              style={{
                display: 'flex',
                gap: 18,
                alignItems: 'flex-end',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 30,
                  letterSpacing: '-.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    marginRight: 3,
                  }}
                >
                  ₵
                </span>
                {totalGiven > 0 ? totalGiven.toLocaleString() : '0'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  paddingBottom: 4,
                }}
              >
                lifetime · {donations.length} donations
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 3,
                alignItems: 'flex-end',
                height: 48,
              }}
            >
              {(donations.length > 0
                ? donations.slice(-12).map((d, i, arr) => ({
                    h: Math.max(
                      8,
                      Math.round((d.amount / Math.max(...arr.map((x) => x.amount))) * 100)
                    ),
                    last: i === arr.length - 1,
                  }))
                : barHeights.map((h, i) => ({ h, last: i === 11 }))
              ).map(({ h, last }, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: last ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                    borderRadius: 1,
                    opacity: last ? 1 : 0.55,
                    height: `${h}%`,
                  }}
                />
              ))}
            </div>
            {donations.length === 0 && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                No contributions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="ph2">
            <h3>Identity snapshot</h3>
            <span
              className={
                member.status === 'Active' || member.status === 'Approved'
                  ? 'pill pill-ok'
                  : 'pill pill-warn'
              }
            >
              {member.status}
            </span>
          </div>
          <div style={{ padding: '18px 24px' }}>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr',
                gap: '10px 14px',
              }}
            >
              {[
                ['Full name', member.name],
                ['Reg number', member.id.substring(0, 12).toUpperCase()],
                ['Email', member.email || '—'],
                ['Mobile', member.phone || '—'],
                ['Region', member.region || '—'],
                ['Constituency', member.constituency || '—'],
                ['Chapter', member.chapter || '—'],
                ['Joined', member.joined || '—'],
              ].map(([k, v]) => (
                <Fragment key={k}>
                  <dt
                    style={{
                      fontSize: 9.5,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      fontFamily: "'Public Sans', sans-serif",
                      alignSelf: 'center',
                    }}
                  >
                    {k}
                  </dt>
                  <dd
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                    }}
                  >
                    {v}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </div>
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="ph2">
            <h3>KYC checks</h3>
            <span className="meta">auto-run</span>
          </div>
          <div style={{ padding: '18px 24px' }}>
            {[
              {
                ok: !!member.phone,
                label: 'Phone number on file',
                detail: member.phone ? 'verified' : 'missing',
              },
              {
                ok: !!member.email,
                label: 'Email address registered',
                detail: member.email ? 'on file' : 'missing',
              },
              {
                ok: member.status === 'Active' || member.status === 'Approved',
                label: 'Account status approved',
                detail: member.status,
              },
              {
                ok: !!member.region,
                label: 'Region assigned',
                detail: member.region || 'unassigned',
              },
              { ok: false, label: 'Ghana Card not uploaded', detail: 'review' },
            ].map((c, i, arr) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: c.ok ? 'rgba(0,107,63,.12)' : 'rgba(218,165,32,.14)',
                    color: c.ok ? 'hsl(var(--primary))' : '#a87d10',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {c.ok ? 'check' : 'warning'}
                  </span>
                </div>
                <b
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    flex: 1,
                  }}
                >
                  {c.label}
                </b>
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                  }}
                >
                  {c.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="ph2">
            <h3>Admin notes</h3>
            <span className="meta">internal</span>
          </div>
          <div style={{ padding: '14px 24px' }}>
            <div
              style={{
                padding: '10px 0',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <b
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11.5,
                  }}
                >
                  System
                </b>
                <span
                  style={{
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                  }}
                >
                  {member.joined || 'On join'}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Member registered via{' '}
                {member.platform === 'DIASPORA' ? 'diaspora portal' : 'standard registration'}.
                Status: {member.status}.
              </p>
            </div>
            <div style={{ padding: '10px 0' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontStyle: 'italic',
                }}
              >
                No additional notes. Open Notes tab to add one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
