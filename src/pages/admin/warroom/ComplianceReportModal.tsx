import { createPortal } from 'react-dom'

interface ComplianceReportModalProps {
  reportData: string | null
  onClose: () => void
}

export function ComplianceReportModal({ reportData, onClose }: ComplianceReportModalProps) {
  if (!reportData) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          borderRadius: 8,
          width: '100%',
          maxWidth: 896,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div>
            <h3
              style={{
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 18,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              National Compliance Report
            </h3>
            <p
              style={{
                fontSize: 12,
                fontWeight: 'var(--font-weight-normal, 400)',
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'hsl(var(--on-surface-muted))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', fontFamily: 'monospace', fontSize: 14 }}>
          <pre
            style={{
              background: 'rgba(0,0,0,0.05)',
              padding: 16,
              borderRadius: 4,
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#047857',
              lineHeight: 1.75,
              overflowX: 'auto',
              margin: 0,
            }}
          >
            {JSON.stringify(JSON.parse(reportData), null, 2)}
          </pre>
        </div>
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <button
            className="btn btn-outline"
            onClick={() => {
              const blob = new Blob([reportData], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.json`
              a.click()
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              download
            </span>{' '}
            Download JSON
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Acknowledge
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
