import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { momoService } from '@/services/momoService'

/**
 * Read-only MTN MoMo merchant details shown on the public donate page.
 * Only renders if a merchant number is configured and is_active = true.
 */
export function MomoDetails() {
  const [merchantNumber, setMerchantNumber] = useState<string>('')
  const [copiedMomo, setCopiedMomo] = useState(false)

  useEffect(() => {
    momoService
      .getMomoDetails()
      .then((d) => {
        if (d.isActive && d.merchantNumber) setMerchantNumber(d.merchantNumber)
      })
      .catch(() => setMerchantNumber(''))
  }, [])

  if (!merchantNumber) return null

  const copy = () => {
    void navigator.clipboard?.writeText(merchantNumber)
    setCopiedMomo(true)
    toast.success('MoMo number copied')
    window.setTimeout(() => setCopiedMomo(false), 1500)
  }

  return (
    <div
      style={{
        margin: '0 20px 20px',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'hsl(var(--container-low))',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <img
          src="/branding/mtn-momo-logo.png"
          alt="MTN Mobile Money"
          style={{ width: 30, height: 30, objectFit: 'contain', flex: '0 0 auto' }}
        />
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Pay via MTN MoMo
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            Send to the merchant number below. Tap to copy.
          </p>
        </div>
      </div>

      {/* Merchant number row */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Label cell */}
        <div
          className="bank-details-label-cell"
          style={{
            flex: '0 0 130px',
            padding: '10px 14px',
            borderRight: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span className="bank-details-label">Merchant No.</span>
        </div>

        {/* Value + copy */}
        <div
          style={{
            flex: 1,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            className="bank-details-value"
            style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}
          >
            {merchantNumber}
          </span>
          <button
            type="button"
            onClick={copy}
            title="Copy MoMo merchant number"
            aria-label="Copy MoMo merchant number"
            className="btn btn-ghost btn-sm"
            style={{ flex: '0 0 auto', padding: '4px 8px', gap: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {copiedMomo ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
