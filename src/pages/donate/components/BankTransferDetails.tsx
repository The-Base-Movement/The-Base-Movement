import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { bankDetailsService, type BankTransferDetails } from '@/services/bankDetailsService'

const ROW_LABELS: { key: keyof Omit<BankTransferDetails, 'updatedAt'>; label: string }[] = [
  { key: 'bankName', label: 'Bank Name' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'swiftCode', label: 'Swift Code' },
  { key: 'branch', label: 'Branch' },
  { key: 'address', label: 'Address' },
]

/**
 * Read-only bank-transfer details for the public donate page, with a per-line
 * copy button so donors can grab each value without manual highlighting.
 */
export function BankTransferDetails() {
  const [details, setDetails] = useState<BankTransferDetails | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    bankDetailsService
      .getBankDetails()
      .then(setDetails)
      .catch(() => setDetails(null))
  }, [])

  const rows = ROW_LABELS.map((r) => ({ ...r, value: details?.[r.key] ?? '' })).filter(
    (r) => r.value
  )

  // Nothing configured yet — don't render an empty block.
  if (!details || rows.length === 0) return null

  const copy = (key: string, value: string) => {
    void navigator.clipboard?.writeText(value)
    setCopiedKey(key)
    toast.success('Copied')
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500)
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
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
        >
          account_balance
        </span>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Prefer a bank transfer?
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            Send your contribution to the account below. Tap any line to copy it.
          </p>
        </div>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row, i) => (
          <div
            key={row.key}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
            }}
          >
            {/* Label cell — distinct background */}
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
              <span className="bank-details-label">{row.label}</span>
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
              <span className="bank-details-value">{row.value}</span>
              <button
                type="button"
                onClick={() => copy(row.key, row.value)}
                title={`Copy ${row.label}`}
                aria-label={`Copy ${row.label}`}
                className="btn btn-ghost btn-sm"
                style={{ flex: '0 0 auto', padding: '4px 8px', gap: 4 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {copiedKey === row.key ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
