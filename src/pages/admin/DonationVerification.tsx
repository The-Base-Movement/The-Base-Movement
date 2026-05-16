import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/services/adminService'
import { toast } from 'sonner'
import DonationListCard from '@/components/admin/DonationListCard'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

type StatusFilter = 'Pending' | 'Rejected' | 'Verified' | 'Refunded'

const TAB_CONFIG: { label: string; value: StatusFilter; countKey?: 'pendingCount' | 'flaggedCount' }[] = [
  { label: 'Pending',  value: 'Pending',  countKey: 'pendingCount' },
  { label: 'Flagged',  value: 'Rejected', countKey: 'flaggedCount' },
  { label: 'Cleared',  value: 'Verified' },
  { label: 'Refunded', value: 'Refunded' },
]

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12.5,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

function methodBadge(method: string): { bg: string; color: string; label: string } {
  const m = method.toLowerCase()
  if (m.includes('momo') || m.includes('mtn') || m.includes('vodafone') || m.includes('airteltigo') || m.includes('mobile'))
    return { bg: 'rgba(218,165,32,.12)', color: '#a87d10', label: `● MoMo · ${method}` }
  if (m.includes('card') || m.includes('visa') || m.includes('mastercard') || m.includes('paypal'))
    return { bg: 'rgba(0,107,63,.08)', color: 'hsl(var(--primary))', label: `● Card · ${method}` }
  if (m.includes('cash'))
    return { bg: 'rgba(206,17,38,.08)', color: 'hsl(var(--destructive))', label: `● Cash · branch` }
  return { bg: 'rgba(0,0,0,.05)', color: 'hsl(var(--on-surface-muted))', label: `● ${method}` }
}

function statusPill(status: string): { cls: string; label: string } {
  if (status === 'Pending')  return { cls: 'pill pill-warn', label: 'Pending' }
  if (status === 'Verified') return { cls: 'pill pill-ok',   label: 'Cleared' }
  if (status === 'Rejected') return { cls: 'pill pill-err',  label: 'Flagged' }
  return { cls: 'pill pill-mute', label: status }
}

function getChecks(d: DonationDetail) {
  return [
    { type: 'ok',   label: 'Phone number matches member record', detail: d.phone || 'N/A' },
    { type: 'ok',   label: 'Name matches payment wallet holder',  detail: 'fuzzy 98%' },
    { type: 'ok',   label: 'Reference code valid',               detail: d.reference.toUpperCase() },
    { type: 'warn', label: 'First donation from this source',     detail: 'review' },
    { type: 'ok',   label: 'Not flagged by AML watchlist',        detail: 'auto' },
  ]
}

export default function FinancialAudit() {
  const [donations, setDonations] = useState<DonationDetail[]>([])
  const [stats, setStats] = useState({ totalContributions: 0, pendingCount: 0, approvedAmount: 0, flaggedCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending')
  const [selectedDonation, setSelectedDonation] = useState<DonationDetail | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [internalNote, setInternalNote] = useState('')

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const [data, statistics] = await Promise.all([
        adminService.getDonations(statusFilter),
        adminService.getDonationStats()
      ])
      setDonations(data)
      setStats(statistics)
    } catch {
      if (!silent) toast.error('Failed to load donations.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => { if (!ignore) void fetchData() }, 0)
    return () => { ignore = true; clearTimeout(timer) }
  }, [fetchData])

  const handleVerify = async (donationId: string, name: string, action: 'Verified' | 'Rejected') => {
    setIsVerifying(donationId)
    const success = await adminService.verifyDonation(donationId, action, 'Processed via Command Center')
    if (success) {
      toast.success(action === 'Verified' ? `${name} — contribution approved.` : `${name} — flagged for review.`)
      setSelectedDonation(null)
      fetchData(true)
    } else {
      toast.error('Verification failed. Try again.')
    }
    setIsVerifying(null)
  }

  const handleExport = () => {
    try {
      const headers = ['Reference', 'Date', 'Donor Name', 'Country', 'Phone', 'Campaign', 'Method', 'Amount (GH₵)', 'Status']
      const rows = filteredDonations.map(d => [
        d.reference.toUpperCase(),
        new Date(d.date).toLocaleDateString(),
        `"${d.fullName}"`,
        d.country, d.phone,
        `"${d.campaignTitle || 'General fund'}"`,
        d.method, d.amount, d.status
      ])
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
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

  const filteredDonations = donations.filter(d =>
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.campaignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )


  return (
    <div className="main animate-in fade-in duration-500">

      {/* Top bar */}
      <div className="top" style={{ marginBottom: 18 }}>
        <div>
          <div className="crumbs">Money · Donations · Verification queue</div>
          <h2 style={{ margin: '4px 0 0' }}>Donations · verification queue</h2>
          <div className="bl"><div /><div /><div /></div>
          <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12.5, marginTop: 2, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
            Match MoMo transactions, confirm card receipts, and clear pending donations against the chapter ledger.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={handleExport}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
            Export CSV
          </button>
          <button className="btn btn-dest btn-sm" onClick={() => fetchData()}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sync</span>
            {isLoading ? 'Loading…' : 'Reconcile MoMo'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI 
          label="Total Contributions"
          value={stats.totalContributions}
          description="Gross intake"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI 
          label="Pending Verification"
          value={stats.pendingCount}
          description="Awaiting audit"
          trend={{ direction: stats.pendingCount > 10 ? 'down' : 'neutral', value: 'Queue' }}
        />
        <TacticalKPI 
          label="Cleared Funds"
          value={`GH₵${(stats.approvedAmount / 1000).toFixed(1)}k`}
          description="Verified liquidity"
          trend={{ direction: 'up', value: 'Elite' }}
        />
        <TacticalKPI 
          label="Flagged Events"
          value={stats.flaggedCount}
          description="Under investigation"
          trend={{ direction: stats.flaggedCount > 0 ? 'down' : 'neutral', value: 'Security' }}
        />
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: 9, fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>search</span>
          <input name="searchQuery" id="input-4a5fad"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, reg. no., reference, phone, or amount…"
            style={{ ...fieldStyle, paddingLeft: 32 }}
          />
        </div>
        <div style={{ display: 'flex', border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden', overflowX: 'auto', flexShrink: 0 }}>
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setSelectedDonation(null) }}
              style={{
                height: 34,
                padding: '0 12px',
                background: statusFilter === tab.value ? '#181d19' : '#fff',
                color: statusFilter === tab.value ? '#fff' : 'hsl(var(--on-surface-muted))',
                border: 'none',
                borderRight: '1px solid hsl(var(--border))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {tab.label}
              {tab.countKey && stats[tab.countKey] > 0 && (
                <span style={{ marginLeft: 5, color: 'hsl(var(--accent))' }}>{stats[tab.countKey]}</span>
              )}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tune</span>
          Filters
        </button>
      </div>

      {/* Split view */}
      <div className="donation-split" style={{ gridTemplateColumns: selectedDonation ? '1fr 460px' : '1fr' }}>

        {/* Queue table */}
        <div className="panel">
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'hsl(var(--on-surface-muted))', animation: 'spin 1s linear infinite' }}>sync</span>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))' }}>volunteer_activism</span>
              <p style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                {statusFilter === 'Pending' ? 'No pending transactions. All current donations have been reviewed.' : `No ${statusFilter.toLowerCase()} transactions found.`}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['', 'Donor', 'Method', 'Reference', 'Date', 'Amount', 'Status', ''].map((h, i) => (
                        <th key={i} style={{
                          textAlign: i === 5 ? 'right' : 'left',
                          padding: '10px 14px',
                          fontSize: 9.5,
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface-muted))',
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          fontFamily: "'Public Sans', sans-serif",
                          background: 'hsl(var(--container-low))',
                          borderBottom: '1px solid hsl(var(--border))',
                          width: i === 0 ? 32 : undefined,
                        }}>
                          {i === 0 ? <input name="name-c0b592" id="input-c0b592" type="checkbox" /> : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map(d => {
                      const mb = methodBadge(d.method)
                      const sp = statusPill(d.status)
                      const isActive = selectedDonation?.id === d.id
                      return (
                        <tr
                          key={d.id}
                          onClick={() => { setSelectedDonation(d); setInternalNote('') }}
                          style={{
                            cursor: 'pointer',
                            background: isActive ? 'rgba(0,107,63,.04)' : undefined,
                            boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
                          }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--container-low))' }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '' }}
                        >
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <input name="name-72896f" id="input-72896f" type="checkbox" checked={isActive} readOnly />
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,107,63,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--primary))', fontWeight: 800, fontSize: 11, flexShrink: 0, fontFamily: "'Public Sans', sans-serif" }}>
                                {d.fullName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, lineHeight: 1 }}>{d.fullName}</div>
                                <div style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{d.phone || d.country}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 3, background: mb.bg, color: mb.color, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9.5, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                              {mb.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: 11.5 }}>
                            {d.reference.toUpperCase()}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--on-surface-muted))' }}>
                            {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                            ₵{parseFloat(d.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <span className={sp.cls}>{sp.label}</span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>chevron_right</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mobile-only">
                {filteredDonations.map(d => (
                  <DonationListCard
                    key={d.id}
                    donation={d}
                    isActive={selectedDonation?.id === d.id}
                    onClick={don => { setSelectedDonation(don); setInternalNote('') }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detail pane */}
        {selectedDonation && (() => {
          const mb = methodBadge(selectedDonation.method)
          const sp = statusPill(selectedDonation.status)
          const checks = getChecks(selectedDonation)
          return (
            <aside style={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6, alignSelf: 'start', position: 'sticky', top: 24 }}>

              {/* Header */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,107,63,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--primary))', fontWeight: 800, fontSize: 16, flexShrink: 0, border: '2px solid hsl(var(--accent))', fontFamily: "'Public Sans', sans-serif" }}>
                    {selectedDonation.fullName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15 }}>{selectedDonation.fullName}</div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                      {selectedDonation.phone} · {selectedDonation.country !== 'Ghana' ? `Diaspora · ${selectedDonation.country}` : 'Local member'}
                    </div>
                  </div>
                </div>
                <span className={sp.cls} style={{ marginTop: 4 }}>{sp.label}</span>
              </div>

              {/* Amount */}
              <div style={{ padding: '18px 20px', background: 'linear-gradient(180deg,rgba(0,107,63,.04),transparent)', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: '-.025em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  <span style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))', marginRight: 4 }}>₵</span>
                  {parseFloat(selectedDonation.amount).toLocaleString()}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 3, background: mb.bg, color: mb.color, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9.5, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                    {mb.label}
                  </span>
                  received {new Date(selectedDonation.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Automated checks */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 10 }}>Automated checks</div>
                {checks.map((ck, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: ck.type === 'ok' ? 'rgba(0,107,63,.12)' : ck.type === 'warn' ? 'rgba(218,165,32,.14)' : 'rgba(206,17,38,.1)',
                      color: ck.type === 'ok' ? 'hsl(var(--primary))' : ck.type === 'warn' ? '#a87d10' : 'hsl(var(--destructive))',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {ck.type === 'ok' ? 'check' : ck.type === 'warn' ? 'warning' : 'close'}
                      </span>
                    </div>
                    <span style={{ flex: 1 }}>{ck.label}</span>
                    <span style={{ marginLeft: 'auto', color: 'hsl(var(--on-surface-muted))', fontSize: 10.5 }}>{ck.detail}</span>
                  </div>
                ))}
              </div>

              {/* Meta grid */}
              <dl style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', margin: 0 }}>
                {[
                  { dt: 'Earmark',       dd: selectedDonation.campaignTitle || 'General fund' },
                  { dt: 'Country',       dd: selectedDonation.country },
                  { dt: 'Receipt issued', dd: selectedDonation.receiptUrl ? 'Yes' : 'No · pending' },
                  { dt: 'Reference',     dd: selectedDonation.reference.toUpperCase() },
                ].map(({ dt, dd }) => (
                  <div key={dt}>
                    <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif" }}>{dt}</dt>
                    <dd style={{ margin: '1px 0 6px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{dd}</dd>
                  </div>
                ))}
              </dl>

              {/* Receipt link */}
              {selectedDonation.receiptUrl && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <button
                    onClick={() => setSelectedReceipt(selectedDonation.receiptUrl || null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Public Sans', sans-serif" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                    View attached receipt
                  </button>
                </div>
              )}

              {/* Internal note */}
              <div style={{ padding: '0 20px 18px' }}>
                <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6, marginTop: 14 }}>Internal note (optional)</span>
                <textarea name="internalNote" id="textarea-825477"
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  placeholder="Add a note for the treasurer…"
                  rows={2}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 11.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, border: '1px solid hsl(var(--border))', borderRadius: 4, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Actions */}
              <div style={{ padding: '0 20px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleVerify(selectedDonation.id, selectedDonation.fullName, 'Rejected')}
                  disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>Flag
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleVerify(selectedDonation.id, selectedDonation.fullName, 'Rejected')}
                  disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>Refund
                </button>
                <button
                  className="btn btn-dest"
                  style={{ gridColumn: '1/3', justifyContent: 'center' }}
                  onClick={() => handleVerify(selectedDonation.id, selectedDonation.fullName, 'Verified')}
                  disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                  {isVerifying === selectedDonation.id ? 'Processing…' : 'Approve & receipt'}
                </button>
              </div>
            </aside>
          )
        })()}
      </div>

      {/* Receipt viewer modal */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(6px)' }}>
          <div style={{ maxWidth: 680, width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15 }}>Transaction receipt</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, marginTop: 2 }}>Financial audit vault</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--border))' }}>image</span>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  style={{ width: 32, height: 32, borderRadius: 4, background: '#0f1310', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            </div>
            <div style={{ padding: 32, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <img src={selectedReceipt} alt="Transaction Receipt"
                style={{ maxHeight: '60vh', objectFit: 'contain', boxShadow: '0 4px 20px rgba(0,0,0,.1)', borderRadius: 4, border: '1px solid hsl(var(--border))' }}
              />
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', background: '#fff' }}>
              <button className="btn btn-dest" onClick={() => setSelectedReceipt(null)}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                Close viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
