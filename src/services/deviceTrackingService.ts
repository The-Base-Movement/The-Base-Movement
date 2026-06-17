import { supabase } from '@/lib/supabase'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

// Roles whose devices we bind. Keep in sync with TRACKED_ROLES in the
// capture-admin-device edge function. Add a role here to start tracking it.
export const DEVICE_TRACKED_ROLES = [
  'FOUNDER',
  'FINANCE_OFFICER',
  'EXECUTIVE',
  'SUPER_ADMIN',
  'MOVEMENT_LEADER',
] as const

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

export type DeviceDecision = 'enrolled' | 'verified' | 'step_up_required' | 'blocked'

export interface EvaluateResult {
  tracked: boolean
  decision: DeviceDecision
  device_id?: string
  webauthn_required?: boolean
  /** The fingerprint hash computed for this device (used for step-up rebind). */
  fingerprint_hash?: string
}

export interface AdminDevice {
  id: string
  admin_id: string
  admin_name: string
  role: string
  device_type: DeviceType
  device_name: string | null
  os_type: string | null
  browser: string | null
  ip_address: string | null
  location: string | null
  status: 'active' | 'blocked'
  webauthn_enrolled: boolean
  created_at: string
  last_seen: string
}

export interface DeviceActivity {
  id: string
  admin_id: string | null
  admin_name: string
  device_type: string | null
  action: string
  ip_address: string | null
  location: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ActivityFilter {
  adminId?: string
  action?: string
  limit?: number
  offset?: number
}

/** Actions an activity row can carry — used for the activity feed filter. */
export const DEVICE_ACTIVITY_ACTIONS = [
  'enrolled',
  'verified',
  'step_up_required',
  'step_up_passed',
  'slot_reset',
  'blocked',
] as const

export function isDeviceTrackedRole(role: string | null | undefined): boolean {
  return !!role && (DEVICE_TRACKED_ROLES as readonly string[]).includes(role)
}

// Best-effort device-type detection. Note: a browser cannot reliably tell a
// laptop from a desktop (both report as "desktop"), and iPads often masquerade
// as desktop Safari — so "tablet" is best-effort only.
export function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent
  const isTablet =
    /iPad/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || // iPadOS desktop spoof
    (/Android/.test(ua) && !/Mobile/.test(ua))
  if (isTablet) return 'tablet'
  if (/Mobile|iPhone|Android.+Mobile/i.test(ua)) return 'mobile'
  return 'desktop'
}

function detectOs(): string {
  const ua = navigator.userAgent
  if (/Windows/.test(ua)) return 'Windows'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Mac/.test(ua)) return 'macOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function detectBrowser(): string {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Unknown'
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

let fpPromise: Promise<{ get: () => Promise<{ visitorId: string }> }> | null = null

/**
 * Produces a STABLE fingerprint hash. We hash the FingerprintJS visitorId
 * (designed to survive browser updates) plus the OS — deliberately NOT the full
 * user-agent or any per-visit value, so the same device keeps matching itself.
 */
export async function collectFingerprint(): Promise<string> {
  if (!fpPromise) fpPromise = FingerprintJS.load()
  const fp = await fpPromise
  const { visitorId } = await fp.get()
  return sha256Hex(`${visitorId}|${detectOs()}`)
}

export const deviceTrackingService = {
  /**
   * Runs the enrol-or-validate flow for the current device via the edge
   * function (which supplies the true client IP). Safe to call for any user —
   * non-tracked roles return { tracked: false }.
   */
  async evaluateCurrentDevice(): Promise<EvaluateResult> {
    const fingerprint_hash = await collectFingerprint()
    const device_type = detectDeviceType()
    const { data, error } = await supabase.functions.invoke('capture-admin-device', {
      body: {
        device_type,
        fingerprint_hash,
        device_name: `${detectOs()} ${device_type}`,
        os_type: detectOs(),
        browser: detectBrowser(),
      },
    })
    if (error) throw error
    return { ...(data as EvaluateResult), fingerprint_hash }
  },

  /** IT view: all registered device slots, with the admin's display name. */
  async getDevices(): Promise<AdminDevice[]> {
    const { data, error } = await supabase
      .from('admin_devices')
      .select(
        'id, admin_id, role, device_type, device_name, os_type, browser, ip_address, location, status, webauthn_enrolled, created_at, last_seen'
      )
      .order('last_seen', { ascending: false })
    if (error) throw error
    const rows = data ?? []
    const ids = rows.map((r) => r.admin_id)
    const [names, roles] = await Promise.all([resolveNames(ids), resolveRoles(ids)])
    return rows.map((r) => ({
      ...(r as Omit<AdminDevice, 'admin_name'>),
      // Prefer the admin's CURRENT role over the one snapshotted at enrolment.
      role: roles.get(r.admin_id) ?? r.role,
      admin_name: names.get(r.admin_id) ?? 'Unknown admin',
    }))
  },

  /** IT view: device activity feed, filterable by admin and action, paginated. */
  async getActivity(opts: ActivityFilter = {}): Promise<DeviceActivity[]> {
    const { adminId, action, limit = 25, offset = 0 } = opts
    let query = supabase
      .from('admin_device_activity')
      .select(
        'id, admin_id, device_type, action, ip_address, location, user_agent, metadata, created_at'
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (adminId) query = query.eq('admin_id', adminId)
    if (action) query = query.eq('action', action)

    const { data, error } = await query
    if (error) throw error
    const rows = data ?? []
    const names = await resolveNames(rows.map((r) => r.admin_id).filter(Boolean) as string[])
    return rows.map((r) => ({
      ...(r as Omit<DeviceActivity, 'admin_name'>),
      admin_name: r.admin_id ? (names.get(r.admin_id) ?? 'Unknown admin') : 'System',
    }))
  },

  /**
   * Count of each activity action (optionally for one leader) — powers the
   * activity-breakdown pie chart on the full activity page.
   */
  async getActivityActionCounts(adminId?: string): Promise<Record<string, number>> {
    const entries = await Promise.all(
      DEVICE_ACTIVITY_ACTIONS.map(async (action) => {
        let q = supabase
          .from('admin_device_activity')
          .select('id', { count: 'exact', head: true })
          .eq('action', action)
        if (adminId) q = q.eq('admin_id', adminId)
        const { count } = await q
        return [action, count ?? 0] as const
      })
    )
    return Object.fromEntries(entries)
  },

  /**
   * Fetch every activity row matching a filter (paged internally, capped) for
   * CSV/Excel export. Defaults to a 5,000-row safety cap.
   */
  async getAllActivity(
    filter: { adminId?: string; action?: string } = {},
    max = 5000
  ): Promise<DeviceActivity[]> {
    const pageSize = 1000
    const out: DeviceActivity[] = []
    for (let offset = 0; offset < max; offset += pageSize) {
      const rows = await this.getActivity({ ...filter, limit: pageSize, offset })
      out.push(...rows)
      if (rows.length < pageSize) break
    }
    return out
  },

  /** KPI counts that must stay accurate even when the feed is paginated. */
  async getActivityStats(): Promise<{ loginsToday: number; alerts: number }> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const [logins, alerts] = await Promise.all([
      supabase
        .from('admin_device_activity')
        .select('id', { count: 'exact', head: true })
        .in('action', ['verified', 'enrolled'])
        .gte('created_at', startOfDay.toISOString()),
      supabase
        .from('admin_device_activity')
        .select('id', { count: 'exact', head: true })
        .in('action', ['step_up_required', 'blocked']),
    ])
    return { loginsToday: logins.count ?? 0, alerts: alerts.count ?? 0 }
  },

  /** IT recovery action: clear a device slot so the user can re-enrol. */
  async resetSlot(deviceId: string): Promise<void> {
    const { error } = await supabase.rpc('reset_admin_device_slot', { p_device_id: deviceId })
    if (error) throw error
  },

  /**
   * Enrol a platform biometric (Windows Hello / Face ID / Touch ID) for a device
   * slot. `rebind` + `fingerprintHash` re-bind the slot to a new fingerprint when
   * enrolling during a step-up on a slot that had no passkey yet.
   */
  async enrolBiometric(
    deviceId: string | undefined,
    opts?: { rebind?: boolean; fingerprintHash?: string }
  ): Promise<boolean> {
    const begin = await supabase.functions.invoke('webauthn', {
      body: { action: 'register-begin', device_id: deviceId },
    })
    if (begin.error) throw begin.error
    const attResp = await startRegistration({ optionsJSON: begin.data.options })
    const complete = await supabase.functions.invoke('webauthn', {
      body: {
        action: 'register-complete',
        credential: attResp,
        device_id: deviceId,
        rebind: opts?.rebind ?? false,
        fingerprint_hash: opts?.fingerprintHash,
      },
    })
    if (complete.error) throw complete.error
    return complete.data?.verified === true
  },

  /**
   * Step-up: verify the device's biometric. Returns 'verified' on success,
   * 'needs_enrol' if no passkey exists yet for this admin (caller should enrol),
   * or 'failed'. On success for a known slot the server rebinds the fingerprint.
   */
  async stepUpBiometric(
    deviceId: string,
    fingerprintHash: string
  ): Promise<'verified' | 'needs_enrol' | 'failed'> {
    const begin = await supabase.functions.invoke('webauthn', {
      body: { action: 'authenticate-begin', device_id: deviceId },
    })
    if (begin.error) throw begin.error
    if (begin.data?.noCredentials) return 'needs_enrol'

    const authResp = await startAuthentication({ optionsJSON: begin.data.options })
    const complete = await supabase.functions.invoke('webauthn', {
      body: {
        action: 'authenticate-complete',
        credential: authResp,
        device_id: deviceId,
        fingerprint_hash: fingerprintHash,
      },
    })
    if (complete.error) throw complete.error
    return complete.data?.verified === true ? 'verified' : 'failed'
  },
}

async function resolveNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return new Map()
  const { data } = await supabase.from('users').select('id, full_name').in('id', unique)
  return new Map(
    (data ?? []).map((u) => [u.id as string, (u.full_name as string) ?? 'Unknown admin'])
  )
}

/** Current admin role per id (live), so device cards don't show a stale role. */
async function resolveRoles(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return new Map()
  const { data } = await supabase.from('admins').select('id, role').in('id', unique)
  return new Map((data ?? []).map((a) => [a.id as string, a.role as string]))
}
