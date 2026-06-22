/**
 * DonationListCard Component
 * -------------------------------------------------------------
 * Displays a donation record card item in the Admin Finance Dashboard.
 * Lists the donor name, phone or country, donation amount in GHS, payment method,
 * transaction reference, status badge, and date.
 */

import type { DonationDetail } from '@/services/adminService'

/**
 * Resolves a semantic branding badge styling for a given payment method.
 * Catches Mobile Money (MoMo), bank/credit cards, and cash methods.
 */
function methodBadge(method: string): { bg: string; color: string; label: string } {
  const m = method.toLowerCase()
  if (
    m.includes('momo') ||
    m.includes('mtn') ||
    m.includes('vodafone') ||
    m.includes('airteltigo') ||
    m.includes('mobile')
  )
    return { bg: 'rgba(218,165,32,.12)', color: '#a87d10', label: `● MoMo · ${method}` }
  if (m.includes('card') || m.includes('visa') || m.includes('mastercard') || m.includes('paypal'))
    return { bg: 'rgba(0,107,63,.08)', color: 'hsl(var(--primary))', label: `● Card · ${method}` }
  if (m.includes('cash'))
    return { bg: 'rgba(206,17,38,.08)', color: 'hsl(var(--destructive))', label: `● Cash · branch` }
  return { bg: 'rgba(0,0,0,.05)', color: 'hsl(var(--on-surface-muted))', label: `● ${method}` }
}

/**
 * Maps donation statuses (Pending, Verified, Rejected) to corresponding
 * Tailwind/custom CSS pill status classnames and user-friendly labels.
 */
function statusPill(status: string): { cls: string; label: string } {
  if (status === 'Pending') return { cls: 'pill pill-warn', label: 'Pending' }
  if (status === 'Verified') return { cls: 'pill pill-ok', label: 'Cleared' }
  if (status === 'Rejected') return { cls: 'pill pill-err', label: 'Flagged' }
  return { cls: 'pill pill-mute', label: status }
}

interface Props {
  donation: DonationDetail
  isActive: boolean
  onClick: (donation: DonationDetail) => void
}

/**
 * Renders the interactive donation card summary for the finance list sidebar/panel.
 */
export default function DonationListCard({ donation, isActive, onClick }: Props) {
  const mb = methodBadge(donation.method)
  const sp = statusPill(donation.status)

  return (
    <div
      onClick={() => onClick(donation)}
      style={{
        padding: '13px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        background: isActive ? 'rgba(0,107,63,.04)' : 'hsl(var(--card))',
        boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
        cursor: 'pointer',
      }}
    >
      {/* Row 1: avatar · name · amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(0,107,63,.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--primary))',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            border: '1px solid rgba(0,107,63,.15)',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {donation.fullName.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13.5,
              color: 'hsl(var(--on-surface))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {donation.fullName}
          </p>
          <span
            style={{
              fontSize: 10.5,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {donation.phone || donation.country}
          </span>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            ₵{parseFloat(donation.amount).toLocaleString()}
          </div>
          <div style={{ marginTop: 4 }}>
            <span className={sp.cls} style={{ fontSize: 9 }}>
              {sp.label}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: method badge */}
      <div style={{ marginTop: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 3,
            background: mb.bg,
            color: mb.color,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
            fontSize: 9.5,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
          }}
        >
          {mb.label}
        </span>
      </div>

      {/* Row 3: reference · date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 7,
        }}
      >
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            letterSpacing: '.03em',
          }}
        >
          {donation.reference.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 11,
            fontVariantNumeric: 'tabular-nums',
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
          }}
        >
          {new Date(donation.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  )
}
