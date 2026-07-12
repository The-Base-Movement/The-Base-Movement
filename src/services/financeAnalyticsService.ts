import { supabase } from '@/lib/supabase'
import {
  VERIFIED_DONATION_STATUS,
  donationAmount,
  fetchDonationMetricRows,
  sumDonationAmounts,
} from '@/services/donationCalculations'

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

export interface DuesKpis {
  enrolled: number
  paid: number
  due: number
  overdue: number
  optedOut: number
  collectedGhs: number
}

/**
 * Six finance KPIs for the Monthly Dues tab. Pure — testable without
 * Supabase. 'due' counts due+pending+failed obligations; 'collectedGhs'
 * sums paid obligations in GHS.
 */
export function computeDuesKpis(
  enrollments: { status: string }[],
  payments: { status: string; amount_ghs: number | string }[]
): DuesKpis {
  const paid = payments.filter((p) => p.status === 'paid')
  return {
    enrolled: enrollments.filter((e) => ['active', 'pending_activation'].includes(e.status)).length,
    paid: paid.length,
    due: payments.filter((p) => ['due', 'pending', 'failed'].includes(p.status)).length,
    overdue: payments.filter((p) => p.status === 'overdue').length,
    optedOut: enrollments.filter((e) => ['opted_out', 'cancellation_pending'].includes(e.status))
      .length,
    collectedGhs: Math.round(paid.reduce((s, p) => s + Number(p.amount_ghs), 0) * 100) / 100,
  }
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
      d.setDate(now.getDate() - 8 * 7)
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
  /** Returns all distinct non-null chapter values from the ledger, sorted A–Z. */
  async getChapters(): Promise<string[]> {
    const { data, error } = await supabase
      .from('mobilization_ledger')
      .select('chapter')
      .eq('transaction_type', 'Expenditure')
      .not('chapter', 'is', null)
    if (error) throw new Error(error.message)
    const unique = [...new Set((data ?? []).map((r) => r.chapter as string).filter(Boolean))]
    return unique.sort()
  },

  async getSummaryStats(chapter?: string): Promise<SummaryStats> {
    let ledQuery = supabase
      .from('mobilization_ledger')
      .select('amount')
      .eq('transaction_type', 'Expenditure')
    const orderQuery = supabase
      .from('store_orders')
      .select('total_amount')
      .eq('payment_status', 'Paid')
      .neq('status', 'Cancelled')
    const licenseQuery = supabase
      .from('it_licenses')
      .select('cost, billing_cycle')
      .eq('status', 'Active')
    const resourceQuery = supabase
      .from('resource_request_items')
      .select('quantity, store_inventory!inner(price_ghs), resource_requests!inner(status)')
    if (chapter) {
      ledQuery = ledQuery.eq('chapter', chapter)
    }
    // Monthly dues are platform-wide (no chapter), so they only count in
    // the unfiltered view.
    const duesQuery = chapter
      ? Promise.resolve({ data: [] as { amount_ghs: number }[] })
      : supabase.from('monthly_dues_payments').select('amount_ghs').eq('status', 'paid')
    const [donationRows, ledRes, orderRes, licenseRes, resourceRes, duesRes] = await Promise.all([
      fetchDonationMetricRows({
        select: 'amount, status, chapter',
        status: VERIFIED_DONATION_STATUS,
        chapter,
      }),
      ledQuery,
      orderQuery,
      licenseQuery,
      resourceQuery,
      duesQuery,
    ])
    if (ledRes.error) throw new Error(ledRes.error.message)
    const donationIncome = sumDonationAmounts(donationRows)
    const storeIncome = (orderRes.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0)
    const duesIncome = (duesRes.data ?? []).reduce(
      (s: number, p: { amount_ghs: number | string }) => s + Number(p.amount_ghs),
      0
    )
    const totalIncome = donationIncome + storeIncome + duesIncome
    const ledgerExpenses = (ledRes.data ?? []).reduce((s, l) => s + Number(l.amount), 0)
    const annualLicenseCost = (licenseRes.data ?? []).reduce((s, l) => {
      const cost = Number(l.cost)
      return s + (l.billing_cycle === 'Monthly' ? cost * 12 : cost)
    }, 0)
    const monthlyLicenseCost = annualLicenseCost / 12
    const resourceCost = (resourceRes.data ?? [])
      .filter((r) => {
        const req = r.resource_requests as unknown as { status: string }
        return (
          req?.status === 'Approved' || req?.status === 'Dispatched' || req?.status === 'Delivered'
        )
      })
      .reduce((s, item) => {
        const inv = item.store_inventory as unknown as { price_ghs: number }
        return s + Number(item.quantity) * Number(inv?.price_ghs ?? 0)
      }, 0)
    const totalExpenses = ledgerExpenses + monthlyLicenseCost + resourceCost
    return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses }
  },

  async getCashflowData(period: FinancePeriod, chapter?: string): Promise<CashflowBucket[]> {
    const start = getPeriodStart(period).toISOString()
    let ledQuery = supabase
      .from('mobilization_ledger')
      .select('timestamp, amount')
      .eq('transaction_type', 'Expenditure')
      .gte('timestamp', start)
    const orderQuery = supabase
      .from('store_orders')
      .select('created_at, total_amount')
      .eq('payment_status', 'Paid')
      .neq('status', 'Cancelled')
      .gte('created_at', start)
    if (chapter) {
      ledQuery = ledQuery.eq('chapter', chapter)
    }
    const duesQuery = chapter
      ? Promise.resolve({ data: [] as { paid_at: string; amount_ghs: number }[] })
      : supabase
          .from('monthly_dues_payments')
          .select('paid_at, amount_ghs')
          .eq('status', 'paid')
          .gte('paid_at', start)
    const [donationRows, ledRes, orderRes, duesRes] = await Promise.all([
      fetchDonationMetricRows({
        select: 'created_at, amount, status, chapter',
        status: VERIFIED_DONATION_STATUS,
        chapter,
        since: start,
      }),
      ledQuery,
      orderQuery,
      duesQuery,
    ])
    if (ledRes.error) throw new Error(ledRes.error.message)
    const verifiedDonations = donationRows
      .filter((d): d is typeof d & { created_at: string } => typeof d.created_at === 'string')
      .map((d) => ({
        created_at: d.created_at,
        amount: donationAmount(d),
      }))
    const storeAsDonations = (orderRes.data ?? []).map((o) => ({
      created_at: o.created_at,
      amount: Number(o.total_amount),
    }))
    const duesAsIncome = (duesRes.data ?? [])
      .filter((p: { paid_at: string | null }) => p.paid_at)
      .map((p: { paid_at: string; amount_ghs: number | string }) => ({
        created_at: p.paid_at,
        amount: Number(p.amount_ghs),
      }))
    const allIncome = [...verifiedDonations, ...storeAsDonations, ...duesAsIncome]
    return bucket(period, allIncome, ledRes.data ?? [])
  },

  async getExpenseBreakdown(period: FinancePeriod, chapter?: string): Promise<ExpenseCategory[]> {
    const start = getPeriodStart(period).toISOString()
    let query = supabase
      .from('mobilization_ledger')
      .select('category, amount')
      .eq('transaction_type', 'Expenditure')
      .gte('timestamp', start)
    if (chapter) {
      query = query.eq('chapter', chapter)
    }
    const { data, error } = await query
    if (error) throw new Error(error.message)
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

  async getIncomeBreakdown(
    period: FinancePeriod,
    chapter?: string,
    groupBy: 'campaign' | 'country' = 'campaign'
  ): Promise<ExpenseCategory[]> {
    const start = getPeriodStart(period).toISOString()
    const entries = await fetchDonationMetricRows({
      select:
        'amount, country, campaign_id, donation_campaigns(title), status, chapter, created_at',
      status: VERIFIED_DONATION_STATUS,
      chapter,
      since: start,
    })
    const totals: Record<string, number> = {}
    for (const e of entries) {
      let key = 'General Fund'
      if (groupBy === 'country') {
        key = e.country || 'Unknown'
      } else {
        const campaign = Array.isArray(e.donation_campaigns)
          ? e.donation_campaigns[0]
          : e.donation_campaigns
        const campaignTitle = campaign?.title || 'General Fund'
        key = campaignTitle
      }
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

  async getRecentTransactions(limit = 20, chapter?: string): Promise<TransactionRow[]> {
    let donQuery = supabase
      .from('donations')
      .select('id, created_at, amount, full_name, payment_method, country, status, chapter')
      .order('created_at', { ascending: false })
      .limit(limit)
    let ledQuery = supabase
      .from('mobilization_ledger')
      .select('id, timestamp, amount, description, chapter')
      .eq('transaction_type', 'Expenditure')
      .order('timestamp', { ascending: false })
      .limit(limit)
    let reqQuery = supabase
      .from('finance_requests')
      .select('id, created_at, amount, description, chapter, status')
      .in('status', ['Pending', 'Rejected'])
      .order('created_at', { ascending: false })
      .limit(limit)
    const orderQuery = supabase
      .from('store_orders')
      .select('id, created_at, total_amount, full_name, payment_method, payment_status, status')
      .eq('payment_status', 'Paid')
      .neq('status', 'Cancelled')
      .order('created_at', { ascending: false })
      .limit(limit)
    const licenseQuery = supabase
      .from('it_licenses')
      .select('id, software_name, vendor, cost, billing_cycle, renewal_date, status')
      .eq('status', 'Active')
    const resourceTxQuery = supabase
      .from('resource_requests')
      .select(
        'id, created_at, region, status, notes, resource_request_items(quantity, store_inventory(name, price_ghs))'
      )
      .in('status', ['Approved', 'Dispatched', 'Delivered'])
      .order('created_at', { ascending: false })
      .limit(limit)
    if (chapter) {
      donQuery = donQuery.eq('chapter', chapter)
      ledQuery = ledQuery.eq('chapter', chapter)
      reqQuery = reqQuery.eq('chapter', chapter)
    }
    const duesTxQuery = supabase
      .from('monthly_dues_payments')
      .select('id, paid_at, amount_ghs, payment_mode, status')
      .eq('status', 'paid')
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(limit)
    const [donRes, ledRes, reqRes, orderRes, licenseRes, resourceTxRes, duesTxRes] =
      await Promise.all([
        donQuery,
        ledQuery,
        reqQuery,
        orderQuery,
        licenseQuery,
        resourceTxQuery,
        chapter ? Promise.resolve({ data: [] }) : duesTxQuery,
      ])
    if (donRes.error) throw new Error(donRes.error.message)
    if (ledRes.error) throw new Error(ledRes.error.message)
    if (reqRes.error) throw new Error(reqRes.error.message)
    const income: TransactionRow[] = (donRes.data ?? []).map((d) => ({
      id: d.id,
      kind: 'income' as const,
      description: d.full_name || 'Anonymous',
      date: d.created_at,
      chapterOrSource: d.chapter || d.payment_method || d.country || '—',
      amount: Number(d.amount),
      status: d.status,
    }))
    const storeIncome: TransactionRow[] = (orderRes.data ?? []).map((o) => ({
      id: o.id,
      kind: 'income' as const,
      description: o.full_name || 'Store Order',
      date: o.created_at,
      chapterOrSource: o.payment_method || 'Store',
      amount: Number(o.total_amount),
      status: o.payment_status,
    }))
    const expense: TransactionRow[] = (ledRes.data ?? []).map((l) => ({
      id: l.id,
      kind: 'expense' as const,
      description: l.description,
      date: l.timestamp,
      chapterOrSource: l.chapter || '—',
      amount: Number(l.amount),
      status: 'Approved',
    }))
    const pendingRejectedExpense: TransactionRow[] = (reqRes.data ?? []).map((r) => ({
      id: r.id,
      kind: 'expense' as const,
      description: r.description || 'Finance Request',
      date: r.created_at,
      chapterOrSource: r.chapter || '—',
      amount: Number(r.amount),
      status: r.status,
    }))
    const licenseExpense: TransactionRow[] = (licenseRes.data ?? []).map((l) => ({
      id: l.id,
      kind: 'expense' as const,
      description: `${l.software_name} (${l.vendor})`,
      date: l.renewal_date,
      chapterOrSource: 'IT License',
      amount: l.billing_cycle === 'Monthly' ? Number(l.cost) : Number(l.cost) / 12,
      status: l.status,
    }))
    interface ResourceTxItem {
      quantity: number
      store_inventory: { name: string; price_ghs: number } | null
    }
    const resourceExpense: TransactionRow[] = (resourceTxRes.data ?? []).map((r) => {
      const items = (r.resource_request_items ?? []) as unknown as ResourceTxItem[]
      const total = items.reduce(
        (s, item) => s + Number(item.quantity) * Number(item.store_inventory?.price_ghs ?? 0),
        0
      )
      const names = items
        .map((item) => item.store_inventory?.name)
        .filter(Boolean)
        .join(', ')
      return {
        id: r.id,
        kind: 'expense' as const,
        description: names || r.notes || 'Resource Request',
        date: r.created_at,
        chapterOrSource: r.region || '—',
        amount: total,
        status: r.status,
      }
    })
    const duesIncome: TransactionRow[] = (duesTxRes.data ?? []).map(
      (p: { id: string; paid_at: string; amount_ghs: number | string; payment_mode: string }) => ({
        id: p.id,
        kind: 'income' as const,
        description: 'Monthly Dues',
        date: p.paid_at,
        chapterOrSource:
          p.payment_mode === 'offline'
            ? 'Dues (Offline)'
            : p.payment_mode === 'recurring_hubtel'
              ? 'Dues (Recurring)'
              : 'Dues (Hubtel)',
        amount: Number(p.amount_ghs),
        status: 'Verified',
      })
    )
    return [
      ...income,
      ...storeIncome,
      ...duesIncome,
      ...expense,
      ...pendingRejectedExpense,
      ...licenseExpense,
      ...resourceExpense,
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  },
}
