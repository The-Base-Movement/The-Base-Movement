/**
 * Donation Verification & Financial Audit Component
 * -------------------------------------------------------------
 * Audit dashboard for verifying pending manual donation submissions,
 * viewing attached receipts, and approving/flagging/refunding contributions.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { adminService } from '@/services/adminService'
import { donationService } from '@/services/donationService'
import type { DonationDetail } from '@/services/adminService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'

// Subcomponents
import { DonationsTable } from './donationverification/DonationsTable'
import { DonationDetailSidebar } from './donationverification/DonationDetailSidebar'
import { ReceiptViewerModal } from './donationverification/ReceiptViewerModal'

type StatusFilter = 'Pending' | 'Rejected' | 'Verified' | 'Refunded'

const TAB_CONFIG: {
  label: string
  value: StatusFilter
  countKey?: 'pendingCount' | 'flaggedCount'
}[] = [
  { label: 'Pending', value: 'Pending', countKey: 'pendingCount' },
  { label: 'Flagged', value: 'Rejected', countKey: 'flaggedCount' },
  { label: 'Cleared', value: 'Verified' },
  { label: 'Refunded', value: 'Refunded' },
]

const METHOD_OPTIONS = ['All', 'MoMo', 'Card', 'Cash'] as const
type MethodOption = (typeof METHOD_OPTIONS)[number]

interface FilterState {
  method: MethodOption
  amountMin: string
  amountMax: string
  dateFrom: string
  dateTo: string
  country: 'All' | 'Ghana' | 'Diaspora'
}

const DEFAULT_FILTERS: FilterState = {
  method: 'All',
  amountMin: '',
  amountMax: '',
  dateFrom: '',
  dateTo: '',
  country: 'All',
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12.5,
  outline: 'none',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

// Helper function to check if a donation matches a selected payment method option
function matchesMethod(d: DonationDetail, m: MethodOption): boolean {
  if (m === 'All') return true
  const method = d.method.toLowerCase()
  if (m === 'MoMo')
    return (
      method.includes('momo') ||
      method.includes('mtn') ||
      method.includes('vodafone') ||
      method.includes('airteltigo') ||
      method.includes('mobile')
    )
  if (m === 'Card')
    return method.includes('card') || method.includes('visa') || method.includes('mastercard')
  if (m === 'Cash') return method.includes('cash')
  return true
}

// Primary page component managing donation verification flows and state
export default function FinancialAudit() {
  const currentUser = adminService.getCurrentUser()
  const canExport =
    currentUser?.role === 'FOUNDER' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'FINANCE_OFFICER' ||
    currentUser?.role === 'NATIONAL_FINANCE_OFFICER'

  const [donations, setDonations] = useState<DonationDetail[]>([])
  const [stats, setStats] = useState({
    totalContributions: 0,
    pendingCount: 0,
    approvedAmount: 0,
    flaggedCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedDonation, setSelectedDonation] = useState<DonationDetail | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [internalNote, setInternalNote] = useState('')
  const [isBackfilling, setIsBackfilling] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  const hasActiveFilters =
    filters.method !== 'All' ||
    filters.amountMin !== '' ||
    filters.amountMax !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.country !== 'All'

  // Fetches current donations and statistics from adminService
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true)
      try {
        const [data, statistics] = await Promise.all([
          adminService.getDonations(statusFilter),
          adminService.getDonationStats(),
        ])
        setDonations(data)
        setStats(statistics)
      } catch {
        if (!silent) toast.error('Failed to load donations.')
      } finally {
        setIsLoading(false)
      }
    },
    [statusFilter]
  )

  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => {
      if (!ignore) void fetchData()
    }, 0)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [fetchData])

  // Close filter panel on outside click
  useEffect(() => {
    if (!showFilters) return
    const handler = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilters])

  // Handles verifying or rejecting a manual donation record
  const handleVerify = async (
    donationId: string,
    name: string,
    action: 'Verified' | 'Rejected'
  ) => {
    setIsVerifying(donationId)
    if (internalNote.trim()) {
      await donationService.updateVerificationNotes(donationId, internalNote)
    }
    const success = await adminService.verifyDonation(
      donationId,
      action,
      'Processed via Command Center'
    )
    if (success) {
      toast.success(
        action === 'Verified' ? `${name} — contribution approved.` : `${name} — flagged for review.`
      )
      if (action === 'Verified') {
        donationService.sendReceipt(donationId)
      }
      setSelectedDonation(null)
      fetchData(true)
    } else {
      toast.error('Verification failed. Try again.')
    }
    setIsVerifying(null)
  }

  // Updates the donation record status to refunded in the database
  const handleRefund = async (donationId: string, name: string) => {
    setIsVerifying(donationId)
    try {
      if (internalNote.trim()) {
        await donationService.updateVerificationNotes(donationId, internalNote)
      }
      await donationService.markRefunded(donationId)
      toast.success(`${name} — refund initiated.`)
      setSelectedDonation(null)
      fetchData(true)
    } catch {
      toast.error('Refund failed. Try again.')
    }
    setIsVerifying(null)
  }

  const filteredDonations = useMemo(() => {
    const list = donations.filter((d) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        d.fullName.toLowerCase().includes(q) ||
        d.campaignTitle?.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q)

      const amt = parseFloat(d.amount)
      const matchesAmount =
        (filters.amountMin === '' || amt >= parseFloat(filters.amountMin)) &&
        (filters.amountMax === '' || amt <= parseFloat(filters.amountMax))

      const donationDate = new Date(d.date)
      const matchesDate =
        (filters.dateFrom === '' || donationDate >= new Date(filters.dateFrom)) &&
        (filters.dateTo === '' || donationDate <= new Date(filters.dateTo + 'T23:59:59'))

      const matchesCountry =
        filters.country === 'All' ||
        (filters.country === 'Ghana' && d.country === 'Ghana') ||
        (filters.country === 'Diaspora' && d.country !== 'Ghana')

      return (
        matchesSearch &&
        matchesMethod(d, filters.method) &&
        matchesAmount &&
        matchesDate &&
        matchesCountry
      )
    })

    return list.sort((a, b) => {
      const nameA = a.fullName || ''
      const nameB = b.fullName || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [donations, searchQuery, filters, sortOrder])

  const handleExport = () => {
    try {
      const headers = [
        'Reference',
        'Date',
        'Donor Name',
        'Country',
        'Phone',
        'Campaign',
        'Method',
        'Amount (GH₵)',
        'Status',
      ]
      const rows = filteredDonations.map((d) => [
        d.reference.toUpperCase(),
        new Date(d.date).toLocaleDateString(),
        `"${d.fullName}"`,
        d.country,
        d.phone,
        `"${d.campaignTitle || 'General fund'}"`,
        d.method,
        d.amount,
        d.status,
      ])
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`${filteredDonations.length} records exported.`)
    } catch {
      toast.error('Export failed. Error compiling ledger data.')
    }
  }

  const handleBackfillReceipts = async (force = false) => {
    setIsBackfilling(true)
    try {
      const result = await donationService.backfillReceipts(force)
      if (result.total === 0) {
        toast.success('All verified donations already have receipts.')
      } else {
        toast.success(
          `Receipts ${force ? 'regenerated' : 'generated'}: ${result.processed} of ${result.total}${result.failed > 0 ? ` (${result.failed} failed)` : ''}`
        )
        fetchData(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backfill failed'
      toast.error(msg)
    } finally {
      setIsBackfilling(false)
    }
  }

  function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Donations · verification queue"
        icon="payments"
        description="Match MoMo transactions, confirm card receipts, and clear pending donations against the chapter ledger."
        actions={
          <>
            {statusFilter === 'Verified' && (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleBackfillReceipts(false)}
                  disabled={isBackfilling}
                  title="Generate receipts for verified donations that don't have one yet"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    receipt_long
                  </span>
                  {isBackfilling ? 'Generating…' : 'Backfill Receipts'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleBackfillReceipts(true)}
                  disabled={isBackfilling}
                  title="Regenerate receipts for ALL verified donations (overwrites existing)"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    refresh
                  </span>
                  {isBackfilling ? 'Regenerating…' : 'Force Regenerate All'}
                </button>
              </>
            )}
            {canExport && (
              <button className="btn btn-outline btn-sm" onClick={handleExport}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  download
                </span>
                Export CSV
              </button>
            )}
            <button className="btn btn-dest btn-sm" onClick={() => fetchData()}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                sync
              </span>
              {isLoading ? 'Loading…' : 'Reconcile MoMo'}
            </button>
          </>
        }
      />

      <div className="kpis" style={{ marginBottom: 18 }}>
        {[
          {
            label: 'Total donations',
            value: isLoading ? '—' : stats.totalContributions.toLocaleString(),
            icon: 'payments',
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'Pending',
            value: isLoading ? '—' : stats.pendingCount.toLocaleString(),
            icon: 'hourglass_empty',
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Cleared',
            value: isLoading ? '—' : `₵ ${stats.approvedAmount.toLocaleString()}`,
            icon: 'check_circle',
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Flagged',
            value: isLoading ? '—' : stats.flaggedCount.toLocaleString(),
            icon: 'flag',
            bar: 'hsl(var(--destructive))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
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
                background: kpi.bar,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {kpi.label}
              </p>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
              >
                {kpi.icon}
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: 9,
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            name="searchQuery"
            id="input-4a5fad"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, reference, phone…"
            style={{ ...fieldStyle, paddingLeft: 32 }}
            aria-label="Search donations"
          />
        </div>

        <div
          style={{
            display: 'flex',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value)
                setSelectedDonation(null)
              }}
              style={{
                height: 34,
                padding: '0 12px',
                background: statusFilter === tab.value ? 'hsl(var(--on-surface))' : 'transparent',
                color:
                  statusFilter === tab.value
                    ? 'hsl(var(--background))'
                    : 'hsl(var(--on-surface-muted))',
                border: 'none',
                borderRight: '1px solid hsl(var(--border))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {tab.label}
              {tab.countKey && stats[tab.countKey] > 0 && (
                <span style={{ marginLeft: 5, color: 'hsl(var(--accent))' }}>
                  {stats[tab.countKey]}
                </span>
              )}
            </button>
          ))}
        </div>

        <SortToggle value={sortOrder} onChange={setSortOrder} />

        {/* Filters button + dropdown */}
        <div style={{ position: 'relative', flexGrow: 1 }} ref={filterPanelRef}>
          <button
            className={hasActiveFilters ? 'btn btn-accent btn-sm' : 'btn btn-outline btn-sm'}
            style={{ width: '100%' }}
            onClick={() => setShowFilters((v) => !v)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              tune
            </span>
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  background: 'rgba(255,255,255,.3)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '1px 6px',
                  fontSize: 10,
                  marginLeft: 2,
                }}
              >
                on
              </span>
            )}
          </button>

          {showFilters && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setShowFilters(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  zIndex: 50,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  width: 280,
                  boxShadow: '0 4px 20px rgba(0,0,0,.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Filter options
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        color: 'hsl(var(--destructive))',
                        fontFamily: "'Public Sans', sans-serif",
                        padding: 0,
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Method */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: 'hsl(var(--on-surface-muted))',
                      marginBottom: 6,
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Payment method
                  </label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {METHOD_OPTIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setFilter('method', m)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid hsl(var(--border))',
                          background:
                            filters.method === m ? 'hsl(var(--on-surface))' : 'hsl(var(--card))',
                          color: filters.method === m ? '#fff' : 'hsl(var(--on-surface))',
                          fontSize: 11,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          cursor: 'pointer',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Origin */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: 'hsl(var(--on-surface-muted))',
                      marginBottom: 6,
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Origin
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['All', 'Ghana', 'Diaspora'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilter('country', c)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid hsl(var(--border))',
                          background:
                            filters.country === c ? 'hsl(var(--on-surface))' : 'hsl(var(--card))',
                          color: filters.country === c ? '#fff' : 'hsl(var(--on-surface))',
                          fontSize: 11,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          cursor: 'pointer',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount range */}
                <div>
                  <p
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: 'hsl(var(--on-surface-muted))',
                      marginBottom: 6,
                      fontFamily: "'Public Sans', sans-serif",
                      margin: '0 0 6px',
                    }}
                  >
                    Amount (₵)
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number"
                      id="filter-amount-min"
                      name="amountMin"
                      aria-label="Minimum amount (₵)"
                      placeholder="Min"
                      value={filters.amountMin}
                      onChange={(e) => setFilter('amountMin', e.target.value)}
                      style={{ ...fieldStyle, height: 30, fontSize: 12 }}
                    />
                    <input
                      type="number"
                      id="filter-amount-max"
                      name="amountMax"
                      aria-label="Maximum amount (₵)"
                      placeholder="Max"
                      value={filters.amountMax}
                      onChange={(e) => setFilter('amountMax', e.target.value)}
                      style={{ ...fieldStyle, height: 30, fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '0 0 6px',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Date range
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="date"
                      id="filter-date-from"
                      name="dateFrom"
                      aria-label="From date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilter('dateFrom', e.target.value)}
                      style={{ ...fieldStyle, height: 30, fontSize: 12 }}
                    />
                    <input
                      type="date"
                      id="filter-date-to"
                      name="dateTo"
                      aria-label="To date"
                      value={filters.dateTo}
                      onChange={(e) => setFilter('dateTo', e.target.value)}
                      style={{ ...fieldStyle, height: 30, fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active filter summary */}
      {hasActiveFilters && (
        <div
          style={{
            marginBottom: 10,
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}
          >
            Active filters:
          </span>
          {filters.method !== 'All' && (
            <span className="pill pill-warn" style={{ fontSize: 9 }}>
              {filters.method}
            </span>
          )}
          {filters.country !== 'All' && (
            <span className="pill pill-warn" style={{ fontSize: 9 }}>
              {filters.country}
            </span>
          )}
          {(filters.amountMin || filters.amountMax) && (
            <span className="pill pill-warn" style={{ fontSize: 9 }}>
              ₵{filters.amountMin || '0'} – ₵{filters.amountMax || '∞'}
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="pill pill-warn" style={{ fontSize: 9 }}>
              {filters.dateFrom || '…'} → {filters.dateTo || '…'}
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            — {filteredDonations.length} result{filteredDonations.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Split view */}
      <div
        className="donation-split"
        style={{ gridTemplateColumns: selectedDonation ? '1fr min(460px, 100%)' : '1fr' }}
      >
        <DonationsTable
          filteredDonations={filteredDonations}
          selectedDonation={selectedDonation}
          setSelectedDonation={setSelectedDonation}
          setInternalNote={setInternalNote}
          isLoading={isLoading}
          statusFilter={statusFilter}
        />

        {selectedDonation && (
          <DonationDetailSidebar
            selectedDonation={selectedDonation}
            internalNote={internalNote}
            setInternalNote={setInternalNote}
            isVerifying={isVerifying}
            onVerify={handleVerify}
            onRefund={handleRefund}
            onViewReceipt={setSelectedReceipt}
          />
        )}
      </div>

      <ReceiptViewerModal
        isOpen={!!selectedReceipt}
        receiptUrl={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  )
}
