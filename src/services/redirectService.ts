import { supabase } from '@/lib/supabase'
import type { RedirectRule, RedirectRulePayload, RedirectStatusCode } from '@/types/redirects'

interface RedirectRuleRow {
  id: string
  source_path: string
  destination_path: string
  status_code: RedirectStatusCode
  is_active: boolean
  preserve_query: boolean
  notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

function toRedirectRule(row: RedirectRuleRow): RedirectRule {
  return {
    id: row.id,
    sourcePath: row.source_path,
    destinationPath: row.destination_path,
    statusCode: row.status_code,
    isActive: row.is_active,
    preserveQuery: row.preserve_query,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizePath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

function toRowPayload(payload: RedirectRulePayload, userId?: string) {
  return {
    source_path: normalizePath(payload.sourcePath),
    destination_path: normalizePath(payload.destinationPath),
    status_code: payload.statusCode,
    is_active: payload.isActive,
    preserve_query: payload.preserveQuery,
    notes: payload.notes?.trim() || null,
    updated_by: userId ?? null,
    updated_at: new Date().toISOString(),
  }
}

class RedirectService {
  async getRedirectRules(): Promise<RedirectRule[]> {
    const { data, error } = await supabase
      .from('redirect_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[redirectService] getRedirectRules:', error)
      return []
    }

    return ((data || []) as RedirectRuleRow[]).map(toRedirectRule)
  }

  async createRedirectRule(payload: RedirectRulePayload): Promise<RedirectRule | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const rowPayload = {
      ...toRowPayload(payload, user?.id),
      created_by: user?.id ?? null,
    }

    const { data, error } = await supabase
      .from('redirect_rules')
      .insert(rowPayload)
      .select('*')
      .single()

    if (error) {
      console.warn('[redirectService] createRedirectRule:', error)
      return null
    }

    return toRedirectRule(data as RedirectRuleRow)
  }

  async updateRedirectRule(id: string, payload: RedirectRulePayload): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('redirect_rules')
      .update(toRowPayload(payload, user?.id))
      .eq('id', id)

    if (error) {
      console.warn('[redirectService] updateRedirectRule:', error)
      return false
    }

    return true
  }

  async deleteRedirectRule(id: string): Promise<boolean> {
    const { error } = await supabase.from('redirect_rules').delete().eq('id', id)
    if (error) {
      console.warn('[redirectService] deleteRedirectRule:', error)
      return false
    }
    return true
  }
}

export const redirectService = new RedirectService()
