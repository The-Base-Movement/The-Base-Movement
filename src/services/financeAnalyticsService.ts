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
