import { supabase } from '@/lib/supabase'

export interface FinanceRequest {
  id: string
  requester_id: string
  request_type: 'BudgetAllocation' | 'ExpenseReimbursement' | 'InventoryReplenishment'
  chapter: string
  amount: number
  description: string
  status: 'Pending' | 'Approved' | 'Rejected'
  officer_comment: string | null
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
  approval_tier: number
  category: string
  requester_name?: string
  requester_avatar?: string | null
}

export const financeService = {
  async getRequests(): Promise<FinanceRequest[]> {
    const { data, error } = await supabase
      .from('finance_requests')
      .select(
        `
        *,
        users:requester_id (full_name, avatar_url)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map(
      (r: FinanceRequest & { users?: { full_name?: string; avatar_url?: string | null } }) => ({
        ...r,
        requester_name: r.users?.full_name ?? 'Unknown User',
        requester_avatar: r.users?.avatar_url ?? null,
      })
    )
  },

  async createRequest(request: {
    request_type: FinanceRequest['request_type']
    chapter: string
    amount: number
    description: string
    category: string
  }): Promise<FinanceRequest> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('finance_requests')
      .insert({
        requester_id: user.id,
        request_type: request.request_type,
        chapter: request.chapter,
        amount: request.amount,
        description: request.description,
        category: request.category,
        status: 'Pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async reviewRequest(
    requestId: string,
    status: 'Approved' | 'Rejected',
    comment: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('finance_requests')
      .update({
        status,
        officer_comment: comment,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'Pending')
      .select('id')

    if (error) throw error
    if (!data?.length) throw new Error('Request is no longer available for review')
  },

  async acknowledgeRequest(requestId: string): Promise<void> {
    const { data: current, error: fetchErr } = await supabase
      .from('finance_requests')
      .select('approval_tier')
      .eq('id', requestId)
      .eq('status', 'Pending')
      .single()

    if (fetchErr || !current) throw new Error('Request is no longer available for review')

    const { error } = await supabase
      .from('finance_requests')
      .update({ approval_tier: current.approval_tier + 1 })
      .eq('id', requestId)
      .eq('status', 'Pending')

    if (error) throw error
  },
}
