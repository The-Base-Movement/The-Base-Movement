import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { type Member, adminService } from '@/services/adminService'
import { kycService, type KycStatus } from '@/services/kycService'
import { KycDocuments } from '@/components/KycDocuments'
import { toast } from 'sonner'

interface IdentityTabProps {
  member: Member
  onEdit: (m: Member) => void
  onVerify: (id: string, name: string) => void
}

export function IdentityTab({ member, onEdit, onVerify }: IdentityTabProps) {
  const [nationalId, setNationalId] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [kycStatus, setKycStatus] = useState<KycStatus>('not_uploaded')

  // Polling station state
  const [psCode, setPsCode] = useState<string | null>(null)
  const [psStatus, setPsStatus] = useState<string | null>(null)
  const [psLoaded, setPsLoaded] = useState(false)
  const [psReassigning, setPsReassigning] = useState(false)
  const [psSearch, setPsSearch] = useState('')
  const [psResults, setPsResults] = useState<
    { code: string; name: string; constituency: string }[]
  >([])
  const [psOpen, setPsOpen] = useState(false)
  const [psLoading, setPsLoading] = useState(false)
  const [psAssigning, setPsAssigning] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null)
  const psDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const psInputWrapRef = useRef<HTMLDivElement>(null)
  const psDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!member.authId) return
    adminService.getMemberVoterRegistration(member.authId).then((reg) => {
      setPsCode(reg?.polling_station_id || null)
      setPsStatus(reg?.registration_status || null)
      setPsLoaded(true)
    })
    kycService.get(member.authId).then((k) => setKycStatus(k?.status ?? 'not_uploaded'))
  }, [member.authId])

  useEffect(() => {
    if (psOpen && psInputWrapRef.current) {
      setDropdownRect(psInputWrapRef.current.getBoundingClientRect())
    }
  }, [psOpen])

  useEffect(() => {
    if (!psOpen) return
    const close = (e: Event) => {
      if (psDropdownRef.current?.contains(e.target as Node)) return
      setPsOpen(false)
    }
    window.addEventListener('scroll', close, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', close, { capture: true })
  }, [psOpen])

  const searchStations = useCallback(
    (q: string) => {
      if (psDebounce.current) clearTimeout(psDebounce.current)
      if (!q.trim()) {
        setPsResults([])
        setPsOpen(false)
        return
      }
      psDebounce.current = setTimeout(async () => {
        setPsLoading(true)
        const results = await adminService.getPollingStations(member.region, member.constituency, q)
        setPsResults(results)
        setPsOpen(results.length > 0)
        setPsLoading(false)
      }, 300)
    },
    [member.region, member.constituency]
  )

  async function handleAssign() {
    if (!selectedCode || !member.authId) return
    setPsAssigning(true)
    const ok = await adminService.setMemberPollingStation(member.authId, selectedCode)
    setPsAssigning(false)
    if (ok) {
      setPsCode(selectedCode)
      setPsStatus('VERIFIED_VOTER')
      setPsReassigning(false)
      setPsSearch('')
      setPsResults([])
      setSelectedCode('')
      setSelectedName('')
      toast.success(`Polling station ${selectedCode} assigned`)
    } else {
      toast.error('Failed to assign polling station')
    }
  }

  async function handleReveal() {
    setRevealing(true)
    try {
      const plain = await adminService.getNationalId(member.id)
      setNationalId(plain !== null ? plain : '—')
    } catch {
      setNationalId('—')
    } finally {
      setRevealing(false)
    }
  }

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
                National ID
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {nationalId !== null ? (
                  nationalId !== '—' ? (
                    <>
                      <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                        {nationalId}
                      </span>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 14,
                          color: 'hsl(var(--on-surface-muted))',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigator.clipboard.writeText(nationalId)}
                      >
                        content_copy
                      </span>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 14,
                          color: 'hsl(var(--on-surface-muted))',
                          cursor: 'pointer',
                        }}
                        onClick={() => setNationalId(null)}
                      >
                        visibility_off
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                  )
                ) : (
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ padding: '2px 10px', fontSize: 11 }}
                    onClick={handleReveal}
                    disabled={revealing}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      {revealing ? 'hourglass_empty' : 'visibility'}
                    </span>
                    {revealing ? 'Loading…' : 'Reveal'}
                  </button>
                )}
              </dd>

              {/* Polling Station */}
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
                Polling Station
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {psCode ? (
                  <>
                    <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {psCode}
                    </span>
                    <span
                      className={`pill ${psStatus === 'VERIFIED_VOTER' ? 'pill-ok' : 'pill-warn'}`}
                      style={{ fontSize: 9.5 }}
                    >
                      {psStatus === 'VERIFIED_VOTER' ? 'Verified' : 'Pending'}
                    </span>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 14,
                        color: 'hsl(var(--on-surface-muted))',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(psCode)
                        toast.success('Copied to clipboard')
                      }}
                    >
                      content_copy
                    </span>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 14,
                        color: 'hsl(var(--on-surface-muted))',
                        cursor: 'pointer',
                      }}
                      title="Reassign station"
                      onClick={() => setPsReassigning(true)}
                    >
                      edit
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                )}
              </dd>
            </dl>

            {/* Admin polling station assignment — shown when no verified station or admin clicks reassign */}
            {psLoaded && (psReassigning || !psCode || psStatus !== 'VERIFIED_VOTER') && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 14px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {psReassigning
                      ? `Reassign station (current: ${psCode ?? '—'})`
                      : 'Assign polling station'}
                  </p>
                  {psReassigning && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => {
                        setPsReassigning(false)
                        setPsSearch('')
                        setPsResults([])
                        setSelectedCode('')
                        setSelectedName('')
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div ref={psInputWrapRef} style={{ position: 'relative', marginBottom: 8 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      pointerEvents: 'none',
                    }}
                  >
                    search
                  </span>
                  <input
                    id="admin-ps-search"
                    name="admin-ps-search"
                    type="text"
                    placeholder="Search by station name or code…"
                    value={psSearch}
                    onChange={(e) => {
                      setPsSearch(e.target.value)
                      searchStations(e.target.value)
                    }}
                    onFocus={() => {
                      if (psResults.length > 0) {
                        setDropdownRect(psInputWrapRef.current?.getBoundingClientRect() ?? null)
                        setPsOpen(true)
                      }
                    }}
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px 0 30px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      background: 'hsl(var(--card))',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {psLoading && (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        right: 9,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 14,
                        color: 'hsl(var(--on-surface-muted))',
                        animation: 'spin 1s linear infinite',
                      }}
                    >
                      progress_activity
                    </span>
                  )}
                  {psOpen &&
                    psResults.length > 0 &&
                    dropdownRect &&
                    createPortal(
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                          onClick={() => setPsOpen(false)}
                        />
                        <div
                          ref={psDropdownRef}
                          style={{
                            position: 'fixed',
                            top: dropdownRect.bottom + 4,
                            left: dropdownRect.left,
                            width: dropdownRect.width,
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            zIndex: 9999,
                            maxHeight: 220,
                            overflowY: 'auto',
                          }}
                        >
                          {psResults.map((s) => (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => {
                                setSelectedCode(s.code)
                                setSelectedName(s.name)
                                setPsSearch(`${s.code} — ${s.name}`)
                                setPsOpen(false)
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                padding: '8px 12px',
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                borderBottom: '1px solid hsl(var(--border))',
                                cursor: 'pointer',
                                gap: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 11.5,
                                  color: 'hsl(var(--on-surface))',
                                }}
                              >
                                {s.code}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {s.name} · {s.constituency}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                </div>
                {selectedCode && (
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 11,
                      fontFamily: "'Public Sans', sans-serif",
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Selected:{' '}
                    <strong style={{ color: 'hsl(var(--on-surface))' }}>{selectedCode}</strong> —{' '}
                    {selectedName}
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!selectedCode || psAssigning}
                  onClick={handleAssign}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {psAssigning ? 'hourglass_empty' : 'how_to_vote'}
                  </span>
                  {psAssigning ? 'Assigning…' : 'Assign & verify'}
                </button>
              </div>
            )}
          </div>
        </div>
        {member.authId && (
          <div style={{ marginBottom: 20 }}>
            <KycDocuments userId={member.authId} showVerifyControls />
          </div>
        )}
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
              {
                ok: kycStatus === 'verified',
                label:
                  kycStatus === 'verified'
                    ? 'Ghana Card verified'
                    : kycStatus === 'not_uploaded'
                      ? 'Ghana Card not uploaded'
                      : kycStatus === 'failed'
                        ? 'Ghana Card verification failed'
                        : 'Ghana Card awaiting review',
                detail: kycStatus.replace('_', ' '),
              },
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
