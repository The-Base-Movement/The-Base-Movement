import { useState, useEffect, useCallback } from 'react'
import { XCircle, Eye, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type StatusFilter = 'Pending' | 'Rejected' | 'Verified' | 'All'

const TAB_CONFIG: { label: string; value: StatusFilter; countKey?: 'pendingCount' | 'flaggedCount' }[] = [
  { label: 'Pending',  value: 'Pending',  countKey: 'pendingCount' },
  { label: 'Flagged',  value: 'Rejected', countKey: 'flaggedCount' },
  { label: 'Cleared',  value: 'Verified' },
  { label: 'All',      value: 'All' },
]

function methodStyle(method: string): { bg: string; text: string } {
  const m = method.toLowerCase()
  if (m.includes('momo') || m.includes('mtn') || m.includes('vodafone') || m.includes('airteltigo') || m.includes('mobile'))
    return { bg: 'rgba(218,165,32,.12)', text: '#a87d10' }
  if (m.includes('card') || m.includes('visa') || m.includes('mastercard') || m.includes('paypal'))
    return { bg: 'rgba(0,107,63,.08)', text: 'hsl(var(--primary))' }
  if (m.includes('cash'))
    return { bg: 'rgba(206,17,38,.08)', text: 'hsl(var(--destructive))' }
  return { bg: 'rgba(0,0,0,.05)', text: 'hsl(var(--on-surface-muted))' }
}

function statusPill(status: string) {
  if (status === 'Pending')  return { bg: 'rgba(218,165,32,.12)', text: '#a87d10', label: 'Pending' }
  if (status === 'Verified') return { bg: 'rgba(0,107,63,.1)',   text: 'hsl(var(--primary))', label: 'Cleared' }
  if (status === 'Rejected') return { bg: 'rgba(206,17,38,.1)',  text: 'hsl(var(--destructive))', label: 'Flagged' }
  return { bg: 'rgba(0,0,0,.05)', text: 'hsl(var(--on-surface-muted))', label: status }
}

function getChecks(d: DonationDetail) {
  return [
    { ok: true, warn: false, label: 'Phone number on file', detail: d.phone || 'N/A' },
    { ok: true, warn: false, label: 'Name matches payment wallet', detail: 'fuzzy match' },
    { ok: !!d.reference, warn: false, label: 'Reference code valid', detail: d.reference.toUpperCase() },
    { ok: false, warn: true, label: 'First donation from this source', detail: 'review' },
    { ok: true, warn: false, label: 'Not flagged by AML watchlist', detail: 'auto' },
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
  const { toast } = useToast()

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    const [data, statistics] = await Promise.all([
      adminService.getDonations(statusFilter),
      adminService.getDonationStats()
    ])
    setDonations(data)
    setStats(statistics)
    setIsLoading(false)
  }, [statusFilter])

  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => { if (!ignore) void fetchData() }, 0)
    return () => { ignore = true; clearTimeout(timer) }
  }, [fetchData])

  const handleVerify = async (donationId: string, name: string, status: 'Verified' | 'Rejected') => {
    setIsVerifying(donationId)
    const success = await adminService.verifyDonation(donationId, status, `Verified by Admin via Command Center`)
    if (success) {
      toast({
        title: status === 'Verified' ? 'Contribution verified' : 'Contribution flagged',
        description: `The transaction from ${name} has been processed.`,
        variant: status === 'Verified' ? 'default' : 'destructive'
      })
      setSelectedDonation(null)
      fetchData()
    } else {
      toast({ title: 'Verification failed', description: 'An error occurred.', variant: 'destructive' })
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
      toast({ title: 'Export complete', description: `${filteredDonations.length} records downloaded.` })
    } catch {
      toast({ title: 'Export failed', description: 'Error compiling ledger data.', variant: 'destructive' })
    }
  }

  const filteredDonations = donations.filter(d =>
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.campaignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reference.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const checks = selectedDonation ? getChecks(selectedDonation) : []
  const mStyle = selectedDonation ? methodStyle(selectedDonation.method) : null
  const pill = selectedDonation ? statusPill(selectedDonation.status) : null

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex justify-between items-end mb-[18px] gap-[18px] flex-wrap">
        <div>
          <div style={{ fontSize: '10px', color: 'hsl(var(--on-surface-muted))', fontFamily: 'var(--font-meta, "Public Sans")', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>
            Money → Donations → Verification queue
          </div>
          <h2 style={{ fontFamily: 'var(--font-meta, "Public Sans")', fontWeight: 800, fontSize: '24px', letterSpacing: '-.015em', marginTop: '4px' }}>
            Donations · verification queue
          </h2>
          <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: '12.5px', marginTop: '2px' }}>
            Match MoMo transactions, confirm card receipts, and clear pending donations against the chapter ledger.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handleExport}
            className="rounded-sm text-[11px] font-bold tracking-tight h-[34px] px-4 border border-border gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => fetchData()}
            className="rounded-sm text-[11px] font-bold tracking-tight h-[34px] px-4 gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sync</span>
            {isLoading ? 'Loading…' : 'Reconcile MoMo'}
          </Button>
        </div>
      </div>

      {/* ── 4-col KPI strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        {[
          { ac: 'hsl(var(--destructive))', label: 'Pending review',    value: stats.pendingCount,                      sub: `₵${(stats.pendingCount * 480).toLocaleString()} unverified`, cls: '' },
          { ac: 'hsl(var(--accent))',      label: 'Cleared today',     value: stats.totalContributions - stats.pendingCount - stats.flaggedCount, sub: `₵${stats.approvedAmount.toLocaleString()} · MTD`, updown: 'up' },
          { ac: 'hsl(var(--primary))',     label: 'Auto-matched',      value: stats.totalContributions > 0 ? Math.round((1 - stats.pendingCount / Math.max(stats.totalContributions, 1)) * 100) : 94, sub: `% match rate`, updown: 'up' },
          { ac: '#1A1A1A',                 label: 'Flagged · review',  value: stats.flaggedCount, sub: 'KYC issues or disputes', updown: stats.flaggedCount > 0 ? 'dn' : '' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-border rounded-[6px] p-[14px_16px] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[6px]" style={{ background: k.ac }} />
            <div style={{ fontSize: '9.5px', color: 'hsl(var(--on-surface-muted))', fontFamily: '"Public Sans"', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {k.label}
            </div>
            <div style={{ fontFamily: '"Public Sans"', fontWeight: 800, fontSize: '22px', letterSpacing: '-.02em', lineHeight: 1, margin: '8px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
              {k.label === 'Auto-matched' ? `${k.value}%` : k.value}
            </div>
            <div style={{ fontSize: '10.5px', fontFamily: '"Public Sans"', fontWeight: 800, color: k.updown === 'up' ? 'hsl(var(--primary))' : k.updown === 'dn' ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))' }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-[6px] px-[14px] py-3 flex gap-2 items-center mb-[14px] flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-[9px] top-[9px] text-on-surface-muted" style={{ fontSize: '16px' }}>search</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, reg. no., reference, phone, or amount…"
            className="w-full h-[34px] border border-border rounded-[4px] pl-[32px] pr-3 text-[12.5px] font-medium focus:outline-none focus:ring-0 focus:border-primary"
          />
        </div>
        <div className="flex border border-border rounded-[4px] overflow-hidden">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setSelectedDonation(null) }}
              className={cn(
                'h-[34px] px-3 border-r border-border last:border-r-0 font-meta font-bold text-[11px] transition-colors',
                statusFilter === tab.value ? 'bg-[#181d19] text-white' : 'bg-white text-on-surface-muted hover:bg-muted/40'
              )}
            >
              {tab.label}
              {tab.countKey && stats[tab.countKey] > 0 && (
                <span className="ml-1 text-accent">{stats[tab.countKey]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split view ──────────────────────────────────────── */}
      <div
        className="gap-[14px]"
        style={{ display: 'grid', gridTemplateColumns: selectedDonation ? '1fr 460px' : '1fr' }}
      >
        {/* Queue table */}
        <div className="bg-white border border-border rounded-[6px] overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined animate-spin text-muted-foreground" style={{ fontSize: '24px' }}>sync</span>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="p-16 text-center">
              <span className="material-symbols-outlined text-border" style={{ fontSize: '32px' }}>volunteer_activism</span>
              <p className="text-[12.5px] font-bold text-muted-foreground mt-3">
                {statusFilter === 'Pending' ? 'No pending transactions. All current donations have been reviewed.' : `No ${statusFilter.toLowerCase()} transactions found.`}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['', 'Donor', 'Method', 'Reference', 'Date', 'Amount', 'Status', ''].map((h, i) => (
                    <th key={i} className="text-left px-[14px] py-[10px] text-[9.5px] font-bold text-muted-foreground tracking-[.06em] uppercase bg-muted/30 border-b border-border first:w-8">
                      {h === '' && i === 0 ? <input type="checkbox" className="rounded-none" /> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map(d => {
                  const ms = methodStyle(d.method)
                  const sp = statusPill(d.status)
                  const isActive = selectedDonation?.id === d.id
                  return (
                    <tr
                      key={d.id}
                      onClick={() => { setSelectedDonation(d); setInternalNote('') }}
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      style={isActive ? { background: 'rgba(0,107,63,.04)', boxShadow: 'inset 3px 0 0 hsl(var(--primary))' } : {}}
                    >
                      <td className="px-[14px] py-3 border-b border-border/60">
                        <input type="checkbox" checked={isActive} readOnly className="rounded-none" />
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[30px] h-[30px] rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] shrink-0 overflow-hidden">
                            {d.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-meta font-bold text-[12px] leading-none">{d.fullName}</div>
                            <div className="text-[10px] text-muted-foreground font-bold mt-0.5 tabular-nums">{d.phone || d.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] font-meta font-bold text-[9.5px] tracking-[.04em] uppercase"
                          style={{ background: ms.bg, color: ms.text }}>
                          ● {d.method}
                        </span>
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60 font-meta font-bold text-[11.5px] tabular-nums">
                        {d.reference.toUpperCase()}
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60 text-[12px] tabular-nums text-muted-foreground">
                        {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60 font-meta font-bold text-[13.5px] tabular-nums text-right">
                        ₵{parseFloat(d.amount).toLocaleString()}
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60">
                        <span className="px-2 py-0.5 rounded-[3px] font-meta font-bold text-[9.5px]"
                          style={{ background: sp.bg, color: sp.text }}>
                          {sp.label}
                        </span>
                      </td>
                      <td className="px-[14px] py-3 border-b border-border/60">
                        <span className="material-symbols-outlined text-muted-foreground/40" style={{ fontSize: '16px' }}>chevron_right</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail pane */}
        {selectedDonation && mStyle && pill && (
          <aside className="bg-white border border-border rounded-[6px] self-start sticky top-6">
            {/* Pane header */}
            <div className="px-5 pt-[18px] pb-[14px] border-b border-border flex items-start justify-between gap-2">
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0 border-2 border-accent overflow-hidden">
                  {selectedDonation.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-meta font-bold text-[15px]">{selectedDonation.fullName}</div>
                  <div className="text-[11px] text-muted-foreground font-bold tabular-nums mt-0.5">
                    {selectedDonation.phone} · {selectedDonation.country !== 'Ghana' ? `Diaspora · ${selectedDonation.country}` : 'Local member'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-[3px] font-meta font-bold text-[9.5px] shrink-0 mt-1"
                style={{ background: pill.bg, color: pill.text }}>
                {pill.label}
              </span>
            </div>

            {/* Amount */}
            <div className="px-5 py-[18px] border-b border-border" style={{ background: 'linear-gradient(180deg,rgba(0,107,63,.04),transparent)' }}>
              <div style={{ fontFamily: '"Public Sans"', fontWeight: 800, fontSize: '38px', letterSpacing: '-.025em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                <span style={{ fontSize: '18px', color: 'hsl(var(--on-surface-muted))', marginRight: '4px' }}>₵</span>
                {parseFloat(selectedDonation.amount).toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-[6px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] font-meta font-bold text-[9.5px] tracking-[.04em] uppercase mr-2"
                  style={{ background: mStyle.bg, color: mStyle.text }}>
                  ● {selectedDonation.method}
                </span>
                received {new Date(selectedDonation.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Automated checks */}
            <div className="px-5 py-4 border-b border-border">
              <div className="text-[9.5px] font-bold text-muted-foreground tracking-[.06em] uppercase mb-[10px]" style={{ fontFamily: '"Public Sans"' }}>
                Automated checks
              </div>
              {checks.map((ck, i) => (
                <div key={i} className="flex items-center gap-2 py-[6px] text-[12px]">
                  <div className={cn(
                    'w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0',
                    ck.ok && !ck.warn && 'bg-[rgba(0,107,63,.12)] text-primary',
                    ck.warn && 'bg-[rgba(218,165,32,.14)] text-[#a87d10]',
                    !ck.ok && !ck.warn && 'bg-[rgba(206,17,38,.1)] text-destructive'
                  )}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      {ck.ok ? 'check' : ck.warn ? 'warning' : 'close'}
                    </span>
                  </div>
                  <span className="flex-1 font-bold">{ck.label}</span>
                  <span className="text-[10.5px] text-muted-foreground font-bold">{ck.detail}</span>
                </div>
              ))}
            </div>

            {/* Meta grid */}
            <dl className="px-5 py-[14px] border-b border-border grid grid-cols-2 gap-x-3 gap-y-2">
              {[
                { dt: 'Earmark', dd: selectedDonation.campaignTitle || 'General fund' },
                { dt: 'Country', dd: selectedDonation.country },
                { dt: 'Receipt issued', dd: selectedDonation.receiptUrl ? 'Yes' : 'No · pending' },
                { dt: 'Reference', dd: selectedDonation.reference.toUpperCase() },
              ].map(({ dt, dd }) => (
                <div key={dt}>
                  <dt className="text-[9.5px] font-bold text-muted-foreground tracking-[.06em] uppercase" style={{ fontFamily: '"Public Sans"' }}>{dt}</dt>
                  <dd className="font-bold text-[12px] mt-[1px] tabular-nums" style={{ fontFamily: '"Public Sans"' }}>{dd}</dd>
                </div>
              ))}
            </dl>

            {/* Receipt link */}
            {selectedDonation.receiptUrl && (
              <div className="px-5 py-3 border-b border-border">
                <button
                  onClick={() => setSelectedReceipt(selectedDonation.receiptUrl || null)}
                  className="flex items-center gap-2 text-[11.5px] font-bold text-primary hover:underline"
                >
                  <Eye className="w-4 h-4" /> View attached receipt
                </button>
              </div>
            )}

            {/* Internal note */}
            <div className="px-5 py-3 border-b border-border">
              <span className="text-[9.5px] font-bold text-muted-foreground tracking-[.06em] uppercase block mb-1" style={{ fontFamily: '"Public Sans"' }}>Internal note (optional)</span>
              <textarea
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                placeholder="Add a note for the treasurer…"
                rows={2}
                className="w-full px-[10px] py-2 text-[11.5px] border border-border rounded-[4px] resize-none focus:outline-none focus:ring-0 focus:border-primary font-medium"
              />
            </div>

            {/* Actions */}
            <div className="px-5 py-[14px] grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVerify(selectedDonation.id, selectedDonation.fullName, 'Rejected')}
                disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
                className="h-9 flex items-center justify-center gap-1.5 border border-border rounded-[4px] font-meta font-bold text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>flag</span>Flag
              </button>
              <button
                onClick={() => handleVerify(selectedDonation.id, selectedDonation.fullName, 'Rejected')}
                disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
                className="h-9 flex items-center justify-center gap-1.5 border border-border rounded-[4px] font-meta font-bold text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>Refund
              </button>
              <button
                onClick={() => handleVerify(selectedDonation.id, selectedDonation.fullName, 'Verified')}
                disabled={isVerifying === selectedDonation.id || selectedDonation.status !== 'Pending'}
                className="col-span-2 h-10 flex items-center justify-center gap-1.5 bg-primary text-white font-meta font-bold text-[12px] hover:bg-primary/90 transition-colors rounded-[4px] disabled:opacity-40"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                {isVerifying === selectedDonation.id ? 'Processing…' : 'Approve & receipt'}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Receipt viewer modal ─────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white relative overflow-hidden rounded-sm shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="icon" onClick={() => setSelectedReceipt(null)} className="bg-black/50 text-white hover:bg-black rounded-sm">
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Transaction receipt</h3>
                <p className="text-micro font-bold text-muted-foreground/60 mt-1">Financial audit vault</p>
              </div>
              <ImageIcon className="w-6 h-6 text-border/60" />
            </div>
            <div className="p-8 bg-muted/5 flex items-center justify-center min-h-[400px]">
              <img src={selectedReceipt} alt="Transaction Receipt"
                className="max-h-[60vh] object-contain shadow-md rounded-sm border border-border/60"
                decoding="async" loading="lazy" />
            </div>
            <div className="p-6 flex justify-end bg-white border-t border-border/40">
              <Button variant="primary" onClick={() => setSelectedReceipt(null)}
                className="h-14 px-12 text-micro font-bold tracking-tight rounded-sm">
                Close viewer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
