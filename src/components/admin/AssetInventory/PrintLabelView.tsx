/**
 * PrintLabelView Component
 * -------------------------------------------------------------
 * Provides a printing overlay and layout styling to render and print
 * physical QR tags and barcode labels for assets.
 */

import type { Asset, AssetCondition } from './types'

const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

interface Props {
  asset: Asset
  onClose: () => void
}

/**
 * PrintLabelView
 * -------------------------------------------------------------
 * Overlay component controlling print styles and trigger button for browser printing.
 */
export function PrintLabelView({ asset, onClose }: Props) {
  /**
   * handlePrint
   * -------------------------------------------------------------
   * Initiates browser window printing pipeline.
   */
  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Screen overlay (hidden during print) */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'hsl(var(--background))',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            maxWidth: 360,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p
            style={{
              margin: '0 0 16px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 15,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Print Asset Label
          </p>
          <AssetLabel asset={asset} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={handlePrint}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                print
              </span>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Print target (visible only during print) */}
      <div className="print-only" style={{ display: 'none' }}>
        <AssetLabel asset={asset} />
      </div>

      <style>{`
        @media print {
          body * { display: none !important; }
          .print-only, .print-only * { display: block !important; }
          .print-only { padding: 24px; }
        }
      `}</style>
    </>
  )
}

/**
 * AssetLabel
 * -------------------------------------------------------------
 * Component representing the printable layout format of the asset label,
 * showing the QR code image, name, unique tag number, category, and condition.
 */
function AssetLabel({ asset }: { asset: Asset }) {
  return (
    <div
      style={{
        border: '2px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {asset.qr_code_url ? (
        <img
          src={asset.qr_code_url}
          alt="Asset QR"
          style={{ width: 80, height: 80, flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            background: 'hsl(var(--container-low))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))' }}
          >
            qr_code_2
          </span>
        </div>
      )}
      <div>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 18,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {asset.name}
        </p>
        <p
          style={{
            margin: '0 0 2px',
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: 'monospace',
          }}
        >
          {asset.asset_tag}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
          {asset.category_name} · {CONDITION_LABEL[asset.condition]}
        </p>
      </div>
    </div>
  )
}
