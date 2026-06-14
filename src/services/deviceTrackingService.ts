import { supabase } from '@/lib/supabase'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

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
  created_at: string
}

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
    return data as EvaluateResult
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
    const names = await resolveNames(rows.map((r) => r.admin_id))
    return rows.map((r) => ({
      ...(r as Omit<AdminDevice, 'admin_name'>),
      admin_name: names.get(r.admin_id) ?? 'Unknown admin',
    }))
  },

  /** IT view: recent device activity feed. */
  async getActivity(limit = 100): Promise<DeviceActivity[]> {
    const { data, error } = await supabase
      .from('admin_device_activity')
      .select('id, admin_id, device_type, action, ip_address, location, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    const rows = data ?? []
    const names = await resolveNames(rows.map((r) => r.admin_id).filter(Boolean) as string[])
    return rows.map((r) => ({
      ...(r as Omit<DeviceActivity, 'admin_name'>),
      admin_name: r.admin_id ? (names.get(r.admin_id) ?? 'Unknown admin') : 'System',
    }))
  },

  /** IT recovery action: clear a device slot so the user can re-enrol. */
  async resetSlot(deviceId: string): Promise<void> {
    const { error } = await supabase.rpc('reset_admin_device_slot', { p_device_id: deviceId })
    if (error) throw error
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
