import { supabase } from '@/lib/supabase'

export type AudienceType = 'all' | 'region' | 'constituency' | 'chapter' | 'role' | 'multi'

export interface AudienceFilter {
  type: Exclude<AudienceType, 'multi'>
  value: string | null
}

export interface Newsletter {
  id: string
  subject: string
  body_html: string
  audience_type: AudienceType
  audience_value: string | null
  audience_filters: AudienceFilter[] | null
  recipient_count: number
  status: 'sent' | 'failed'
  error_message: string | null
  sent_by: string | null
  sent_at: string
  created_at: string
}

export interface SendNewsletterPayload {
  newsletter_id: string
  subject: string
  body_html: string
  audience_type: AudienceType
  audience_value: string | null
  audience_filters: AudienceFilter[]
}

export function buildAudienceLabel(type: AudienceType, value: string | null): string {
  if (type === 'all') return 'All members'
  if (type === 'multi') return 'Multiple audiences'
  const prefix = type.charAt(0).toUpperCase() + type.slice(1)
  return `${prefix}: ${value ?? ''}`
}

export function buildAudienceFiltersLabel(filters: AudienceFilter[]): string {
  if (filters.length === 0) return 'No audience'
  if (filters.length === 1) return buildAudienceLabel(filters[0].type, filters[0].value)
  return filters.map((f) => buildAudienceLabel(f.type, f.value)).join(' + ')
}

export function formatRecipientCount(count: number): string {
  return count === 1 ? '1 recipient' : `${count} recipients`
}

export const newsletterService = {
  async getNewsletters(): Promise<Newsletter[]> {
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('sent_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Newsletter[]
  },

  async getAudienceOptions(type: Exclude<AudienceType, 'all' | 'multi'>): Promise<string[]> {
    if (type === 'role') {
      const { data, error } = await supabase.from('admins').select('role').not('role', 'is', null)
      if (error) throw error
      return [...new Set((data ?? []).map((r: { role: string }) => r.role))].sort()
    }

    const col = type as 'region' | 'constituency' | 'chapter'
    const { data, error } = await supabase
      .from('users')
      .select(col)
      .not(col, 'is', null)
      .neq(col, '')
      .is('deleted_at', null)
    if (error) throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[]
    return [...new Set(rows.map((r: Record<string, string>) => r[col]))].filter(Boolean).sort()
  },

  async getRecipientCount(
    type: Exclude<AudienceType, 'multi'>,
    value: string | null
  ): Promise<number> {
    if (type === 'role') {
      const { count, error } = await supabase
        .from('admins')
        .select('id', { count: 'exact', head: true })
        .eq('role', value ?? '')
      if (error) throw error
      return count ?? 0
    }

    let query = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('email', 'is', null)
      .neq('email', '')
      .is('deleted_at', null)

    if (type !== 'all' && value) {
      query = query.eq(type, value)
    }

    const { count, error } = await query
    if (error) throw error
    return count ?? 0
  },

  async deleteNewsletters(ids: string[]): Promise<void> {
    const { error } = await supabase.from('newsletters').delete().in('id', ids)
    if (error) throw error
  },

  async createAndSend(payload: SendNewsletterPayload): Promise<{ sent: number; batches: number }> {
    const { error: insertError } = await supabase.from('newsletters').insert({
      id: payload.newsletter_id,
      subject: payload.subject,
      body_html: payload.body_html,
      audience_type: payload.audience_type,
      audience_value: payload.audience_value,
      audience_filters: payload.audience_filters,
      status: 'sent',
    })
    if (insertError) throw insertError

    const { data, error } = await supabase.functions.invoke('send-newsletter', {
      body: payload,
    })
    if (error) throw error
    return data as { sent: number; batches: number }
  },
}
