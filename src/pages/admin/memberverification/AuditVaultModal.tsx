import { createPortal } from 'react-dom'
import type { PendingVerification } from '@/services/adminService'

interface AuditVaultModalProps {
  viewingVaultRecord: PendingVerification
  setViewingVaultRecord: (m: PendingVerification | null) => void
}

export function AuditVaultModal({
  viewingVaultRecord,
  setViewingVaultRecord,
}: AuditVaultModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setViewingVaultRecord(null)
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          background: '#fff',
          borderRadius: 6,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Vault header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '28px 32px',
            borderTop: '4px solid hsl(var(--destructive))',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'absolute', right: 24, top: 12, opacity: 0.06 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 96 }}>
              lock
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'rgba(255,255,255,.5)',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Secure vault record
                </span>
                <span
                  className={
                    viewingVaultRecord.status === 'Approved' ? 'pill pill-ok' : 'pill pill-err'
                  }
                  style={{ fontSize: 9 }}
                >
                  {viewingVaultRecord.status}
                </span>
              </div>
              <h2
                style={{
                  margin: '0 0 4px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 28,
                  color: '#fff',
                  letterSpacing: '-.02em',
                }}
              >
                {viewingVaultRecord.name}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11.5,
                  color: 'rgba(255,255,255,.45)',
                }}
              >
                Permanent record ID: {viewingVaultRecord.id}
              </p>
            </div>
            <button
              aria-label="Close audit vault"
              onClick={() => setViewingVaultRecord(null)}
              style={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.15)',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </div>
        </div>

        {/* Vault body */}
        <div
          className="vault-body-grid"
          style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}
        >
          {/* Left: identity + audit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid hsl(var(--border))',
                  paddingBottom: 8,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  description
                </span>{' '}
                Identity metadata
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                {[
                  ['Full name', viewingVaultRecord.name],
                  ['Platform', viewingVaultRecord.platform],
                  ['Country', viewingVaultRecord.country],
                  ['Region', viewingVaultRecord.region],
                  ['Constituency', viewingVaultRecord.constituency],
                  ['Profession', viewingVaultRecord.profession],
                  ['Education', viewingVaultRecord.educationLevel],
                  ['Gender', viewingVaultRecord.gender],
                  ['Age range', viewingVaultRecord.ageRange],
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
                      }}
                    >
                      {v || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid hsl(var(--border))',
                  paddingBottom: 8,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  history
                </span>{' '}
                Audit history
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#fff',
                    borderLeft: '3px solid hsl(var(--on-surface))',
                    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12.5,
                      }}
                    >
                      Registration submitted
                    </p>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      {viewingVaultRecord.submitted}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                    }}
                  >
                    System generated entry upon form completion.
                  </p>
                </div>
                {viewingVaultRecord.status === 'Approved' && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fff',
                      borderLeft: '3px solid hsl(var(--primary))',
                      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12.5,
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        Verification approved
                      </p>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        Just now
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      Administrator: National HQ
                    </p>
                  </div>
                )}
                {viewingVaultRecord.status === 'Rejected' && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fff',
                      borderLeft: '3px solid hsl(var(--destructive))',
                      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12.5,
                          color: 'hsl(var(--destructive))',
                        }}
                      >
                        Verification rejected
                      </p>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        Just now
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      Administrator: National HQ
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: photo + disclaimer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid hsl(var(--border))',
                  paddingBottom: 8,
                  marginBottom: 14,
                }}
              >
                Captured credentials
              </div>
              <div
                style={{
                  aspectRatio: '3/4',
                  background: 'hsl(var(--container-low))',
                  overflow: 'hidden',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {viewingVaultRecord.photoUrl ? (
                  <img
                    src={viewingVaultRecord.photoUrl}
                    alt="Vault record"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    decoding="async"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 36,
                        color: 'hsl(var(--border))',
                        display: 'block',
                        marginBottom: 8,
                      }}
                    >
                      hide_image
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      No biometric data
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                padding: '14px 16px',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
              }}
            >
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 9.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                }}
              >
                Legal disclaimer
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                This record is persistently stored in the movement's secure audit vault. Metadata
                cannot be altered after verification completion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
