import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import type { DonationDetail } from '@/types/admin'
import {
  fetchDonationMetricRows,
  isVerifiedDonation,
  sumDonationAmounts,
} from '@/services/donationCalculations'

interface DonationCampaignJoin {
  title?: string | null
}

interface DonationUserJoin {
  avatar_url?: string | null
}

interface DonationRow {
  id: string
  created_at: string
  amount: number | string
  payment_method: string
  status: 'Pending' | 'Verified' | 'Rejected'
  full_name: string
  phone: string
  country: string
  guest_email?: string | null
  receipt_url?: string | null
  campaign_id?: string | null
  member_id?: string | null
  reference?: string | null
  donation_campaigns?: DonationCampaignJoin | null
  users?: DonationUserJoin | null
}

export interface GroupDonationPortion {
  registrationNumber: string
  amountGhs: number
}

export interface GroupDonationResult {
  ok: boolean
  error?: string
  registration_numbers?: string[]
  dry_run?: boolean
  group_id?: string
  total_ghs?: number
  members?: { registration_number: string; full_name: string | null; amount_ghs: number }[]
}

export interface PublicDonationInput {
  fullName: string
  phone: string
  amount: number
  country: string
  guestEmail?: string
  campaignId?: string | null
  showOnDashboard?: boolean
  chapter?: string | null
  constituency?: string | null
}

class DonationService {
  private static instance: DonationService

  private constructor() {}

  public static getInstance(): DonationService {
    if (!DonationService.instance) {
      DonationService.instance = new DonationService()
    }
    return DonationService.instance
  }

  async createPublicDonation(input: PublicDonationInput): Promise<string> {
    const { data, error } = await supabase.rpc('create_public_donation', {
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_amount: input.amount,
      p_country: input.country,
      p_guest_email: input.guestEmail || null,
      p_campaign_id: input.campaignId || null,
      p_show_on_dashboard: input.showOnDashboard ?? true,
      p_chapter: input.chapter || null,
      p_constituency: input.constituency || null,
    })
    if (error) throw error
    if (typeof data !== 'string') throw new Error('Donation record was not created.')
    return data
  }

  async getCheckoutStatus(donationId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_donation_checkout_status', {
      p_donation_id: donationId,
    })
    if (error) throw error
    return typeof data === 'string' ? data : null
  }

  async getDonations(status?: string): Promise<DonationDetail[]> {
    let query = supabase
      .from('donations')
      .select('*, donation_campaigns(title)')
      .order('created_at', { ascending: false })

    if (status && status !== 'All') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.warn('[DATABASE] Failed to fetch donations:', error)
      return []
    }

    interface DBDonation {
      id: string
      created_at: string
      amount: number
      payment_method: string
      status: 'Pending' | 'Verified' | 'Rejected'
      full_name: string
      phone: string
      country: string
      guest_email: string | null
      receipt_url: string
      campaign_id: string
      member_id: string
      reference: string | null
      donation_campaigns: { title: string }
    }

    return (data || []).map((d: DBDonation) => ({
      id: d.id,
      date: d.created_at,
      amount: d.amount.toString(),
      method: d.payment_method,
      status: d.status,
      reference: d.reference ?? d.id.substring(0, 8).toUpperCase(),
      campaignTitle: d.donation_campaigns?.title,
      fullName: d.full_name,
      phone: d.phone,
      country: d.country,
      guestEmail: d.guest_email ?? undefined,
      receiptUrl: d.receipt_url,
      campaignId: d.campaign_id,
      memberId: d.member_id,
    }))
  }

  async getMobilizationLedger(limit: number = 20): Promise<
    {
      id: string
      chapter: string
      type: 'Allocation' | 'Expenditure'
      amount: string
      description: string
      category: string
      date: string
    }[]
  > {
    const { data, error } = await supabase
      .from('mobilization_ledger')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('[DATABASE] Failed to fetch mobilization ledger:', error)
      return []
    }

    return (data || []).map((d) => ({
      id: d.id.substring(0, 8).toUpperCase(),
      chapter: d.chapter,
      type: d.transaction_type,
      amount: `₵ ${Number(d.amount).toLocaleString()}`,
      description: d.description,
      category: d.category,
      date: new Date(d.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }))
  }

  async getAllSpendingEntries(): Promise<
    {
      id: string
      chapter: string
      amount: number
      description: string
      category: string
      timestamp: string
    }[]
  > {
    const { data, error } = await supabase
      .from('mobilization_ledger')
      .select('id, chapter, amount, description, category, timestamp')
      .order('timestamp', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch spending entries:', error)
      return []
    }
    return data || []
  }

  async addSpendingEntry(entry: {
    chapter: string
    amount: number
    description: string
    category: string
    timestamp: string
  }): Promise<boolean> {
    const user = authService.getUser()
    const { error } = await supabase.from('mobilization_ledger').insert({
      chapter: entry.chapter,
      transaction_type: 'Expenditure',
      amount: entry.amount,
      description: entry.description,
      category: entry.category,
      timestamp: entry.timestamp,
      created_by: user?.id ?? null,
    })

    if (error) {
      console.error('[DATABASE] Failed to add spending entry:', error)
      return false
    }
    return true
  }

  async updateSpendingEntry(
    id: string,
    updates: {
      chapter?: string
      amount?: number
      description?: string
      category?: string
      timestamp?: string
    }
  ): Promise<boolean> {
    const { error } = await supabase.from('mobilization_ledger').update(updates).eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to update spending entry:', error)
      return false
    }
    return true
  }

  async deleteSpendingEntry(id: string): Promise<boolean> {
    const { error } = await supabase.from('mobilization_ledger').delete().eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to delete spending entry:', error)
      return false
    }
    return true
  }

  async getSpendingCategories(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('spending_categories')
      .select('id, name')
      .order('name', { ascending: true })
    if (error) {
      console.warn('[DATABASE] Failed to fetch spending categories:', error)
      return []
    }
    return data || []
  }

  async addSpendingCategory(name: string): Promise<boolean> {
    const { error } = await supabase.from('spending_categories').insert({ name: name.trim() })
    if (error) {
      console.error('[DATABASE] Failed to add spending category:', error)
      return false
    }
    return true
  }

  async renameSpendingCategory(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('spending_categories')
      .update({ name: name.trim() })
      .eq('id', id)
    if (error) {
      console.error('[DATABASE] Failed to rename spending category:', error)
      return false
    }
    return true
  }

  async deleteSpendingCategory(id: string): Promise<boolean> {
    const { error } = await supabase.from('spending_categories').delete().eq('id', id)
    if (error) {
      console.error('[DATABASE] Failed to delete spending category:', error)
      return false
    }
    return true
  }

  async getPendingDonations(): Promise<DonationDetail[]> {
    return this.getDonations('Pending')
  }

  /**
   * Validates (dryRun) or creates a group donation: one Pending donation row
   * per member, all sharing a group_id that becomes the Hubtel payment
   * reference. Amounts are GHS. Validation runs server-side in the RPC.
   */
  async createGroupDonation(
    portions: GroupDonationPortion[],
    payerPhone: string,
    opts: {
      campaignId?: string | null
      country?: string
      dryRun?: boolean
      groupName?: string | null
      payerName?: string | null
    } = {}
  ): Promise<GroupDonationResult> {
    const { data, error } = await supabase.rpc('create_group_donation', {
      p_portions: portions.map((p) => ({
        registration_number: p.registrationNumber,
        amount_ghs: p.amountGhs.toFixed(2),
      })),
      p_payer_phone: payerPhone,
      p_campaign_id: opts.campaignId ?? null,
      p_country: opts.country ?? 'Ghana',
      p_dry_run: opts.dryRun ?? false,
      p_group_name: opts.groupName?.trim() || null,
      p_payer_name: opts.payerName?.trim() || null,
    })
    if (error) throw error
    return data as GroupDonationResult
  }

  async getDonationStats(): Promise<{
    totalContributions: number
    pendingCount: number
    approvedAmount: number
    flaggedCount: number
  }> {
    try {
      const rows = await fetchDonationMetricRows({ select: 'amount, status' })
      const verifiedRows = rows.filter(isVerifiedDonation)

      return {
        totalContributions: rows.length,
        pendingCount: rows.filter((d) => d.status === 'Pending').length,
        approvedAmount: sumDonationAmounts(verifiedRows),
        flaggedCount: rows.filter((d) => d.status === 'Rejected').length,
      }
    } catch {
      return { totalContributions: 0, pendingCount: 0, approvedAmount: 0, flaggedCount: 0 }
    }
  }

  async verifyDonation(
    donationId: string,
    status: 'Verified' | 'Rejected',
    notes: string = ''
  ): Promise<boolean> {
    const user = authService.getUser()
    if (!user) return false

    const { error } = await supabase.rpc('verify_donation_record', {
      donation_id: donationId,
      admin_uid: user.id,
      verification_status: status,
      notes: notes,
    })

    if (error) {
      console.error('[DATABASE] Verification failed:', error)
      return false
    }

    return true
  }

  async getPublicDonationFeed(limit: number = 10): Promise<DonationDetail[]> {
    // SECURITY DEFINER RPC: donations RLS is admin-or-own-rows, so a direct
    // read would only show a member their own contributions. The RPC returns
    // verified donations with names already masked server-side.
    const { data, error } = await supabase.rpc('get_public_donation_feed', { p_limit: limit })

    if (error) {
      console.warn('[DATABASE] Failed to fetch public donation feed:', error)
      return []
    }

    const rows = (data ?? []) as Array<{
      id: string
      display_name: string
      amount: number
      campaign_title: string | null
      avatar_url: string | null
      created_at: string
    }>

    return rows.map((d) => ({
      id: d.id,
      date: d.created_at,
      amount: String(d.amount),
      method: '',
      status: 'Verified',
      reference: d.id.substring(0, 8).toUpperCase(),
      campaignTitle: d.campaign_title ?? undefined,
      fullName: d.display_name,
      phone: '',
      country: '',
      receiptUrl: '',
      campaignId: '',
      memberId: '',
      avatarUrl: d.avatar_url ?? undefined,
    }))
  }

  async getMemberDonations(phone: string): Promise<DonationDetail[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('*, donation_campaigns(title)')
      .eq('phone', phone)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch member donations:', error)
      return []
    }

    return (data || []).map((d) => this._mapDonation(d))
  }

  async getMemberDonationsById(userId: string): Promise<DonationDetail[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('*, donation_campaigns(title)')
      .eq('member_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch member donations by id:', error)
      return []
    }

    return (data || []).map((d) => this._mapDonation(d))
  }

  private _mapDonation(d: DonationRow): DonationDetail {
    return {
      id: d.id,
      date: d.created_at,
      amount: String(d.amount),
      method: d.payment_method,
      status: d.status,
      reference: d.reference ?? d.id.substring(0, 8).toUpperCase(),
      campaignTitle: d.donation_campaigns?.title ?? undefined,
      fullName: d.full_name,
      phone: d.phone,
      country: d.country,
      guestEmail: d.guest_email ?? undefined,
      receiptUrl: d.receipt_url ?? undefined,
      campaignId: d.campaign_id ?? '',
      memberId: d.member_id ?? undefined,
      avatarUrl: d.users?.avatar_url ?? undefined,
    }
  }

  subscribeToPublicDonations(callback: (donation: DonationDetail) => void): {
    unsubscribe: () => void
  } {
    // Polling instead of Realtime: postgres_changes respects RLS, so regular
    // members would never receive other donors' events. The RPC-backed feed
    // is the only view of all verified donations available to every member.
    const seen = new Set<string>()
    let primed = false
    let active = true

    const poll = async () => {
      const rows = await this.getPublicDonationFeed(15)
      if (!active) return
      if (!primed) {
        rows.forEach((r) => seen.add(r.id))
        primed = true
        return
      }
      // Oldest first so consumers prepend in chronological order
      for (const row of [...rows].reverse()) {
        if (!seen.has(row.id)) {
          seen.add(row.id)
          callback(row)
        }
      }
    }

    poll()
    const interval = setInterval(poll, 45_000)

    return {
      unsubscribe: () => {
        active = false
        clearInterval(interval)
      },
    }
  }

  async getMemberDonationStats(
    member: string | { authId?: string | null; phone?: string | null }
  ): Promise<{ total: number; count: number; lastMonth: number }> {
    const authId = typeof member === 'string' ? null : member.authId?.trim() || null
    const phone = typeof member === 'string' ? member.trim() : member.phone?.trim() || null

    if (!authId && !phone) return { total: 0, count: 0, lastMonth: 0 }

    const now = new Date()
    const yearStart = new Date(Date.UTC(now.getFullYear(), 0, 1)).toISOString()
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))

    const queries = []
    if (authId) {
      queries.push(
        supabase
          .from('donations')
          .select('id, amount, created_at')
          .eq('member_id', authId)
          .eq('status', 'Verified')
          .gte('created_at', yearStart)
      )
    }
    if (phone) {
      queries.push(
        supabase
          .from('donations')
          .select('id, amount, created_at')
          .eq('phone', phone)
          .eq('status', 'Verified')
          .gte('created_at', yearStart)
      )
    }

    const responses = await Promise.all(queries)
    const rows = new Map<string, { amount: number | string; created_at: string }>()

    for (const { data, error } of responses) {
      if (error) {
        console.warn('[DATABASE] Failed to fetch member donation stats:', error)
        continue
      }
      for (const row of data || []) {
        rows.set(row.id, row)
      }
    }

    const stats = Array.from(rows.values()).reduce(
      (acc, d) => {
        const amt = Number(d.amount)
        acc.total += amt
        acc.count += 1
        if (new Date(d.created_at) >= monthStart) {
          acc.lastMonth += amt
        }
        return acc
      },
      { total: 0, count: 0, lastMonth: 0 }
    )

    return stats
  }

  async updateVerificationNotes(donationId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('donations')
      .update({ verification_notes: notes })
      .eq('id', donationId)
    if (error) throw error
  }

  async sendReceipt(donationId: string): Promise<void> {
    await supabase.functions
      .invoke('send-donation-receipt', { body: { donationId } })
      .catch((err: unknown) => console.error('[DonationService] Receipt send failed:', err))
  }

  async getReceiptAccess(
    donationId: string
  ): Promise<{ signedUrl: string; reference?: string } | null> {
    const { data, error } = await supabase.functions.invoke('get-donation-receipt', {
      body: { donationId },
    })
    if (error) {
      console.error('[DonationService] Receipt access failed:', error)
      return null
    }
    return data as { signedUrl: string; reference?: string }
  }

  async markRefunded(donationId: string): Promise<void> {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'Refunded' })
      .eq('id', donationId)
    if (error) throw error
  }

  async backfillReceipts(
    force = false
  ): Promise<{ total: number; processed: number; failed: number }> {
    const { data, error } = await supabase.functions.invoke('backfill-donation-receipts', {
      body: { force },
    })
    if (error) throw error
    return data as { total: number; processed: number; failed: number }
  }
}

export const donationService = DonationService.getInstance()
