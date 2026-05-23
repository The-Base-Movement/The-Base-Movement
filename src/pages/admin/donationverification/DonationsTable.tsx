import type { DonationDetail } from '@/services/adminService'
import DonationListCard from '@/components/admin/DonationListCard'

type StatusFilter = 'Pending' | 'Rejected' | 'Verified' | 'Refunded'

interface DonationsTableProps {
  filteredDonations: DonationDetail[]
  selectedDonation: DonationDetail | null
  setSelectedDonation: (donation: DonationDetail) => void
  setInternalNote: (note: string) => void
  isLoading: boolean
  statusFilter: StatusFilter
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

export function DonationsTable({
  filteredDonations,
  selectedDonation,
  setSelectedDonation,
  setInternalNote,
  isLoading,
  statusFilter,
}: DonationsTableProps) {
  return (
    <div className="panel">
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 28,
              color: 'hsl(var(--on-surface-muted))',
              animation: 'spin 1s linear infinite',
            }}
          >
            sync
          </span>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, color: 'hsl(var(--border))' }}
          >
            volunteer_activism
          </span>
          <p
            style={{
              marginTop: 12,
              fontSize: 12.5,
              fontWeight: 700,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {statusFilter === 'Pending'
              ? 'No pending transactions. All current donations have been reviewed.'
              : `No ${statusFilter.toLowerCase()} transactions found.`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['', 'Donor', 'Method', 'Reference', 'Date', 'Amount', 'Status', ''].map(
                    (h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: i === 5 ? 'right' : 'left',
                          padding: '10px 14px',
                          fontSize: 9.5,
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          color: 'hsl(var(--on-surface-muted))',
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          fontFamily: "'Public Sans', sans-serif",
                          background: 'hsl(var(--container-low))',
                          borderBottom: '1px solid hsl(var(--border))',
                          width: i === 0 ? 32 : undefined,
                        }}
                      >
                        {i === 0 ? (
                          <input
                            name="select-all-donations"
                            id="input-c0b592"
                            type="checkbox"
                            aria-label="Select all donations"
                          />
                        ) : (
                          h
                        )}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((d) => {
                  const mb = methodBadge(d.method)
                  const sp = statusPill(d.status)
                  const isActive = selectedDonation?.id === d.id
                  return (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setSelectedDonation(d)
                        setInternalNote('')
                      }}
                      style={{
                        cursor: 'pointer',
                        background: isActive ? 'rgba(0,107,63,.04)' : undefined,
                        boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background =
                            'hsl(var(--container-low))'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = ''
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        <input
                          name={`select-donation-${d.id}`}
                          id={`input-select-${d.id}`}
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          aria-label={`Select donation from ${d.fullName}`}
                        />
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'rgba(0,107,63,.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'hsl(var(--primary))',
                              fontWeight: 'var(--font-weight-semibold, 600)',
                              fontSize: 11,
                              flexShrink: 0,
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {d.fullName.charAt(0)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-semibold, 600)',
                                fontSize: 12,
                                lineHeight: 1,
                              }}
                            >
                              {d.fullName}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'hsl(var(--on-surface-muted))',
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                marginTop: 2,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {d.phone || d.country}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
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
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            fontSize: 9.5,
                            letterSpacing: '.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {mb.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: 11.5,
                        }}
                      >
                        {d.reference.toUpperCase()}
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                          fontSize: 12,
                          fontVariantNumeric: 'tabular-nums',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {new Date(d.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontSize: 13.5,
                          fontVariantNumeric: 'tabular-nums',
                          textAlign: 'right',
                        }}
                      >
                        ₵{parseFloat(d.amount).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        <span className={sp.cls}>{sp.label}</span>
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 16,
                            color: 'hsl(var(--on-surface-muted))',
                            opacity: 0.4,
                          }}
                        >
                          chevron_right
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-only">
            {filteredDonations.map((d) => (
              <DonationListCard
                key={d.id}
                donation={d}
                isActive={selectedDonation?.id === d.id}
                onClick={(don) => {
                  setSelectedDonation(don)
                  setInternalNote('')
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
export default DonationsTable
