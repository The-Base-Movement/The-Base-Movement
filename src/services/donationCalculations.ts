import { supabase } from '@/lib/supabase'

export const VERIFIED_DONATION_STATUS = 'Verified'
const PAGE_SIZE = 1000

export interface DonationMetricRow {
  id?: string
  amount: number | string | null
  status?: string | null
  created_at?: string | null
  chapter?: string | null
  country?: string | null
  campaign_id?: string | null
  donation_campaigns?: { title?: string | null } | { title?: string | null }[] | null
}

export interface DonationMetricFilters {
  select: string
  status?: string
  chapter?: string
  since?: string
  orderBy?: string
  ascending?: boolean
}

export function isVerifiedDonation(row: { status?: string | null }): boolean {
  return row.status === VERIFIED_DONATION_STATUS
}

export function donationAmount(row: { amount: number | string | null }): number {
  const amount = Number(row.amount)
  return Number.isFinite(amount) ? amount : 0
}

export function sumDonationAmounts(rows: Array<{ amount: number | string | null }>): number {
  return rows.reduce((sum, row) => sum + donationAmount(row), 0)
}

export async function fetchDonationMetricRows(
  filters: DonationMetricFilters
): Promise<DonationMetricRow[]> {
  const rows: DonationMetricRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from('donations')
      .select(filters.select)
      .range(from, from + PAGE_SIZE - 1)

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.chapter) query = query.eq('chapter', filters.chapter)
    if (filters.since) query = query.gte('created_at', filters.since)
    if (filters.orderBy) {
      query = query.order(filters.orderBy, { ascending: filters.ascending ?? true })
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const page = (data ?? []) as unknown as DonationMetricRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
}
