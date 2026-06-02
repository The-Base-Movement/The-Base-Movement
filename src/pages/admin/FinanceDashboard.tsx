import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
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
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [period, setPeriod] = useState<FinancePeriod>('month')
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    financeAnalyticsService
      .getSummaryStats()
      .then(setStats)
      .catch(() => setStatsError(true))
    financeAnalyticsService
      .getRecentTransactions(20)
      .then(setTransactions)
      .catch(() => {
        /* silent — table shows empty state */
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (!cancelled) setChartsLoading(true)
        return Promise.all([
          financeAnalyticsService.getCashflowData(period),
          financeAnalyticsService.getExpenseBreakdown(period),
        ])
      })
      .then(([cf, bd]) => {
        if (!cancelled) {
          setCashflow(cf)
          setBreakdown(bd)
          setChartsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setChartsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  return (
    <div className="main">
      <AdminPageHeader title="Finance Dashboard" description="Platform-wide financial overview" />

      {/* ── KPI Row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
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
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.45)',
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
                color: '#fff',
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
              color: 'rgba(255,255,255,0.35)',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Net Balance
          </p>
        </div>

        {/* KPI: Total Donations */}
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
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
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
        <div className="panel" style={{ padding: 20 }}>
          <div className="ph" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Expense Breakdown</h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                By category
              </p>
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
          ) : breakdown.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
              }}
            >
              No expense data for this period
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => fmt(Number(val))} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ marginTop: 12 }}>
                {breakdown.map((item, i) => (
                  <div
                    key={item.category}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      fontSize: 12,
                      borderBottom:
                        i < breakdown.length - 1 ? '1px solid hsl(var(--border))' : 'none',
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
        <div className="panel" style={{ padding: 20 }}>
          <div className="ph" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Cashflow</h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Income vs Expenses
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 14,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
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
                Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 'var(--radius-xs)',
                    background: 'hsl(var(--on-surface))',
                    display: 'inline-block',
                  }}
                />
                Expense
              </span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="hsl(var(--on-surface))"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3 style={{ margin: 0 }}>Recent Transactions</h3>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Last 20 entries — donations and expenses combined
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
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

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Description', 'Type', 'Date', 'Chapter / Source', 'Amount', 'Status'].map(
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
              {transactions.length === 0 ? (
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
                transactions.map((tx) => (
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
                        {tx.kind === 'income' ? 'Income' : 'Expense'}
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
                          tx.kind === 'income' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
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
                            tx.status === 'Verified'
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
    </div>
  )
}
