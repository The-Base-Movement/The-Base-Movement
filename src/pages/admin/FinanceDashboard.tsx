import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SortToggle } from '@/components/ui/SortToggle'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import MonthlyDuesPanel from '@/components/admin/finance/MonthlyDuesPanel'
import { PanelHeaderBar } from '@/components/admin/finance/PanelHeaderBar'
import type { DonationCampaign } from '@/types/admin'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  financeAnalyticsService,
  type SummaryStats,
  type CashflowBucket,
  type ExpenseCategory,
  type TransactionRow,
  type FinancePeriod,
} from '@/services/financeAnalyticsService'

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#64748b',
]

const PERIODS: { label: string; value: FinancePeriod }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
]

function fmt(n: number) {
  return `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinanceDashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [statsError, setStatsError] = useState(false)
  const [cashflow, setCashflow] = useState<CashflowBucket[]>([])
  const [breakdown, setBreakdown] = useState<ExpenseCategory[]>([])
  const [donationCampaignBreakdown, setDonationCampaignBreakdown] = useState<ExpenseCategory[]>([])
  const [donationCountryBreakdown, setDonationCountryBreakdown] = useState<ExpenseCategory[]>([])
  const [breakdownTab, setBreakdownTab] = useState<
    'expense' | 'income_campaign' | 'income_country'
  >('expense')
  const [cashflowTab, setCashflowTab] = useState<'combined' | 'income' | 'expense'>('combined')
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'asc' | 'desc'>('date_desc')
  const [period, setPeriod] = useState<FinancePeriod>('month')
  const [pageTab, setPageTab] = useState<'overview' | 'donations' | 'dues' | 'expenses'>('overview')
  const [chartsLoading, setChartsLoading] = useState(true)
  const [chapter, setChapter] = useState<string | null>(null)
  const [chapters, setChapters] = useState<string[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const isMobile = useIsMobile()

  const filteredTransactions = useMemo(() => {
    let list = [...transactions]
    if (typeFilter !== 'all') {
      list = list.filter((tx) => tx.kind === typeFilter)
    }
    if (statusFilter !== 'all') {
      list = list.filter((tx) => {
        const status = tx.status?.toLowerCase() || ''
        if (statusFilter === 'approved') {
          return status === 'verified' || status === 'approved'
        }
        return status === statusFilter
      })
    }
    return list
  }, [transactions, typeFilter, statusFilter])

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortOrder === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      const descA = a.description || ''
      const descB = b.description || ''
      return sortOrder === 'asc' ? descA.localeCompare(descB) : descB.localeCompare(descA)
    })
  }, [filteredTransactions, sortOrder])

  const currentBreakdownData = useMemo(() => {
    if (breakdownTab === 'income_campaign') return donationCampaignBreakdown
    if (breakdownTab === 'income_country') return donationCountryBreakdown
    return breakdown
  }, [breakdownTab, breakdown, donationCampaignBreakdown, donationCountryBreakdown])

  useEffect(() => {
    Promise.resolve().then(() => {
      setStats(null)
      setStatsError(false)
    })
    financeAnalyticsService
      .getSummaryStats(chapter ?? undefined)
      .then(setStats)
      .catch(() => setStatsError(true))
    financeAnalyticsService
      .getRecentTransactions(50, chapter ?? undefined)
      .then(setTransactions)
      .catch(() => {
        /* silent — table shows empty state */
      })
  }, [chapter])

  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (!cancelled) setChartsLoading(true)
        return Promise.all([
          financeAnalyticsService.getCashflowData(period, chapter ?? undefined),
          financeAnalyticsService.getExpenseBreakdown(period, chapter ?? undefined),
          financeAnalyticsService.getIncomeBreakdown(period, chapter ?? undefined, 'campaign'),
          financeAnalyticsService.getIncomeBreakdown(period, chapter ?? undefined, 'country'),
        ])
      })
      .then(([cf, bd, dc, dcnt]) => {
        if (!cancelled) {
          setCashflow(cf)
          setBreakdown(bd)
          setDonationCampaignBreakdown(dc)
          setDonationCountryBreakdown(dcnt)
          setChartsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setChartsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period, chapter])

  useEffect(() => {
    financeAnalyticsService
      .getChapters()
      .then(setChapters)
      .catch(() => {
        /* silent — dropdown just won't show */
      })
    adminService
      .getDonationCampaigns()
      .then(setCampaigns)
      .catch(() => {})
  }, [])

  return (
    <div className="main">
      <AdminPageHeader title="Finance Dashboard" description="Platform-wide financial overview" />

      {/* ── Page tabs ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(
          [
            { key: 'overview', label: 'Overview' },
            { key: 'donations', label: 'Donations' },
            { key: 'dues', label: 'Monthly Dues' },
            { key: 'expenses', label: 'Expenses' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${pageTab === t.key ? 'btn-active-tab' : 'btn-inactive-tab'}`}
            onClick={() => {
              setPageTab(t.key)
              if (t.key === 'donations') setTypeFilter('income')
              else if (t.key === 'expenses') setTypeFilter('expense')
              else setTypeFilter('all')
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pageTab === 'dues' && <MonthlyDuesPanel />}

      {pageTab !== 'dues' && (
        <>
          {/* ── Chapter filter ── */}
          {chapters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <label
                htmlFor="dash-chapter-filter"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Chapter:
              </label>
              <select
                id="dash-chapter-filter"
                name="dash-chapter-filter"
                value={chapter ?? ''}
                onChange={(e) => setChapter(e.target.value || null)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--background))',
                  fontFamily: "'Public Sans', sans-serif",
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">All Diaspora Communities</option>
                {chapters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {chapter && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setChapter(null)}
                  style={{ fontSize: 12 }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {chapter && (
            <div
              style={{
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginBottom: 16,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}
              >
                info
              </span>
              Figures show only donations explicitly assigned to{' '}
              <strong style={{ color: 'hsl(var(--on-surface))' }}>{chapter}</strong>. Historical
              donations without a chapter assignment are excluded.
            </div>
          )}

          {/* ── KPI Row ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1.5fr 1fr 1fr 1fr',
              gap: 14,
              marginBottom: 24,
            }}
          >
            {/* Hero card */}
            <div
              className="panel"
              style={{
                background: '#0f1310',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 120,
                gridColumn: isMobile ? '1 / -1' : undefined,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.75)',
                    margin: '0 0 8px',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  The Base Movement
                </p>
                <p
                  style={{
                    fontSize: 'var(--kpi-num-size)',
                    fontWeight: 500,
                    color: '#ffffff',
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {statsError ? (
                    <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', margin: 0 }}>
                      Failed to load
                    </p>
                  ) : stats ? (
                    fmt(stats.netBalance)
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.65)',
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Net Balance
              </p>
            </div>

            {/* KPI: Total Income */}
            <div
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
                  background: 'hsl(var(--primary))',
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 6px',
                }}
              >
                Total Donations
              </p>
              <p
                style={{
                  fontSize: 'var(--kpi-num-size)',
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {stats ? fmt(stats.totalIncome) : '—'}
              </p>
            </div>

            {/* KPI: Total Expenses */}
            <div
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
                  background: 'hsl(var(--destructive))',
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 6px',
                }}
              >
                Total Expenses
              </p>
              <p
                style={{
                  fontSize: 'var(--kpi-num-size)',
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {stats ? fmt(stats.totalExpenses) : '—'}
              </p>
            </div>

            {/* KPI: Net Balance */}
            <div
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
                  background: 'hsl(var(--accent))',
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 6px',
                }}
              >
                Net Balance
              </p>
              <p
                style={{
                  fontSize: 'var(--kpi-num-size)',
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {stats ? fmt(stats.netBalance) : '—'}
              </p>
            </div>
          </div>

          {/* ── Period filter ── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={
                  period === p.value ? 'btn btn-sm btn-active-tab' : 'btn btn-sm btn-inactive-tab'
                }
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Charts row ── */}
          <div className="sidebar-main" style={{ marginBottom: 24 }}>
            {/* Expense breakdown donut — sidebar (left) */}
            <div className="panel" style={{ padding: 20, overflow: 'hidden' }}>
              <PanelHeaderBar
                title={breakdownTab === 'expense' ? 'Expense Breakdown' : 'Donations Breakdown'}
                subtitle={
                  breakdownTab === 'expense'
                    ? 'By category'
                    : breakdownTab === 'income_campaign'
                      ? 'By campaign'
                      : 'By country'
                }
              />
              <div className="ph" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className={`btn btn-sm ${breakdownTab === 'expense' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setBreakdownTab('expense')}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Expenses
                  </button>
                  <button
                    className={`btn btn-sm ${breakdownTab === 'income_campaign' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setBreakdownTab('income_campaign')}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Campaigns
                  </button>
                  <button
                    className={`btn btn-sm ${breakdownTab === 'income_country' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setBreakdownTab('income_country')}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Countries
                  </button>
                </div>
              </div>

              {chartsLoading ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 13,
                  }}
                >
                  Loading…
                </div>
              ) : currentBreakdownData.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 13,
                  }}
                >
                  {breakdownTab === 'expense'
                    ? 'No expense data for this period'
                    : 'No donation data for this period'}
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={currentBreakdownData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                      >
                        {currentBreakdownData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => fmt(Number(val))} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: 12 }}>
                    {currentBreakdownData.map((item, i) => (
                      <div
                        key={item.category}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '5px 0',
                          fontSize: 12,
                          borderBottom:
                            i < currentBreakdownData.length - 1
                              ? '1px solid hsl(var(--border))'
                              : 'none',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: DONUT_COLORS[i % DONUT_COLORS.length],
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: 'hsl(var(--on-surface))' }}>{item.category}</span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 10,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          <span>{fmt(item.amount)}</span>
                          <span style={{ minWidth: 32, textAlign: 'right' }}>{item.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Cashflow bar chart — main (right) */}
            <div className="panel" style={{ padding: 20, overflow: 'hidden' }}>
              <PanelHeaderBar
                title="Cashflow"
                subtitle={
                  cashflowTab === 'combined'
                    ? 'Donations vs Expenses'
                    : cashflowTab === 'income'
                      ? 'Donations trend'
                      : 'Expenditures / Expenses trend'
                }
              />
              <div className="ph" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                {/* Cashflow toggles & legends */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      flexWrap: 'wrap',
                    }}
                  >
                    {(cashflowTab === 'combined' || cashflowTab === 'income') && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 'var(--radius-xs)',
                            background: 'hsl(var(--primary))',
                            display: 'inline-block',
                          }}
                        />
                        Donations
                      </span>
                    )}
                    {(cashflowTab === 'combined' || cashflowTab === 'expense') && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 'var(--radius-xs)',
                            background: 'hsl(var(--destructive))',
                            display: 'inline-block',
                          }}
                        />
                        Expense
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className={`btn btn-sm ${cashflowTab === 'combined' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                      onClick={() => setCashflowTab('combined')}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Combined
                    </button>
                    <button
                      className={`btn btn-sm ${cashflowTab === 'income' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                      onClick={() => setCashflowTab('income')}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Donations
                    </button>
                    <button
                      className={`btn btn-sm ${cashflowTab === 'expense' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                      onClick={() => setCashflowTab('expense')}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Expenses
                    </button>
                  </div>
                </div>
              </div>

              {chartsLoading ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '80px 0',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 13,
                  }}
                >
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cashflow} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'hsl(var(--on-surface-muted))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--on-surface-muted))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <Tooltip formatter={(val) => [fmt(Number(val))]} />
                    {(cashflowTab === 'combined' || cashflowTab === 'income') && (
                      <Bar
                        dataKey="income"
                        name="Donations"
                        fill="hsl(var(--primary))"
                        radius={[3, 3, 0, 0]}
                      />
                    )}
                    {(cashflowTab === 'combined' || cashflowTab === 'expense') && (
                      <Bar
                        dataKey="expense"
                        name="Expense"
                        fill="hsl(var(--destructive))"
                        radius={[3, 3, 0, 0]}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Recent Transactions ── */}
          <div className="panel" style={{ padding: 20, overflow: 'hidden' }}>
            <PanelHeaderBar
              title="Recent Transactions"
              subtitle="Last 20 entries — donations and expenses combined"
            />
            <div
              className="ph"
              style={{
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? 12 : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: isMobile ? 10 : 16,
                  alignItems: isMobile ? 'flex-start' : 'center',
                  flexWrap: 'wrap',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {/* Type Filter */}
                <select
                  id="tx-type-filter"
                  name="tx-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    background: 'hsl(var(--background))',
                    fontFamily: "'Public Sans', sans-serif",
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="income">Donations</option>
                  <option value="expense">Expenses</option>
                </select>

                {/* Status Filter */}
                <select
                  id="tx-status-filter"
                  name="tx-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    background: 'hsl(var(--background))',
                    fontFamily: "'Public Sans', sans-serif",
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved / Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="refunded">Refunded</option>
                </select>

                <SortToggle
                  value={sortOrder === 'date_desc' ? 'desc' : sortOrder}
                  onChange={() => {
                    if (sortOrder === 'date_desc') setSortOrder('asc')
                    else if (sortOrder === 'asc') setSortOrder('desc')
                    else setSortOrder('date_desc')
                  }}
                  label={sortOrder === 'date_desc' ? 'Newest' : 'A–Z'}
                />
                <Link
                  to="/admin/donations"
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  All donations →
                </Link>
                <Link
                  to="/admin/spending-ledger"
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  All expenses →
                </Link>
              </div>
            </div>

            <div
              style={{
                overflowX: 'auto',
                maxHeight: 400,
                overflowY: 'auto',
              }}
              className="thin-scroll"
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Description', 'Type', 'Date', 'Diaspora / Source', 'Amount', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontWeight: 500,
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.slice(0, 20).length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '32px 0',
                          color: 'hsl(var(--on-surface-muted))',
                          fontSize: 13,
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.slice(0, 20).map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontWeight: 500,
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {tx.description}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={tx.kind === 'income' ? 'pill pill-ok' : 'pill pill-err'}>
                            {tx.kind === 'income' ? 'Donation' : 'Expense'}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {new Date(tx.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {tx.chapterOrSource}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontWeight: 500,
                            color:
                              tx.kind === 'income'
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--destructive))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {tx.kind === 'income' ? '+' : '−'}
                          {fmt(tx.amount)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {tx.status ? (
                            <span
                              className={
                                tx.status === 'Verified' || tx.status === 'Approved'
                                  ? 'pill pill-ok'
                                  : tx.status === 'Pending'
                                    ? 'pill pill-warn'
                                    : 'pill pill-err'
                              }
                            >
                              {tx.status}
                            </span>
                          ) : (
                            <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Campaign Fundraising Progress ─────────────────────── */}
          {campaigns.length > 0 && (
            <div className="panel" style={{ marginTop: 24, padding: 20, overflow: 'hidden' }}>
              <PanelHeaderBar
                title="Campaign fundraising"
                subtitle="Progress of active and closed donation campaigns."
              />
              <div className="ph">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
                >
                  campaign
                </span>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {campaigns.map((c) => {
                  const pct =
                    c.targetAmount > 0
                      ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
                      : 0
                  return (
                    <div
                      key={c.id}
                      style={{
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-md)',
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {c.title}
                        </p>
                        <span className={`pill ${c.status === 'Active' ? 'pill-ok' : 'pill-mute'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          marginBottom: 6,
                        }}
                      >
                        <span>Raised: {fmt(c.raisedAmount)}</span>
                        <span>Target: {fmt(c.targetAmount)}</span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 'var(--radius-pill)',
                          background: 'hsl(var(--border))',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 'var(--radius-pill)',
                            background: pct >= 100 ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          textAlign: 'right',
                        }}
                      >
                        {pct}% funded
                        {c.endDate &&
                          ` · Ends ${new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
