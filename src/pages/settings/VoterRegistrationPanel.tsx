import { useState, useRef, useCallback, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { inputStyle } from './shared'

interface Props {
  region: string
  constituency: string
}

export function VoterRegistrationPanel({ region, constituency }: Props) {
  const [voterStatus, setVoterStatus] = useState<'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'>(
    'UNVERIFIED'
  )
  const [pollingStationCode, setPollingStationCode] = useState('')
  const [pollingStationName, setPollingStationName] = useState('')
  const [submittingVoter, setSubmittingVoter] = useState(false)
  const [psSearch, setPsSearch] = useState('')
  const [psResults, setPsResults] = useState<
    { code: string; name: string; constituency: string }[]
  >([])
  const [psOpen, setPsOpen] = useState(false)
  const [psLoading, setPsLoading] = useState(false)
  const psDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    adminService.getMyVoterRegistration().then((voterReg) => {
      if (voterReg) {
        setVoterStatus(voterReg.registration_status)
        setPollingStationCode(voterReg.polling_station_id || '')
      }
    })
  }, [])

  const searchStations = useCallback((q: string, reg: string, con: string) => {
    if (psDebounce.current) clearTimeout(psDebounce.current)
    if (!q.trim()) {
      setPsResults([])
      setPsOpen(false)
      return
    }
    psDebounce.current = setTimeout(async () => {
      setPsLoading(true)
      const results = await adminService.getPollingStations(reg, con, q)
      setPsResults(results)
      setPsOpen(results.length > 0)
      setPsLoading(false)
    }, 300)
  }, [])

  return (
    <div className="panel">
      <div className="ph">
        <h3>Election readiness</h3>
        <span
          className={`pill ${voterStatus === 'VERIFIED_VOTER' ? 'pill-ok' : voterStatus === 'IN_PROGRESS' ? 'pill-warn' : 'pill-mute'}`}
        >
          {voterStatus === 'VERIFIED_VOTER'
            ? 'Verified voter'
            : voterStatus === 'IN_PROGRESS'
              ? 'Under review'
              : 'Unverified'}
        </span>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 11.5,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            lineHeight: 1.55,
          }}
        >
          Submit your polling station code to help the movement track election day turnout and
          coordinate logistics in your constituency.
        </p>
        {voterStatus === 'VERIFIED_VOTER' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'hsl(var(--primary) / 0.06)',
              borderRadius: 4,
              border: '1px solid hsl(var(--primary) / 0.2)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              verified
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--primary))',
              }}
            >
              Polling station {pollingStationCode} — verified
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
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
                  name="voter-ps-search"
                  id="voter-ps-search"
                  aria-label="Search polling station by name or code"
                  type="text"
                  placeholder={
                    region ? 'Search by station name or code…' : 'Update your region first'
                  }
                  value={psSearch}
                  disabled={!region}
                  onChange={(e) => {
                    setPsSearch(e.target.value)
                    searchStations(e.target.value, region, constituency)
                  }}
                  onFocus={() => {
                    if (psResults.length > 0) setPsOpen(true)
                  }}
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
                {psLoading && (
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 15,
                      color: 'hsl(var(--on-surface-muted))',
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    progress_activity
                  </span>
                )}
              </div>
              {psOpen && psResults.length > 0 && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setPsOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      zIndex: 20,
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {psResults.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => {
                          setPollingStationCode(s.code)
                          setPollingStationName(s.name)
                          setPsSearch(`${s.code} — ${s.name}`)
                          setPsOpen(false)
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                          padding: '9px 12px',
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
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {s.name} · {s.constituency}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {pollingStationCode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
                >
                  how_to_vote
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11.5,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Selected: {pollingStationCode}
                </span>
                {pollingStationName && (
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    — {pollingStationName}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
              disabled={submittingVoter || !pollingStationCode.trim()}
              onClick={async () => {
                setSubmittingVoter(true)
                const ok = await adminService.submitVoterRegistration(pollingStationCode)
                setSubmittingVoter(false)
                if (ok) {
                  setVoterStatus('IN_PROGRESS')
                  toast.success('Polling station submitted — pending admin verification')
                } else {
                  toast.error('Failed to submit. Please try again.')
                }
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                how_to_vote
              </span>
              {submittingVoter ? 'Submitting…' : 'Submit polling station'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
