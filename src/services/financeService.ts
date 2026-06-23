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
  approver_name?: string
}

export const financeService = {
  async getRequests(): Promise<FinanceRequest[]> {
    const { data, error } = await supabase
      .from('finance_requests')
      .select(
        `
        *,
        users:requester_id (full_name, avatar_url),
        approver:reviewed_by (full_name)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map(
      (
        r: FinanceRequest & {
          users?: { full_name?: string; avatar_url?: string | null }
          approver?: { full_name?: string }
        }
      ) => ({
        ...r,
        requester_name: r.users?.full_name ?? 'Unknown User',
        requester_avatar: r.users?.avatar_url ?? null,
        approver_name: r.approver?.full_name ?? (r.reviewed_by === null ? 'auto' : 'Unknown'),
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
    comment: string,
    mfaFactorId: string,
    mfaCode: string
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke('finance-review', {
      body: {
        action: 'review',
        requestId,
        status,
        comment,
        mfaFactorId,
        mfaCode,
      },
    })
    if (error) throw error
    if (!data?.success) throw new Error('Request is no longer available for review')
  },

  async acknowledgeRequest(requestId: string, mfaFactorId: string, mfaCode: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('finance-review', {
      body: {
        action: 'acknowledge',
        requestId,
        mfaFactorId,
        mfaCode,
      },
    })
    if (error) throw error
    if (!data?.success) throw new Error('Request is no longer available for review')
  },

  async getFinanceTierLeaders(): Promise<{
    admins: { id: string; role: string }[]
    profiles: Record<string, { id: string; full_name: string; avatar_url: string | null }>
  }> {
    const { data: adminList } = await supabase
      .from('admins')
      .select('id, role')
      .in('role', ['FINANCE_OFFICER', 'EXECUTIVE', 'ORGANIZER', 'SUPER_ADMIN', 'FOUNDER', 'ADMIN'])
    const admins = (adminList ?? []) as { id: string; role: string }[]
    const profiles: Record<string, { id: string; full_name: string; avatar_url: string | null }> =
      {}
    if (admins.length) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in(
          'id',
          admins.map((a) => a.id)
        )
      for (const u of (users ?? []) as {
        id: string
        full_name: string
        avatar_url: string | null
      }[]) {
        profiles[u.id] = u
      }
    }
    return { admins, profiles }
  },
}
