import type { DonationDetail } from '@/types/admin'

interface AuditModalProps {
  isOpen: boolean
  onClose: () => void
  publicHistory: DonationDetail[]
  contributionsCount: number
  onDownload: () => void
  onContribute: () => void
}

export function AuditModal({
  isOpen,
  onClose,
  publicHistory,
  contributionsCount,
  onDownload,
  onContribute
}: AuditModalProps) {
  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div 
        style={{ position: 'absolute', inset: 0, background: 'hsla(var(--on-surface-rgb), 0.6)', backdropFilter: 'blur(8px)' }} 
        onClick={onClose}
      ></div>
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: 896, 
        background: '#fff', 
        border: '1px solid hsl(var(--border))', 
        boxShadow: 'var(--shadow-xl)', 
        overflow: 'hidden', 
        borderRadius: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        maxHeight: '85vh' 
      }}>
        <div style={{ 
          padding: 32, 
          borderBottom: '1px solid hsl(var(--border))', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: '#fff', 
          position: 'sticky', 
          top: 0, 
          zIndex: 10 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'hsl(var(--primary))' }}>vital_signs</span>
            <h3 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em', fontSize: 20, lineHeight: 1, margin: 0 }}>Capital deployment ledger</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: 44, height: 44, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--on-surface-muted))', transition: 'all 0.2s ease'
            }}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {publicHistory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ padding: 24, fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Contributor</th>
                  <th style={{ padding: 24, fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Capital</th>
                  <th style={{ padding: 24, fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Cell</th>
                  <th style={{ padding: 24, fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Verification</th>
                </tr>
              </thead>
              <tbody>
                {publicHistory.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)' }} className="hover:bg-stone-50">
                    <td style={{ padding: 24 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0, letterSpacing: '-0.01em' }}>{item.fullName}</p>
                      <p style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 700, marginTop: 4, margin: 0 }}>{item.date}</p>
                    </td>
                    <td style={{ padding: 24 }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", margin: 0 }}>
                        {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                      </p>
                    </td>
                    <td style={{ padding: 24 }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', margin: 0 }}>{item.campaignTitle || 'Strategic Fund'}</p>
                    </td>
                    <td style={{ padding: 24, textAlign: 'right' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 2,
                        fontSize: 10, fontWeight: 900, textTransform: 'uppercase', background: 'hsla(var(--primary), 0.08)', color: 'hsl(var(--primary))'
                      }}>
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '128px 32px', textAlign: 'center', background: 'hsl(var(--container-low))' }}>
              <div style={{ 
                width: 80, height: 80, background: '#fff', border: '1px solid hsl(var(--border))', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' 
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))' }}>vital_signs</span>
              </div>
              <h4 style={{ fontSize: 20, fontWeight: 900, color: 'hsl(var(--on-surface))', marginBottom: 12, fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.01em' }}>Deployment records inactive</h4>
              <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', maxWidth: 384, margin: '0 auto 32px', fontWeight: 700, lineHeight: 1.5 }}>
                No capital deployment detected for this session. Support the movement cells to build a technically robust Ghana.
              </p>
            </div>
          )}
        </div>

        <div style={{ 
          padding: 32, 
          borderTop: '1px solid hsl(var(--border))', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: 'hsl(var(--container-low))', 
          position: 'sticky', 
          bottom: 0, 
          zIndex: 10 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--primary))', boxShadow: '0 0 8px hsl(var(--primary))' }}></span>
            {contributionsCount} Deployment records secured
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={onDownload} className="btn btn-outline" style={{ height: 48, padding: '0 24px', fontSize: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span> Download audit
            </button>
            <button onClick={onContribute} className="btn btn-primary" style={{ height: 48, padding: '0 32px', fontSize: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>favorite</span> Contribute
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
