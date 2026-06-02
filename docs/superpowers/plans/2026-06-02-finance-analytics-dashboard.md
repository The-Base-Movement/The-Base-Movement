# Finance Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/admin/finance-dashboard` page for Finance Officers showing platform-wide KPIs, a cashflow bar chart, expense breakdown donut chart, and a combined recent transactions table — all wired to live Supabase data.

**Architecture:** New `financeAnalyticsService.ts` fetches from `donations` and `mobilization_ledger` tables. All time-bucketing is done client-side. Charts use Recharts (already installed). The page is a standard React admin page following the project's design system. No new DB migrations required.

**Tech Stack:** React 18 + TypeScript, Recharts ^2.15.4, Supabase JS client, project CSS design system (inline styles + design tokens)

---

### Task 1: Data Service — `financeAnalyticsService.ts`

**Files:**

- Create: `src/services/financeAnalyticsService.ts`

**Context:** The project already has `donationService.ts` with a `getMobilizationLedger()` method but it has no analytics queries. This new service is standalone — it does not extend or import from `donationService`. It imports only `supabase` from `@/lib/supabase`.

Key facts about the DB:

- `donations` table: `id`, `created_at` (timestamptz), `amount` (numeric), `full_name` (text), `payment_method` (text), `country` (text), `status` (text: `'Pending' | 'Verified' | 'Rejected'`). Only `status = 'Verified'` rows count as income.
- `mobilization_ledger` table: `id`, `timestamp` (timestamptz — NOT `created_at`), `amount` (numeric), `description` (text), `chapter` (text), `category` (text, free-form). All rows count as expenses.

- [ ] **Step 1: Create the service file**

  Create `src/services/financeAnalyticsService.ts` with the full content below:

  ```ts
  import { supabase } from '@/lib/supabase'

  export type FinancePeriod = 'day' | 'week' | 'month' | 'year'

  export interface SummaryStats {
    totalIncome: number
    totalExpenses: number
    netBalance: number
  }

  export interface CashflowBucket {
    label: string
    income: number
    expense: number
  }

  export interface ExpenseCategory {
    category: string
    amount: number
    percent: number
  }

  export interface TransactionRow {
    id: string
    kind: 'income' | 'expense'
    description: string
    date: string
    chapterOrSource: string
    amount: number
    status?: string
  }

  function getPeriodStart(period: FinancePeriod): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      case 'week': {
        const d = new Date(now)
        d.setDate(now.getDate() - 7 * 7)
        d.setHours(0, 0, 0, 0)
        return d
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 11, 1)
      case 'year':
        return new Date(now.getFullYear() - 4, 0, 1)
    }
  }

  function bucket(
    period: FinancePeriod,
    donations: { created_at: string; amount: number }[],
    ledger: { timestamp: string; amount: number }[]
  ): CashflowBucket[] {
    const now = new Date()
    const buckets: CashflowBucket[] = []

    if (period === 'month') {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
        const label = start.toLocaleString('default', { month: 'short' })
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label, income, expense })
      }
    } else if (period === 'year') {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i
        const start = new Date(year, 0, 1)
        const end = new Date(year + 1, 0, 1)
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label: String(year), income, expense })
      }
    } else if (period === 'week') {
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now)
        start.setDate(now.getDate() - i * 7 - now.getDay())
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + 7)
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label: `Wk ${8 - i}`, income, expense })
      }
    } else {
      // day — last 7 days
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const end = new Date(start)
        end.setDate(start.getDate() + 1)
        const income = donations
          .filter((x) => {
            const d = new Date(x.created_at)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        const expense = ledger
          .filter((x) => {
            const d = new Date(x.timestamp)
            return d >= start && d < end
          })
          .reduce((s, x) => s + Number(x.amount), 0)
        buckets.push({ label: DAYS[start.getDay()], income, expense })
      }
    }

    return buckets
  }

  export const financeAnalyticsService = {
    async getSummaryStats(): Promise<SummaryStats> {
      const [donRes, ledRes] = await Promise.all([
        supabase.from('donations').select('amount').eq('status', 'Verified'),
        supabase.from('mobilization_ledger').select('amount'),
      ])
      const totalIncome = (donRes.data ?? []).reduce((s, d) => s + Number(d.amount), 0)
      const totalExpenses = (ledRes.data ?? []).reduce((s, l) => s + Number(l.amount), 0)
      return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses }
    },

    async getCashflowData(period: FinancePeriod): Promise<CashflowBucket[]> {
      const start = getPeriodStart(period).toISOString()
      const [donRes, ledRes] = await Promise.all([
        supabase
          .from('donations')
          .select('created_at, amount')
          .eq('status', 'Verified')
          .gte('created_at', start),
        supabase.from('mobilization_ledger').select('timestamp, amount').gte('timestamp', start),
      ])
      return bucket(period, donRes.data ?? [], ledRes.data ?? [])
    },

    async getExpenseBreakdown(period: FinancePeriod): Promise<ExpenseCategory[]> {
      const start = getPeriodStart(period).toISOString()
      const { data } = await supabase
        .from('mobilization_ledger')
        .select('category, amount')
        .gte('timestamp', start)
      const entries = data ?? []
      const totals: Record<string, number> = {}
      for (const e of entries) {
        const key = e.category || 'Uncategorized'
        totals[key] = (totals[key] ?? 0) + Number(e.amount)
      }
      const grand = Object.values(totals).reduce((s, v) => s + v, 0)
      return Object.entries(totals)
        .map(([category, amount]) => ({
          category,
          amount,
          percent: grand > 0 ? Math.round((amount / grand) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
    },

    async getRecentTransactions(limit = 20): Promise<TransactionRow[]> {
      const [donRes, ledRes] = await Promise.all([
        supabase
          .from('donations')
          .select('id, created_at, amount, full_name, payment_method, country, status')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('mobilization_ledger')
          .select('id, timestamp, amount, description, chapter')
          .order('timestamp', { ascending: false })
          .limit(limit),
      ])
      const income: TransactionRow[] = (donRes.data ?? []).map((d) => ({
        id: d.id,
        kind: 'income' as const,
        description: d.full_name || 'Anonymous',
        date: d.created_at,
        chapterOrSource: d.payment_method || d.country || '—',
        amount: Number(d.amount),
        status: d.status,
      }))
      const expense: TransactionRow[] = (ledRes.data ?? []).map((l) => ({
        id: l.id,
        kind: 'expense' as const,
        description: l.description,
        date: l.timestamp,
        chapterOrSource: l.chapter || '—',
        amount: Number(l.amount),
      }))
      return [...income, ...expense]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
    },
  }
  ```

- [ ] **Step 2: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: no errors

- [ ] **Step 3: Commit**

  ```bash
  git add src/services/financeAnalyticsService.ts
  git commit -m "feat(services): add financeAnalyticsService for dashboard data"
  ```

---

### Task 2: Page Component — `FinanceDashboard.tsx`

**Files:**

- Create: `src/pages/admin/FinanceDashboard.tsx`

**Context:**

- Design system reference: `CLAUDE.md` — use `.main`, `.panel`, `.ph`, `.sidebar-main`, `.kpis`, `.pill`, `.btn`, `.btn-sm`, `.btn-active-tab`, `.btn-inactive-tab` CSS classes. Use inline styles with CSS variables (always wrapped in `hsl()`).
- `AdminPageHeader` is at `@/components/admin/AdminPageHeader` — import and use it at the top of every admin page.
- Recharts import pattern (from existing `src/pages/admin/chapters/ChaptersStats.tsx`): `import { BarChart, Bar, ... } from 'recharts'`
- The `.sidebar-main` class gives sidebar (left) ~30% and main (right) ~70%. Use it for donut (left) + cashflow bar chart (right).
- Currency format: `GH₵ X,XXX.XX` — use `n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` prefixed with `GH₵ `.
- `financeAnalyticsService` is at `@/services/financeAnalyticsService` — import all four types too.

- [ ] **Step 1: Create the page file**

  Create `src/pages/admin/FinanceDashboard.tsx`:

  ```tsx
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
  import AdminPageHeader from '@/components/admin/AdminPageHeader'
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
    const [cashflow, setCashflow] = useState<CashflowBucket[]>([])
    const [breakdown, setBreakdown] = useState<ExpenseCategory[]>([])
    const [transactions, setTransactions] = useState<TransactionRow[]>([])
    const [period, setPeriod] = useState<FinancePeriod>('month')
    const [chartsLoading, setChartsLoading] = useState(true)

    useEffect(() => {
      financeAnalyticsService.getSummaryStats().then(setStats)
      financeAnalyticsService.getRecentTransactions(20).then(setTransactions)
    }, [])

    useEffect(() => {
      setChartsLoading(true)
      Promise.all([
        financeAnalyticsService.getCashflowData(period),
        financeAnalyticsService.getExpenseBreakdown(period),
      ]).then(([cf, bd]) => {
        setCashflow(cf)
        setBreakdown(bd)
        setChartsLoading(false)
      })
    }, [period])

    return (
      <div className="main">
        <AdminPageHeader title="Finance Dashboard" subtitle="Platform-wide financial overview" />

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
                {stats ? fmt(stats.netBalance) : '—'}
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
                    <Tooltip formatter={(val: number) => fmt(val)} />
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
                      borderRadius: 2,
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
                      borderRadius: 2,
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
                  <Tooltip formatter={(val: number) => [fmt(val)]} />
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
  ```

- [ ] **Step 2: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: no errors

- [ ] **Step 3: Lint check**

  Run: `npm run lint`
  Expected: no errors or warnings

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/admin/FinanceDashboard.tsx
  git commit -m "feat(ui): build FinanceDashboard analytics page"
  ```

---

### Task 3: Routing & Nav Wiring

**Files:**

- Modify: `src/routes.tsx` (line 98 — lazy imports block; line 214 — admin routes block)
- Modify: `src/components/layouts/AdminLayout.tsx` (line 14 — `FINANCE_OFFICER_ALLOWED_PATHS`; line 220 — Finance nav group items)

**Context:**

- `src/routes.tsx` — The lazy import for `AdminFinanceRequests` is at line 98. Add the new import on line 99 (immediately after). The admin finance routes are at lines 212–214. Add the new route after line 214.
- `src/components/layouts/AdminLayout.tsx` — `FINANCE_OFFICER_ALLOWED_PATHS` is at lines 14–20. Add `'/admin/finance-dashboard'` to that array. The Finance nav group starts at line 218; add the new nav item as the **first** item in the group's `items` array (before Donations).

- [ ] **Step 1: Add lazy import to `src/routes.tsx`**

  After line 98 (`const AdminFinanceRequests = lazy(...)`), add:

  ```ts
  const AdminFinanceDashboard = lazy(() => import('./pages/admin/FinanceDashboard'))
  ```

- [ ] **Step 2: Add route to `src/routes.tsx`**

  After the line `{ path: '/admin/finance-requests', element: <AdminFinanceRequests /> },` (line 214), add:

  ```ts
  { path: '/admin/finance-dashboard', element: <AdminFinanceDashboard /> },
  ```

- [ ] **Step 3: Add path to `FINANCE_OFFICER_ALLOWED_PATHS` in `AdminLayout.tsx`**

  The constant at line 14–20 currently reads:

  ```ts
  const FINANCE_OFFICER_ALLOWED_PATHS = [
    '/admin/donations',
    '/admin/spending-ledger',
    '/admin/store',
    '/admin/orders',
    '/admin/finance-requests',
  ]
  ```

  Add `'/admin/finance-dashboard'` as the first entry:

  ```ts
  const FINANCE_OFFICER_ALLOWED_PATHS = [
    '/admin/finance-dashboard',
    '/admin/donations',
    '/admin/spending-ledger',
    '/admin/store',
    '/admin/orders',
    '/admin/finance-requests',
  ]
  ```

- [ ] **Step 4: Add nav item to Finance group in `AdminLayout.tsx`**

  The Finance group items array (line 220) currently starts with the Donations item. Insert the Finance Dashboard item **before** it:

  ```ts
  {
    label: 'Finance',
    icon: 'account_balance_wallet',
    items: [
      {
        to: '/admin/finance-dashboard',
        icon: 'analytics',
        label: 'Finance dashboard',
        permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
      },
      {
        to: '/admin/donations',
        // ... rest of donations item unchanged
  ```

- [ ] **Step 5: TypeScript check and build**

  Run: `npx tsc --noEmit && npm run build`
  Expected: clean compile, no warnings

- [ ] **Step 6: Commit and push**

  ```bash
  git add src/routes.tsx src/components/layouts/AdminLayout.tsx
  git commit -m "feat(rbac): add finance-dashboard route and nav item"
  git push
  ```

---

## Self-Review

### Spec Coverage

| Spec requirement                                       | Task covering it                         |
| ------------------------------------------------------ | ---------------------------------------- |
| Dedicated page `/admin/finance-dashboard`              | Task 3 (route + nav)                     |
| Access: `FINANCE_OFFICER` + `SUPER_ADMIN` only         | Task 3 (`FINANCE_OFFICER_ALLOWED_PATHS`) |
| Hero card: org name + net balance                      | Task 2 (dark hero panel)                 |
| KPI: Total Donations (`status = 'Verified'`)           | Tasks 1 + 2                              |
| KPI: Total Expenses (all ledger rows)                  | Tasks 1 + 2                              |
| KPI: Net Balance                                       | Tasks 1 + 2                              |
| Cashflow bar chart (income vs expense)                 | Tasks 1 + 2                              |
| Period filter: Day / Week / Month / Year               | Tasks 1 + 2                              |
| Expense breakdown donut with legend                    | Tasks 1 + 2                              |
| Both charts share the same period filter               | Task 2 (shared `period` state)           |
| Recent transactions: combined income + expense table   | Tasks 1 + 2                              |
| "View all donations" + "View all expenses" links       | Task 2                                   |
| Sidebar nav "Finance dashboard" link (icon: analytics) | Task 3                                   |
