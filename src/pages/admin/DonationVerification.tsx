import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/services/adminService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

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

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12.5,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

export default function FinancialAudit() {
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
  const [selectedDonation, setSelectedDonation] = useState<DonationDetail | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [internalNote, setInternalNote] = useState('')

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

  const handleVerify = async (
    donationId: string,
    name: string,
    action: 'Verified' | 'Rejected'
  ) => {
    setIsVerifying(donationId)
    const success = await adminService.verifyDonation(
      donationId,
      action,
      'Processed via Command Center'
    )
    if (success) {
      toast.success(
        action === 'Verified' ? `${name} — contribution approved.` : `${name} — flagged for review.`
      )
      setSelectedDonation(null)
      fetchData(true)
    } else {
      toast.error('Verification failed. Try again.')
    }
    setIsVerifying(null)
  }

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

  const filteredDonations = donations.filter(
    (d) =>
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.campaignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="main">
      <AdminPageHeader
        title="Donations · verification queue"
        icon="payments"
        description="Match MoMo transactions, confirm card receipts, and clear pending donations against the chapter ledger."
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={handleExport}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                download
              </span>
              Export CSV
            </button>
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
                fontSize: 22,
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
          background: '#fff',
          border: '1px solid hsl(var(--border))',
          borderRadius: 6,
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
            placeholder="Search by name, reg. no., reference, phone, or amount…"
            style={{ ...fieldStyle, paddingLeft: 32 }}
            aria-label="Search by name, reference, or phone"
          />
        </div>
        <div
          style={{
            display: 'flex',
            border: '1px solid hsl(var(--border))',
            borderRadius: 4,
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
                background: statusFilter === tab.value ? '#181d19' : '#fff',
                color: statusFilter === tab.value ? '#fff' : 'hsl(var(--on-surface-muted))',
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
        <button className="btn btn-outline btn-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            tune
          </span>
          Filters
        </button>
      </div>

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
            donations={donations}
            internalNote={internalNote}
            setInternalNote={setInternalNote}
            isVerifying={isVerifying}
            onVerify={handleVerify}
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
