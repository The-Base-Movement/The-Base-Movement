import { useState, useEffect } from 'react'
import type { DonationDetail } from '@/services/adminService'
import { adminService } from '@/services/adminService'

interface DonationDetailSidebarProps {
  selectedDonation: DonationDetail
  internalNote: string
  setInternalNote: (note: string) => void
  isVerifying: string | null
  onVerify: (donationId: string, name: string, action: 'Verified' | 'Rejected') => Promise<void>
  onRefund: (donationId: string, name: string) => Promise<void>
  onViewReceipt: (url: string) => void
}

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

function statusPill(status: string): { cls: string; label: string } {
  if (status === 'Pending') return { cls: 'pill pill-warn', label: 'Pending' }
  if (status === 'Verified') return { cls: 'pill pill-ok', label: 'Cleared' }
  if (status === 'Rejected') return { cls: 'pill pill-err', label: 'Flagged' }
  return { cls: 'pill pill-mute', label: status }
}

type CheckType = 'ok' | 'warn' | 'err'
interface Check {
  type: CheckType
  label: string
  detail: string
}

function autoChecks(d: DonationDetail, priorCount: number | null): Check[] {
  const hasPhone = !!(d.phone && d.phone.trim().length >= 9)
  const refValid = !!(d.reference && d.reference.trim().length >= 6)

  const firstDonation: Check =
    priorCount === null
      ? { type: 'warn', label: 'First donation from this phone', detail: 'Checking…' }
      : priorCount === 0
        ? { type: 'warn', label: 'First donation from this phone', detail: 'Review carefully' }
        : { type: 'ok', label: 'Prior donations from this phone', detail: `${priorCount} previous` }

  return [
    {
      type: hasPhone ? 'ok' : 'warn',
      label: 'Phone number on record',
      detail: d.phone || 'Missing',
    },
    {
      type: refValid ? 'ok' : 'warn',
      label: 'Reference code format valid',
      detail: refValid ? d.reference.toUpperCase() : 'Invalid format',
    },
    firstDonation,
  ]
}

const manualChecks: Check[] = [
  { type: 'warn', label: 'Name vs wallet holder', detail: 'Compare manually' },
  { type: 'warn', label: 'AML watchlist', detail: 'No external API — verify with officer' },
]

function CheckRow({ ck }: { ck: Check }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        fontSize: 12,
        fontFamily: "'Public Sans', sans-serif",
        fontWeight: 'var(--font-weight-normal, 400)',
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
          flexShrink: 0,
          background:
            ck.type === 'ok'
              ? 'rgba(0,107,63,.12)'
              : ck.type === 'warn'
                ? 'rgba(218,165,32,.14)'
                : 'rgba(206,17,38,.1)',
          color:
            ck.type === 'ok'
              ? 'hsl(var(--primary))'
              : ck.type === 'warn'
                ? '#a87d10'
                : 'hsl(var(--destructive))',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {ck.type === 'ok' ? 'check' : ck.type === 'warn' ? 'warning' : 'close'}
        </span>
      </div>
      <span style={{ flex: 1 }}>{ck.label}</span>
      <span style={{ marginLeft: 'auto', color: 'hsl(var(--on-surface-muted))', fontSize: 10.5 }}>
        {ck.detail}
      </span>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 'var(--font-weight-semibold, 600)' as const,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const,
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

export function DonationDetailSidebar({
  selectedDonation,
  internalNote,
  setInternalNote,
  isVerifying,
  onVerify,
  onRefund,
  onViewReceipt,
}: DonationDetailSidebarProps) {
  const [countData, setCountData] = useState<{ id: string; count: number } | null>(null)
  const selId = selectedDonation.id
  const selPhone = selectedDonation.phone
  // null means "still loading for this donation"
  const priorCount = countData?.id === selId ? countData.count : null

  useEffect(() => {
    let cancelled = false
    const fetching = selPhone
      ? adminService.getDonationCountByPhone(selPhone, selId).catch(() => 0)
      : Promise.resolve(0)
    fetching.then((count) => {
      if (!cancelled) setCountData({ id: selId, count })
    })
    return () => {
      cancelled = true
    }
  }, [selId, selPhone])

  const mb = methodBadge(selectedDonation.method)
  const sp = statusPill(selectedDonation.status)
  const automated = autoChecks(selectedDonation, priorCount)

  return (
    <aside
      style={{
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        alignSelf: 'start',
        position: 'sticky',
        top: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(0,107,63,.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--primary))',
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 16,
              flexShrink: 0,
              border: '2px solid hsl(var(--accent))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {selectedDonation.fullName.charAt(0)}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 15,
              }}
            >
              {selectedDonation.fullName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 2,
              }}
            >
              {selectedDonation.phone} ·{' '}
              {selectedDonation.country !== 'Ghana'
                ? `Diaspora · ${selectedDonation.country}`
                : 'Local member'}
            </div>
          </div>
        </div>
        <span className={sp.cls} style={{ marginTop: 4 }}>
          {sp.label}
        </span>
      </div>

      {/* Amount */}
      <div
        style={{
          padding: '18px 20px',
          background: 'linear-gradient(180deg,rgba(0,107,63,.04),transparent)',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 38,
            letterSpacing: '-.025em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))', marginRight: 4 }}>
            ₵
          </span>
          {parseFloat(selectedDonation.amount).toLocaleString()}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              background: mb.bg,
              color: mb.color,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 9.5,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            {mb.label}
          </span>
          received{' '}
          {new Date(selectedDonation.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Automated checks */}
      <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid hsl(var(--border))' }}>
        <p style={{ ...sectionLabel, marginBottom: 8 }}>Automated checks</p>
        {automated.map((ck, i) => (
          <CheckRow key={i} ck={ck} />
        ))}

        <p style={{ ...sectionLabel, marginTop: 14, marginBottom: 6, color: 'hsl(var(--accent))' }}>
          Manual review required
        </p>
        {manualChecks.map((ck, i) => (
          <CheckRow key={i} ck={ck} />
        ))}
      </div>

      {/* Meta grid */}
      <dl
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 12px',
          margin: 0,
        }}
      >
        {[
          { dt: 'Earmark', dd: selectedDonation.campaignTitle || 'General fund' },
          { dt: 'Country', dd: selectedDonation.country },
          { dt: 'Receipt issued', dd: selectedDonation.receiptUrl ? 'Yes' : 'No · pending' },
          { dt: 'Reference', dd: selectedDonation.reference.toUpperCase() },
        ].map(({ dt, dd }) => (
          <div key={dt}>
            <dt
              style={{
                fontSize: 9.5,
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'hsl(var(--on-surface-muted))',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {dt}
            </dt>
            <dd
              style={{
                margin: '1px 0 6px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {dd}
            </dd>
          </div>
        ))}
      </dl>

      {/* Receipt link */}
      {selectedDonation.receiptUrl && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <button
            onClick={() => onViewReceipt(selectedDonation.receiptUrl!)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'hsl(var(--primary))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              visibility
            </span>
            View attached receipt
          </button>
        </div>
      )}

      {/* Internal note */}
      <div style={{ padding: '0 20px 18px' }}>
        <label
          htmlFor="textarea-825477"
          style={{
            display: 'block',
            fontSize: 9.5,
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface-muted))',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            fontFamily: "'Public Sans', sans-serif",
            marginBottom: 6,
            marginTop: 14,
          }}
        >
          Internal note (optional)
        </label>
        <textarea
          name="internalNote"
          id="textarea-825477"
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Add a note for the treasurer…"
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 11.5,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--on-surface))',
          }}
        />
      </div>

      {/* Actions */}
      <div
        style={{ padding: '0 20px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
      >
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onVerify(selectedDonation.id, selectedDonation.fullName, 'Rejected')}
          disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            flag
          </span>
          Flag
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onRefund(selectedDonation.id, selectedDonation.fullName)}
          disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            close
          </span>
          Refund
        </button>
        <button
          className="btn btn-primary"
          style={{ gridColumn: '1/3', justifyContent: 'center' }}
          onClick={() => onVerify(selectedDonation.id, selectedDonation.fullName, 'Verified')}
          disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            verified
          </span>
          {isVerifying === selectedDonation.id ? 'Processing…' : 'Approve & receipt'}
        </button>
      </div>
    </aside>
  )
}
