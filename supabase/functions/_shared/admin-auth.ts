// @ts-expect-error: Deno supports URL imports
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const PRIVILEGED_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE'])

export type AdminPermission = {
  action: string
  resource: string
}

export type LegacyAdminPermissions = {
  can_manage_members?: boolean
  can_post_blog?: boolean
  can_manage_newsletters?: boolean
  can_manage_donations?: boolean
  can_manage_store?: boolean
  can_view_audit_logs?: boolean
  [key: string]: boolean | undefined
}

export type AdminPermissions = AdminPermission[] | LegacyAdminPermissions

export interface AdminAuthRow {
  id: string
  role: string | null
  permissions: AdminPermissions | null
}

export function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

export function isPrivilegedAdminRole(role: string | null | undefined): boolean {
  return typeof role === 'string' && PRIVILEGED_ROLES.has(role.toUpperCase())
}

const legacyPermissionFlags: Record<string, keyof LegacyAdminPermissions> = {
  'VERIFY_MEMBER:MEMBERS': 'can_manage_members',
  'MANAGE_NEWSLETTERS:NEWSLETTERS': 'can_manage_newsletters',
  'MANAGE_DONATIONS:DONATIONS': 'can_manage_donations',
  'MANAGE_INVENTORY:STORE': 'can_manage_store',
  'VIEW_AUDIT_LOGS:SYSTEM': 'can_view_audit_logs',
}

export function hasAdminPermission(
  admin: AdminAuthRow | null | undefined,
  permission: AdminPermission
): boolean {
  if (!admin) return false
  if (isPrivilegedAdminRole(admin.role)) return true

  if (Array.isArray(admin.permissions)) {
    return admin.permissions.some(
      (granted) => granted.action === permission.action && granted.resource === permission.resource
    )
  }

  const legacyFlag = legacyPermissionFlags[`${permission.action}:${permission.resource}`]
  return legacyFlag ? admin.permissions?.[legacyFlag] === true : false
}

export const canManageNewsletters = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'MANAGE_NEWSLETTERS', resource: 'NEWSLETTERS' })

export const canManageMembers = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'VERIFY_MEMBER', resource: 'MEMBERS' })

export const canManageDonations = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' })

export const canManageStore = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'MANAGE_INVENTORY', resource: 'STORE' })

export const canViewAuditLogs = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' })

export function requireServiceRoleCall(
  req: Request,
  serviceRoleKey: string | undefined | null
): { ok: true } | { ok: false; response: Response } {
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!serviceRoleKey) {
    return { ok: false, response: json({ error: 'Service role key is not configured.' }, 500) }
  }

  if (!jwt) {
    return { ok: false, response: json({ error: 'Not authenticated.' }, 401) }
  }

  if (jwt !== serviceRoleKey) {
    return { ok: false, response: json({ error: 'Not authorized.' }, 403) }
  }

  return { ok: true }
}

export async function requireAuthorizedAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
  authorize: (admin: AdminAuthRow) => boolean,
  options: { allowServiceRole?: boolean; serviceRoleKey?: string } = {}
): Promise<
  | { ok: true; admin: AdminAuthRow | null; callerUserId: string | null; viaServiceRole: boolean }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) {
    return { ok: false, response: json({ error: 'Not authenticated.' }, 401) }
  }

  if (options.allowServiceRole && options.serviceRoleKey && jwt === options.serviceRoleKey) {
    return { ok: true, admin: null, callerUserId: null, viaServiceRole: true }
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(jwt)

  if (userError || !user) {
    return { ok: false, response: json({ error: 'Not authenticated.' }, 401) }
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from('admins')
    .select('id, role, permissions')
    .eq('id', user.id)
    .maybeSingle()

  if (adminError || !adminRow) {
    return { ok: false, response: json({ error: 'Not authorized.' }, 403) }
  }

  const normalizedAdmin = adminRow as AdminAuthRow
  if (!authorize(normalizedAdmin)) {
    return { ok: false, response: json({ error: 'Not authorized.' }, 403) }
  }

  return {
    ok: true,
    admin: normalizedAdmin,
    callerUserId: user.id,
    viaServiceRole: false,
  }
}

/**
 * Resolves the SendGrid sender email dynamically.
 * Resolves in order:
 * 1. SENDER_EMAIL environment variable
 * 2. site_settings table (key: newsletter_email)
 * 3. fallback to 'noreply@thebasemovement.org.gh'
 */
export async function getSenderEmail(supabaseAdmin: SupabaseClient): Promise<string> {
  // @ts-expect-error: Deno supports Deno.env
  let senderEmail = Deno.env.get('SENDER_EMAIL')
  if (!senderEmail) {
    const { data: emailSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'newsletter_email')
      .maybeSingle()
    if (emailSetting?.value) {
      senderEmail = emailSetting.value
    }
  }
  return senderEmail || 'noreply@thebasemovement.org.gh'
}
