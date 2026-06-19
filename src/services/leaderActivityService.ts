import { supabase } from '@/lib/supabase'
import type { DeviceActivity } from './deviceTrackingService'

/**
 * Privileged roles whose every action we capture and surface on the
 * Leaders Auth · All Activity page. Keep in sync with is_leader_role() in
 * migration 20260615160000_leader_activity_feed.sql.
 */
export const LEADER_ROLES = [
  'FOUNDER',
  'SUPER_ADMIN',
  'IT_MANAGER',
  'FINANCE_OFFICER',
  'EXECUTIVE',
] as const

export type LeaderActivityCategory = 'action' | 'device'

/**
 * A unified activity row. It is a superset of DeviceActivity (adds the in-app
 * action fields) so the existing ActivityTable/DetailModal can render both
 * device events and audit-log actions without breaking the device-only summary
 * page, which still passes plain DeviceActivity rows.
 */
export interface LeaderActivityRow extends DeviceActivity {
  source?: LeaderActivityCategory
  resource?: string | null
  status?: string | null
  role?: string | null
}

export interface LeaderActivityFilter {
  adminId?: string
  category?: LeaderActivityCategory
  action?: string
  limit?: number
  offset?: number
}

export interface LeaderAccount {
  admin_id: string
  name: string
  role: string
}

export interface LeaderActivityBucket {
  source: LeaderActivityCategory
  label: string
  value: number
}

interface RpcRow {
  id: string
  source: LeaderActivityCategory
  admin_id: string | null
  admin_name: string | null
  role: string | null
  action: string
  resource: string | null
  status: string | null
  device_type: string | null
  ip_address: string | null
  location: string | null
  isp: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function mapRow(r: RpcRow): LeaderActivityRow {
  return {
    id: r.id,
    source: r.source,
    admin_id: r.admin_id,
    admin_name: r.admin_name ?? 'Unknown leader',
    role: r.role,
    action: r.action,
    resource: r.resource,
    status: r.status,
    device_type: r.device_type,
    ip_address: r.ip_address,
    location: r.location,
    isp: r.isp,
    user_agent: r.user_agent,
    metadata: r.metadata,
    created_at: r.created_at,
  }
}

export const leaderActivityService = {
  /** Paginated, filterable unified feed (in-app actions + device/auth events). */
  async getActivity(filter: LeaderActivityFilter = {}): Promise<LeaderActivityRow[]> {
    const { adminId, category, action, limit = 25, offset = 0 } = filter
    const { data, error } = await supabase.rpc('get_leader_activity', {
      p_admin: adminId ?? null,
      p_category: category ?? null,
      p_action: action ?? null,
      p_limit: limit,
      p_offset: offset,
    })
    if (error) throw error
    return ((data ?? []) as RpcRow[]).map(mapRow)
  },

  /** Every row matching a filter (paged internally) for CSV export. */
  async getAllActivity(
    filter: Omit<LeaderActivityFilter, 'limit' | 'offset'> = {},
    max = 5000
  ): Promise<LeaderActivityRow[]> {
    const pageSize = 1000
    const out: LeaderActivityRow[] = []
    for (let offset = 0; offset < max; offset += pageSize) {
      const rows = await this.getActivity({ ...filter, limit: pageSize, offset })
      out.push(...rows)
      if (rows.length < pageSize) break
    }
    return out
  },

  /** Event-type breakdown for the pie chart + KPI derivation. */
  async getBreakdown(adminId?: string): Promise<LeaderActivityBucket[]> {
    const { data, error } = await supabase.rpc('get_leader_activity_breakdown', {
      p_admin: adminId ?? null,
    })
    if (error) throw error
    return ((data ?? []) as { source: LeaderActivityCategory; label: string; value: number }[]).map(
      (b) => ({ source: b.source, label: b.label, value: Number(b.value) })
    )
  },

  /** All privileged accounts (for the filter dropdown), even with no activity. */
  async getAccounts(): Promise<LeaderAccount[]> {
    const { data, error } = await supabase.rpc('get_leader_accounts')
    if (error) throw error
    return (data ?? []) as LeaderAccount[]
  },
}
