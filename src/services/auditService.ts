import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import type { AuditLogEntry, ActivityLog } from '@/types/admin'

class AuditService {
  private static instance: AuditService

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  async logAction(
    action: string,
    resource: string,
    status: 'Success' | 'Failure' | 'Warning' = 'Success',
    details?: Record<string, unknown>
  ): Promise<void> {
    const user = authService.getUser()
    try {
      await supabase.from('audit_logs').insert({
        action,
        resource,
        status,
        metadata: details,
        admin_id: user?.id,
      })
    } catch (error) {
      console.error('[DATABASE] Failed to persist log:', error)
    }
  }

  async getSystemAuditLogs(): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('system_audit_logs_view')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error || !Array.isArray(data)) {
      console.warn('[DATABASE] Audit logs fetch failed:', error)
      return []
    }

    interface ViewAuditLog {
      id: string
      timestamp: string
      admin_id: string | null
      action: string
      resource: string
      status: 'Success' | 'Failure' | 'Warning'
      metadata: Record<string, unknown>
      admin_name: string | null
      ip_address: string | null
      target_name: string | null
    }

    return (data as unknown as ViewAuditLog[]).map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminId: log.admin_id || 'SYS',
      adminName: log.admin_name || (log.admin_id ? 'Authorized Officer' : 'National HQ'),
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.metadata,
      ipAddress: log.ip_address || 'N/A',
      targetName: log.target_name || undefined,
    }))
  }

  async getAuditLogsForResource(resourceId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('system_audit_logs_view')
      .select('*')
      .eq('resource', resourceId)
      .order('timestamp', { ascending: false })

    if (error || !Array.isArray(data)) {
      console.warn('[DATABASE] Resource audit fetch failed:', error)
      return []
    }

    interface ViewAuditLog {
      id: string
      timestamp: string
      admin_id: string | null
      action: string
      resource: string
      status: 'Success' | 'Failure' | 'Warning'
      metadata: Record<string, unknown>
      admin_name: string | null
      ip_address: string | null
      target_name: string | null
    }

    return (data as unknown as ViewAuditLog[]).map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminId: log.admin_id || 'SYS',
      adminName: log.admin_name || (log.admin_id ? 'Authorized Officer' : 'National HQ'),
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.metadata,
      ipAddress: log.ip_address || 'N/A',
      targetName: log.target_name || undefined,
    }))
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    const logs = await this.getSystemAuditLogs()
    return logs.slice(0, 10).map((log, index) => ({
      id: index,
      type: log.resource.toLowerCase().includes('member') ? 'registration' : 'security',
      user: log.adminName,
      time: new Date(log.timestamp).toLocaleTimeString(),
      details: `${log.action} on ${log.resource}`,
      icon: log.status === 'Success' ? '✓' : '!',
      color: log.status === 'Success' ? 'var(--brand-green)' : 'var(--brand-gold)',
    }))
  }
}

export const auditService = AuditService.getInstance()
