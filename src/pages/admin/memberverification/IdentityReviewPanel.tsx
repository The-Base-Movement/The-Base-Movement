import { statusPill } from './utils'
import type { PendingVerification } from '@/services/adminService'

interface IdentityReviewPanelProps {
  selectedMember: PendingVerification
  setShowPhotoFull: (val: boolean) => void
  aiResult: {
    confidence: number
    matches: string[]
    flagged: boolean
  } | null
  aiAnalyzing: boolean
  handleAiScan: () => Promise<void>
  handleVerdict: (approve: boolean) => Promise<void>
  setViewingVaultRecord: (m: PendingVerification) => void
}

export function IdentityReviewPanel({
  selectedMember,
  setShowPhotoFull,
  aiResult,
  aiAnalyzing,
  handleAiScan,
  handleVerdict,
  setViewingVaultRecord,
}: IdentityReviewPanelProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Dark identity header */}
      <div
        style={{
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '3px solid hsl(var(--destructive))',
            borderBottom: '3px solid hsl(var(--primary))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 160,
              height: 160,
              background: 'radial-gradient(circle,rgba(218,165,32,.12),transparent 70%)',
            }}
          />
          <div
            className="verify-identity-row"
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              position: 'relative',
            }}
          >
            {/* Photo */}
            <button
              onClick={() => selectedMember.photoUrl && setShowPhotoFull(true)}
              style={{
                width: 64,
                height: 72,
                borderRadius: 4,
                overflow: 'hidden',
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.15)',
                flexShrink: 0,
                cursor: selectedMember.photoUrl ? 'zoom-in' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedMember.photoUrl ? (
                <img
                  src={selectedMember.photoUrl}
                  alt={selectedMember.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  decoding="async"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              ) : (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, color: 'rgba(255,255,255,.25)' }}
                >
                  person
                </span>
              )}
            </button>
            {/* Identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'hsl(var(--accent))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Reviewing · {selectedMember.id}
              </div>
              <h3
                style={{
                  margin: '5px 0 6px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 20,
                  color: '#fff',
                  letterSpacing: '-.01em',
                  lineHeight: 1.1,
                }}
              >
                {selectedMember.name}
              </h3>
              <span className={statusPill(selectedMember.status)} style={{ fontSize: 10 }}>
                {selectedMember.status}
              </span>
            </div>
          </div>
        </div>

        {/* Field grid */}
        <div style={{ background: 'hsl(var(--card))', padding: '18px 22px' }}>
          <dl
            className="verify-field-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}
          >
            {[
              ['Platform', selectedMember.platform],
              ['Country', selectedMember.country],
              ['Gender', selectedMember.gender],
              ['Age range', selectedMember.ageRange],
              ['Region', selectedMember.region],
              ['Constituency', selectedMember.constituency],
              ['Profession', selectedMember.profession],
              ['Education', selectedMember.educationLevel],
              ['Phone', selectedMember.phone],
              ['Submitted', selectedMember.submitted],
            ].map(([k, v]) => (
              <div key={k}>
                <dt
                  style={{
                    fontSize: 9.5,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    fontFamily: "'Public Sans', sans-serif",
                    marginBottom: 2,
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
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {v || '—'}
                </dd>
              </div>
            ))}
          </dl>

          {/* Emergency contact */}
          {(selectedMember.emergencyName || selectedMember.emergencyPhone) && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: '1px solid hsl(var(--border))',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  fontFamily: "'Public Sans', sans-serif",
                  marginBottom: 8,
                }}
              >
                Emergency contact
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 18px' }}>
                {[
                  ['Name', selectedMember.emergencyName],
                  ['Relation', selectedMember.emergencyRelationship],
                  ['Phone', selectedMember.emergencyPhone],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt
                      style={{
                        fontSize: 9.5,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        fontFamily: "'Public Sans', sans-serif",
                        marginBottom: 2,
                      }}
                    >
                      {k}
                    </dt>
                    <dd
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      {v || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Verification checklist */}
      <div className="panel">
        <div className="ph2">
          <h3 style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>Verification steps</h3>
          <span className="meta">auto-check</span>
        </div>
        <div style={{ padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Form submitted', done: true, required: true },
            { label: 'Photo uploaded', done: !!selectedMember.photoUrl, required: true },
            ...(selectedMember.platform === 'GHANA'
              ? [
                  {
                    label: `Constituency verified (${selectedMember.constituency || 'Not set'})`,
                    done: !!selectedMember.constituency,
                    required: true,
                  },
                ]
              : [
                  {
                    label: `Chapter assignment (${selectedMember.chapter || 'Not set'})`,
                    done: !!selectedMember.chapter,
                    required: false,
                  },
                ]),
          ].map(({ label, done, required }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                background: done ? 'rgba(0,107,63,.05)' : 'hsl(var(--container-low))',
                border: `1px solid ${done ? 'rgba(0,107,63,.18)' : 'hsl(var(--border))'}`,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done ? 'rgba(0,107,63,.12)' : 'rgba(0,0,0,.04)',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 13,
                    color: done ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  {done ? 'check' : 'radio_button_unchecked'}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: done ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {label}
              </span>
              {!required && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Optional
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Security assistant */}
      <div className="panel">
        <div className="ph2">
          <h3 style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>Security assistant</h3>
          {aiResult && (
            <span
              style={{
                padding: '2px 9px',
                borderRadius: 99,
                fontSize: 10,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                background: aiResult.flagged ? 'rgba(206,17,38,.1)' : 'rgba(0,107,63,.1)',
                color: aiResult.flagged ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                border: `1px solid ${aiResult.flagged ? 'rgba(206,17,38,.2)' : 'rgba(0,107,63,.2)'}`,
              }}
            >
              {aiResult.confidence}% match
            </span>
          )}
        </div>
        <div style={{ padding: '14px 22px' }}>
          {!aiResult && !aiAnalyzing && (
            <button
              className="btn btn-sm"
              onClick={handleAiScan}
              style={{
                width: '100%',
                justifyContent: 'center',
                background: 'hsl(var(--accent))',
                color: 'hsl(var(--on-surface))',
                fontWeight: 'var(--font-weight-medium, 500)',
                height: 40,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                memory
              </span>
              Execute identity scan
            </button>
          )}
          {aiAnalyzing && (
            <div style={{ padding: '18px 0', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 28,
                  color: 'hsl(var(--accent))',
                  display: 'block',
                  marginBottom: 8,
                  animation: 'spin 1.5s linear infinite',
                }}
              >
                fingerprint
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                }}
              >
                Analyzing identity…
              </p>
            </div>
          )}
          {aiResult && (
            <div
              style={{
                padding: '12px 14px',
                background: aiResult.flagged ? 'rgba(206,17,38,.06)' : 'rgba(0,107,63,.06)',
                border: `1px solid ${aiResult.flagged ? 'rgba(206,17,38,.18)' : 'rgba(0,107,63,.18)'}`,
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {aiResult.matches.map((m) => (
                  <span
                    key={m}
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,.05)',
                      borderRadius: 99,
                      fontSize: 10.5,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontStyle: 'italic',
                }}
              >
                Neural scan of official records completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(selectedMember.status === 'In Review' ||
        selectedMember.status === 'Processing' ||
        selectedMember.status === 'Flagged') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            className="btn btn-dest"
            style={{ justifyContent: 'center', height: 44 }}
            onClick={() => handleVerdict(false)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              cancel
            </span>
            Reject
          </button>
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', height: 44 }}
            onClick={() => handleVerdict(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              verified_user
            </span>
            Approve
          </button>
        </div>
      )}

      {selectedMember.status === 'Approved' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(0,107,63,.07)',
            border: '1px solid rgba(0,107,63,.2)',
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
          >
            verified_user
          </span>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12.5,
              color: 'hsl(var(--primary))',
            }}
          >
            Member approved and admitted.
          </span>
        </div>
      )}

      {selectedMember.status === 'Rejected' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(206,17,38,.07)',
            border: '1px solid rgba(206,17,38,.2)',
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}
          >
            cancel
          </span>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12.5,
              color: 'hsl(var(--destructive))',
            }}
          >
            Registration rejected.
          </span>
        </div>
      )}

      {/* Biometric + audit vault links */}
      {selectedMember.photoUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
            onClick={() => setShowPhotoFull(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              photo_camera
            </span>
            Inspect biometric data
          </button>
          {(selectedMember.status === 'Approved' || selectedMember.status === 'Rejected') && (
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'center' }}
              onClick={() => setViewingVaultRecord(selectedMember)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                database
              </span>
              Open audit vault
            </button>
          )}
        </div>
      )}
    </div>
  )
}
