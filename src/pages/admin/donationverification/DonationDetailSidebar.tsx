import type { DonationDetail } from '@/services/adminService'

interface DonationDetailSidebarProps {
  selectedDonation: DonationDetail
  donations: DonationDetail[]
  internalNote: string
  setInternalNote: (note: string) => void
  isVerifying: string | null
  onVerify: (donationId: string, name: string, action: 'Verified' | 'Rejected') => Promise<void>
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

function getChecks(d: DonationDetail, allDonations: DonationDetail[]) {
  const hasPhone = !!(d.phone && d.phone.trim().length >= 9)
  const refValid = !!(d.reference && d.reference.trim().length >= 6)
  const priorDonations = allDonations.filter((x) => x.id !== d.id && x.phone === d.phone).length
  const isFirstFromSource = priorDonations === 0
  return [
    {
      type: hasPhone ? 'ok' : 'warn',
      label: 'Phone number on record',
      detail: d.phone || 'Missing',
    },
    { type: 'warn', label: 'Name vs wallet holder — manual review required', detail: d.fullName },
    {
      type: refValid ? 'ok' : 'warn',
      label: 'Reference code format valid',
      detail: refValid ? d.reference.toUpperCase() : 'Invalid format',
    },
    {
      type: isFirstFromSource ? 'warn' : 'ok',
      label: isFirstFromSource
        ? 'First donation from this phone'
        : 'Prior donations from this phone',
      detail: isFirstFromSource ? 'Review carefully' : `${priorDonations} previous`,
    },
    {
      type: 'warn',
      label: 'AML watchlist check — manual verification',
      detail: 'No automated watchlist available',
    },
  ]
}

export function DonationDetailSidebar({
  selectedDonation,
  donations,
  internalNote,
  setInternalNote,
  isVerifying,
  onVerify,
  onViewReceipt,
}: DonationDetailSidebarProps) {
  const mb = methodBadge(selectedDonation.method)
  const sp = statusPill(selectedDonation.status)
  const checks = getChecks(selectedDonation, donations)

  return (
    <aside
      style={{
        background: '#fff',
        border: '1px solid hsl(var(--border))',
        borderRadius: 6,
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
              fontWeight: 800,
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
                fontWeight: 800,
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
                fontWeight: 700,
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
            fontWeight: 800,
            fontSize: 38,
            letterSpacing: '-.025em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: 'hsl(var(--on-surface-muted))',
              marginRight: 4,
            }}
          >
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
              borderRadius: 3,
              background: mb.bg,
              color: mb.color,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
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
      <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            color: 'hsl(var(--on-surface-muted))',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            fontFamily: "'Public Sans', sans-serif",
            marginBottom: 10,
          }}
        >
          Automated checks
        </div>
        {checks.map((ck, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
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
            <span
              style={{
                marginLeft: 'auto',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 10.5,
              }}
            >
              {ck.detail}
            </span>
          </div>
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
          {
            dt: 'Receipt issued',
            dd: selectedDonation.receiptUrl ? 'Yes' : 'No · pending',
          },
          { dt: 'Reference', dd: selectedDonation.reference.toUpperCase() },
        ].map(({ dt, dd }) => (
          <div key={dt}>
            <dt
              style={{
                fontSize: 9.5,
                fontWeight: 800,
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
                fontWeight: 700,
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
              fontWeight: 800,
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
            fontWeight: 800,
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
            fontWeight: 700,
            border: '1px solid hsl(var(--border))',
            borderRadius: 4,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '0 20px 18px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
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
          onClick={() => onVerify(selectedDonation.id, selectedDonation.fullName, 'Rejected')}
          disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            close
          </span>
          Refund
        </button>
        <button
          className="btn btn-dest"
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
