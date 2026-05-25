import { Fragment } from 'react'
import { type Member, adminService } from '@/services/adminService'

interface IdentityTabProps {
  member: Member
  onEdit: (m: Member) => void
  onVerify: (id: string, name: string) => void
}

export function IdentityTab({ member, onEdit, onVerify }: IdentityTabProps) {
  return (
    <div className="panel-twocol">
      <div>
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="ph2">
            <h3>Identity</h3>
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
                ['Gender', member.gender || '—'],
                ['Region', member.region || '—'],
                ['Constituency', member.constituency || '—'],
                ['Chapter', member.chapter || '—'],
                ['Country', member.country || 'Ghana'],
                ['Joined', member.joined || '—'],
                ['Type', member.type || 'Citizen'],
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {k === 'Email' && v !== '—' ? (
                      <a
                        href={`mailto:${v}`}
                        style={{ color: 'hsl(var(--primary))', textDecoration: 'none' }}
                      >
                        {v}
                      </a>
                    ) : (
                      v
                    )}
                    {(k === 'Email' || k === 'Mobile') && v !== '—' && (
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 14,
                          color: 'hsl(var(--on-surface-muted))',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigator.clipboard.writeText(v)}
                      >
                        content_copy
                      </span>
                    )}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div>
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
        {adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
          <div className="panel">
            <div className="ph2">
              <h3>Actions</h3>
            </div>
            <div
              style={{
                padding: '18px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button className="btn btn-outline" onClick={() => onEdit(member)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  edit
                </span>
                Edit member info
              </button>
              {member.status === 'Pending' && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => onVerify(member.id, member.name)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      verified
                    </span>
                    Verify & admit
                  </button>
                  <button className="btn btn-dest">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      block
                    </span>
                    Reject application
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
