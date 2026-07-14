import { useState, useEffect } from 'react'
import { sessionStore } from '@/lib/sessionStore'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'
import SEO from '@/components/SEO'
import DonationReceiptModal from '@/components/donations/DonationReceiptModal'
import MonthlyDuesTab from '@/components/dues/MonthlyDuesTab'
import { toast } from 'sonner'
import { initiateHubtelCheckout } from '@/components/payment/hubtelCheckout'
import { HubtelPaymentModal } from '@/components/payment/HubtelPaymentModal'

function isRetryable(d: DonationDetail) {
  if (d.status !== 'Pending') return false
  const diffTime = Date.now() - new Date(d.date).getTime()
  return diffTime < 7 * 24 * 60 * 60 * 1000
}

function StatusPill({ status }: { status: string }) {
  const cls = status === 'Verified' ? 'pill-ok' : status === 'Rejected' ? 'pill-err' : 'pill-warn'
  return <span className={`pill ${cls}`}>{status}</span>
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtAmount(amount: string) {
  const n = parseFloat(amount)
  return isNaN(n) ? amount : `₵ ${n.toLocaleString()}`
}

function matchesDateFilter(dateStr: string, filter: string) {
  if (filter === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (filter === 'day') return diffDays <= 1
  if (filter === 'week') return diffDays <= 7
  if (filter === 'month') return diffDays <= 30
  if (filter === 'year') return diffDays <= 365
  return true
}

function downloadCSV(donations: DonationDetail[], name: string) {
  const headers = ['Date', 'Campaign', 'Amount', 'Method', 'Reference', 'Status']
  const rows = donations.map((d) => [
    fmt(d.date),
    d.campaignTitle || 'Strategic Fund',
    parseFloat(d.amount || '0').toFixed(2),
    d.method || '',
    d.reference,
    d.status,
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `the-base-donations-${name.replace(/\s+/g, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function MyDonations() {
  const { session } = useAuth()
  const [donations, setDonations] = useState<DonationDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [receiptViewDonationId, setReceiptViewDonationId] = useState<string | null>(null)
  const [receiptViewRef, setReceiptViewRef] = useState<string>('receipt')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [tab, setTab] = useState<'donations' | 'dues'>('donations')
  const [activeDonationId, setActiveDonationId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isRetrying, setIsRetrying] = useState<string | null>(null)

  const handleRetryPayment = async (d: DonationDetail) => {
    setIsRetrying(d.id)
    try {
      const url = await initiateHubtelCheckout({
        reference: d.id,
        amount: parseFloat(d.amount),
        currency: 'GHS',
        name: d.fullName,
        phone: d.phone,
        metadata: {
          donationId: d.id,
          memberId: d.memberId,
          campaignId: d.campaignId,
        },
      })
      setCheckoutUrl(url)
      setActiveDonationId(d.id)
      setIsPaymentModalOpen(true)
    } catch (err: unknown) {
      console.error('Failed to retry payment:', err)
      const msg =
        err instanceof Error ? err.message : 'Could not restart secure checkout. Please try again.'
      toast.error(msg)
    } finally {
      setIsRetrying(null)
    }
  }

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false)
    setCheckoutUrl(null)
    setActiveDonationId(null)
    toast.success('Payment confirmed. Thank you for supporting the movement.')

    if (session?.user) {
      setLoading(true)
      adminService.getPersonalDonationHistory(session.user.id).then((data) => {
        setDonations(data)
        setLoading(false)
      })
    }
  }
  useEffect(() => {
    if (!session?.user) return
    adminService.getPersonalDonationHistory(session.user.id).then((data) => {
      setDonations(data)
      setLoading(false)
    })
  }, [session])

  const filteredDonations = donations.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    const matchesDate = matchesDateFilter(d.date, dateFilter)
    return matchesStatus && matchesDate
  })

  const totalVerified = filteredDonations
    .filter((d) => d.status === 'Verified')
    .reduce((s, d) => s + parseFloat(d.amount || '0'), 0)
  const pendingCount = filteredDonations.filter((d) => d.status === 'Pending').length
  const verifiedCount = filteredDonations.filter((d) => d.status === 'Verified').length

  const kpis = [
    {
      label: 'Total Contributions',
      value: filteredDonations.length,
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Total Verified',
      value: `₵ ${totalVerified.toLocaleString()}`,
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Verified',
      value: verifiedCount,
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Pending',
      value: pendingCount,
      bar: 'hsl(var(--accent))',
    },
  ]

  return (
    <>
      <SEO title="My Donations" noindex />
      <div className="main">
        {/* Header */}
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 14,
          }}
        >
          <div style={{ maxWidth: 620 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                volunteer_activism
              </span>
              My Donations
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Your contribution history
            </p>
          </div>
          <div
            className="donations-actions"
            style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {filteredDonations.length > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() =>
                  downloadCSV(filteredDonations, sessionStore.getItem('userName') || 'member')
                }
                style={{ justifyContent: 'center', flex: '1 1 140px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  download
                </span>
                Export CSV
              </button>
            )}
            <Link
              to="/dashboard/donate"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none', justifyContent: 'center', flex: '1 1 140px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              New Donation
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${tab === 'donations' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
            onClick={() => setTab('donations')}
          >
            Donations
          </button>
          <button
            className={`btn btn-sm ${tab === 'dues' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
            onClick={() => setTab('dues')}
          >
            Monthly Dues
          </button>
        </div>

        {tab === 'dues' && <MonthlyDuesTab />}

        {/* KPIs */}
        {tab === 'donations' && !loading && donations.length > 0 && (
          <div className="kpis" style={{ marginBottom: 20 }}>
            {kpis.map((k) => (
              <div
                key={k.label}
                className="panel"
                style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: k.bar,
                  }}
                />
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '0 0 6px',
                  }}
                >
                  {k.label}
                </p>
                <p
                  style={{
                    fontSize: 'var(--kpi-num-size)',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filter controls */}
        {tab === 'donations' && !loading && donations.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Status:
              </span>
              <div style={{ position: 'relative' }}>
                <select
                  name="status-filter"
                  aria-label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: 34,
                    padding: '0 28px 0 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  expand_more
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Timeframe:
              </span>
              <div style={{ position: 'relative' }}>
                <select
                  name="timeframe-filter"
                  aria-label="Filter by Timeframe"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{
                    height: 34,
                    padding: '0 28px 0 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="day">Past 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  expand_more
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {tab === 'dues' ? null : loading ? (
          <div className="panel" style={{ overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: '14px 18px',
                  borderBottom: i < 3 ? '1px solid hsl(var(--border))' : 'none',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 12,
                    borderRadius: 4,
                    background: 'hsl(var(--border))',
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 12,
                    borderRadius: 4,
                    background: 'hsl(var(--border))',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    width: 60,
                    height: 12,
                    borderRadius: 4,
                    background: 'hsl(var(--border))',
                    opacity: 0.4,
                  }}
                />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 24px',
              textAlign: 'center',
              gap: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}
            >
              volunteer_activism
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No donations yet
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                maxWidth: 280,
                lineHeight: 1.6,
              }}
            >
              Your contributions to the movement will appear here once you make your first donation.
            </p>
            <Link
              to="/dashboard/donate"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8, textDecoration: 'none' }}
            >
              Make a Donation
            </Link>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 24px',
              textAlign: 'center',
              gap: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}
            >
              filter_list_off
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No matching records
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                maxWidth: 280,
                lineHeight: 1.6,
              }}
            >
              Try adjusting your status or timeframe filters to see other contributions.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all')
                setDateFilter('all')
              }}
              className="btn btn-outline btn-sm"
              style={{ marginTop: 8 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="panel" style={{ overflow: 'hidden' }}>
            {/* Desktop table */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: 'hsl(var(--container-low))',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    {['Date', 'Campaign', 'Amount', 'Method', 'Reference', 'Status', 'Receipt'].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 18px',
                            textAlign: 'left',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 9,
                            textTransform: 'uppercase',
                            color: 'hsl(var(--on-surface-muted))',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          whiteSpace: 'nowrap',
                          fontWeight: 'var(--font-weight-medium, 500)',
                        }}
                      >
                        {fmt(d.date)}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                        }}
                      >
                        {d.campaignTitle || 'Strategic Fund'}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fmtAmount(d.amount)}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                        }}
                      >
                        {d.method || '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {d.reference}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <StatusPill status={d.status} />
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {d.status === 'Verified' && d.receiptUrl ? (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setReceiptViewDonationId(d.id)
                              setReceiptViewRef(d.reference || 'receipt')
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                              receipt
                            </span>
                            View Receipt
                          </button>
                        ) : isRetryable(d) ? (
                          <button
                            className="btn btn-sm"
                            style={{
                              whiteSpace: 'nowrap',
                              background: 'hsl(var(--primary))',
                              color: '#fff',
                            }}
                            disabled={isRetrying === d.id}
                            onClick={() => handleRetryPayment(d)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                              {isRetrying === d.id ? 'hourglass_top' : 'refresh'}
                            </span>
                            {isRetrying === d.id ? 'Starting…' : 'Retry Payment'}
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {d.status === 'Verified' ? '—' : d.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mobile-only">
              {filteredDonations.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom:
                      i < filteredDonations.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {fmtAmount(d.amount)}
                    </p>
                    <StatusPill status={d.status} />
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {d.campaignTitle || 'Strategic Fund'}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    <span>{fmt(d.date)}</span>
                    <span>·</span>
                    <span>{d.method || '—'}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'monospace' }}>{d.reference}</span>
                  </div>
                  {d.status === 'Verified' && d.receiptUrl && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: 8, alignSelf: 'flex-start' }}
                      onClick={() => {
                        setReceiptViewDonationId(d.id)
                        setReceiptViewRef(d.reference || 'receipt')
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        receipt
                      </span>
                      View Receipt
                    </button>
                  )}
                  {isRetryable(d) && (
                    <button
                      className="btn btn-sm"
                      style={{
                        marginTop: 8,
                        alignSelf: 'flex-start',
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                      }}
                      disabled={isRetrying === d.id}
                      onClick={() => handleRetryPayment(d)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {isRetrying === d.id ? 'hourglass_top' : 'refresh'}
                      </span>
                      {isRetrying === d.id ? 'Starting…' : 'Retry Payment'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DonationReceiptModal
        isOpen={!!receiptViewDonationId}
        donationId={receiptViewDonationId}
        reference={receiptViewRef}
        onClose={() => setReceiptViewDonationId(null)}
      />
      <HubtelPaymentModal
        isOpen={isPaymentModalOpen}
        checkoutUrl={checkoutUrl}
        referenceId={activeDonationId}
        type="donation"
        onClose={() => {
          setIsPaymentModalOpen(false)
          setCheckoutUrl(null)
          setActiveDonationId(null)
        }}
        onSuccess={handlePaymentSuccess}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 480px) {
          .donations-actions { flex-direction: column; }
          .donations-actions .btn { flex: 1 1 100% !important; }
        }
      `,
        }}
      />
    </>
  )
}
