// @ts-expect-error: Deno supports URL imports
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const PRIVILEGED_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE'])

export type AdminPermissions = {
  can_post_blog?: boolean
  [key: string]: boolean | undefined
}

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

export function canManageNewsletters(admin: AdminAuthRow | null | undefined): boolean {
  if (!admin) return false
  if (isPrivilegedAdminRole(admin.role)) return true
  return admin.permissions?.can_post_blog === true
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
