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
  /** The fingerprint hash computed for this device (used for verification logs). */
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

  /**
   * Sensitive admin actions must prove possession of the enrolled platform
   * authenticator before the mutation is allowed to complete.
   */
  async verifySensitiveActionBiometric(): Promise<void> {
    const result = await this.evaluateCurrentDevice()
    if (!result.tracked) return
    if (result.decision === 'blocked' || result.decision === 'step_up_required') {
      throw new Error('This device is blocked for your account.')
    }
    if (!result.device_id || !result.fingerprint_hash) {
      throw new Error('This device could not be verified for biometric approval.')
    }

    if (result.webauthn_required) {
      const enrolled = await this.enrolBiometric(result.device_id, {
        rebind: false,
        fingerprintHash: result.fingerprint_hash,
      })
      if (!enrolled) throw new Error('Biometric verification failed.')
      return
    }

    const outcome = await this.stepUpBiometric(result.device_id, result.fingerprint_hash)
    if (outcome === 'verified') return
    if (outcome === 'needs_enrol') {
      const enrolled = await this.enrolBiometric(result.device_id, {
        rebind: false,
        fingerprintHash: result.fingerprint_hash,
      })
      if (enrolled) return
    }
    throw new Error('Biometric verification failed.')
  },

  /** IT view: all registered device slots, with the admin's display name. */
  async getDevices(): Promise<AdminDevice[]> {
    const { data, error } = await supabase.rpc('get_admin_device_rows')
    if (error) throw error
    const rows = (data ?? []) as AdminDevice[]
    const ids = rows.map((r: AdminDevice) => r.admin_id)
    const [names, roles] = await Promise.all([resolveNames(ids), resolveRoles(ids)])
    return rows.map((r: AdminDevice) => ({
      ...(r as Omit<AdminDevice, 'admin_name'>),
      // Prefer the admin's CURRENT role over the one snapshotted at enrolment.
      role: roles.get(r.admin_id) ?? r.role,
      admin_name: names.get(r.admin_id) ?? 'Unknown admin',
    }))
  },

  /** IT view: device activity feed, filterable by admin and action, paginated. */
  async getActivity(opts: ActivityFilter = {}): Promise<DeviceActivity[]> {
    const { adminId, action, limit = 25, offset = 0 } = opts
    const { data, error } = await supabase.rpc('get_admin_device_activity_rows', {
      p_admin_id: adminId ?? null,
      p_action: action ?? null,
      p_limit: limit,
      p_offset: offset,
    })
    if (error) throw error
    return (data ?? []) as DeviceActivity[]
  },

  /**
   * Count of each activity action (optionally for one leader) — powers the
   * activity-breakdown pie chart on the full activity page.
   */
  async getActivityActionCounts(adminId?: string): Promise<Record<string, number>> {
    const { data, error } = await supabase.rpc('get_admin_device_activity_counts', {
      p_admin_id: adminId ?? null,
    })
    if (error) throw error

    const out = Object.fromEntries(DEVICE_ACTIVITY_ACTIONS.map((action) => [action, 0]))
    for (const row of (data ?? []) as { action: string; total: number }[]) {
      out[row.action] = Number(row.total) || 0
    }
    return out
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
    const { data, error } = await supabase.rpc('get_admin_device_activity_stats')
    if (error) throw error
    const row = (data?.[0] ?? { logins_today: 0, alerts: 0 }) as {
      logins_today: number
      alerts: number
    }
    return {
      loginsToday: Number(row.logins_today) || 0,
      alerts: Number(row.alerts) || 0,
    }
  },

  /** IT recovery action: clear a device slot so the user can re-enrol. */
  async resetSlot(deviceId: string): Promise<void> {
    const { error } = await supabase.rpc('reset_admin_device_slot', { p_device_id: deviceId })
    if (error) throw error
  },

  /**
   * Enrol a platform biometric (Windows Hello / Face ID / Touch ID) for a device
   * slot. The fingerprint hash is forwarded so the backend can log which device
   * completed the verification ceremony.
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
   * or 'failed'. On success the server records a fresh verification event.
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
