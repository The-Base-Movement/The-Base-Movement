import type { DonationDetail } from '@/types/admin'

interface AuditModalProps {
  isOpen: boolean
  onClose: () => void
  publicHistory: DonationDetail[]
  contributionsCount: number
  onDownload: () => void
  onContribute: () => void
  isLoggedIn?: boolean
}

function maskName(fullName: string): string {
  if (!fullName || fullName.toLowerCase() === 'anonymous patriot') return 'Anonymous'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function AuditModal({
  isOpen,
  onClose,
  publicHistory,
  contributionsCount,
  onDownload,
  onContribute,
  isLoggedIn = false,
}: AuditModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 860,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--card))',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
            >
              vital_signs
            </span>
            <div>
              <h3
                style={{
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                  letterSpacing: '-0.02em',
                  fontSize: 15,
                  margin: 0,
                }}
              >
                Capital deployment ledger
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                Verified contributions · {contributionsCount} records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {publicHistory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'hsl(var(--container-low))',
                    borderBottom: '1px solid hsl(var(--border))',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  {['Contributor', 'Campaign', 'Amount', 'Status'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 16px',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textAlign: i === 2 || i === 3 ? 'right' : 'left',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {publicHistory.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                        }}
                      >
                        {maskName(item.fullName)}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 500,
                          margin: '2px 0 0',
                        }}
                      >
                        {item.date}
                      </p>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.campaignTitle || 'Strategic Fund'}
                      </p>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                          margin: 0,
                        }}
                      >
                        {item.amount.includes('₵')
                          ? item.amount
                          : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                      </p>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 9px',
                          borderRadius: 3,
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          background: 'hsla(var(--primary), 0.08)',
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: 'hsl(var(--primary))',
                            display: 'block',
                          }}
                        />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '64px 32px', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 40,
                  color: 'hsl(var(--border))',
                  display: 'block',
                  marginBottom: 16,
                }}
              >
                vital_signs
              </span>
              <h4
                style={{
                  fontSize: 16,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  marginBottom: 8,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                No records yet
              </h4>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontWeight: 500,
                  maxWidth: 320,
                  margin: '0 auto',
                }}
              >
                Verified contributions will appear here as members mobilise.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--container-low))',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {contributionsCount} verified deployment records
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={onDownload}
              className="btn btn-outline btn-sm"
              disabled={!isLoggedIn}
              title={!isLoggedIn ? 'Log in to download ledger' : undefined}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                download
              </span>
              Download
            </button>
            <button onClick={onContribute} className="btn btn-primary btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                favorite
              </span>
              Contribute
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
