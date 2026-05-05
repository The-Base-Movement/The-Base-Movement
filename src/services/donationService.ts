import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import type { DonationDetail } from '@/types/admin'

class DonationService {
  private static instance: DonationService

  private constructor() {}

  public static getInstance(): DonationService {
    if (!DonationService.instance) {
      DonationService.instance = new DonationService()
    }
    return DonationService.instance
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
      receipt_url: string
      campaign_id: string
      member_id: string
      donation_campaigns: { title: string }
    }

    return (data || []).map((d: DBDonation) => ({
      id: d.id,
      date: d.created_at,
      amount: d.amount.toString(),
      method: d.payment_method,
      status: d.status,
      reference: d.id.substring(0, 8),
      campaignTitle: d.donation_campaigns?.title,
      fullName: d.full_name,
      phone: d.phone,
      country: d.country,
      receiptUrl: d.receipt_url,
      campaignId: d.campaign_id,
      memberId: d.member_id
    }))
  }

  async getPendingDonations(): Promise<DonationDetail[]> {
    return this.getDonations('Pending')
  }

  async getDonationStats(): Promise<{ totalContributions: number, pendingCount: number, approvedAmount: number, flaggedCount: number }> {
    const { data, error } = await supabase
      .from('donations')
      .select('amount, status')

    if (error || !data) {
      return { totalContributions: 0, pendingCount: 0, approvedAmount: 0, flaggedCount: 0 }
    }

    return {
      totalContributions: data.length,
      pendingCount: data.filter(d => d.status === 'Pending').length,
      approvedAmount: data.filter(d => d.status === 'Verified').reduce((sum, d) => sum + Number(d.amount), 0),
      flaggedCount: data.filter(d => d.status === 'Rejected').length // We'll map Rejected to Flagged for now
    }
  }

  async verifyDonation(donationId: string, status: 'Verified' | 'Rejected', notes: string = ''): Promise<boolean> {
    const user = await authService.getUser()
    if (!user) return false

    const { error } = await supabase.rpc('verify_donation_record', {
      donation_id: donationId,
      admin_uid: user.id,
      verification_status: status,
      notes: notes
    })

    if (error) {
      console.error('[DATABASE] Verification failed:', error)
      return false
    }

    return true
  }
}

export const donationService = DonationService.getInstance()
