import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from '../ITLayoutContext'
import {
  deviceTrackingService,
  type AdminDevice,
  type DeviceActivity,
  type DeviceType,
} from '@/services/deviceTrackingService'
import { ActivityTable, DetailModal, Row } from './activityComponents'
import { fmt } from './shared'

const SLOTS: { type: DeviceType; icon: string; label: string }[] = [
  { type: 'desktop', icon: 'computer', label: 'Laptop / Desktop' },
  { type: 'tablet', icon: 'tablet_mac', label: 'Tablet' },
  { type: 'mobile', icon: 'smartphone', label: 'Mobile' },
]

/** Activities shown on the summary page before "View all activities". */
const RECENT_LIMIT = 10

export default function LeadersAuth() {
  const navigate = useNavigate()
  const { setCurrentLabel } = usePageLabel()
  useEffect(() => setCurrentLabel('Leaders Auth'), [setCurrentLabel])
  useITLayout(
    'Leaders Auth',
    'verified_user',
    'Registered devices, IP and login activity for privileged admin roles.'
  )

  const [devices, setDevices] = useState<AdminDevice[]>([])
  const [stats, setStats] = useState({ loginsToday: 0, alerts: 0 })
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState<string | null>(null)

  const [activity, setActivity] = useState<DeviceActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [detail, setDetail] = useState<DeviceActivity | null>(null)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    try {
      const [d, s] = await Promise.all([
        deviceTrackingService.getDevices(),
        deviceTrackingService.getActivityStats(),
      ])
      setDevices(d)
      setStats(s)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load device data')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    setActivityLoading(true)
    try {
      const rows = await deviceTrackingService.getActivity({ limit: RECENT_LIMIT })
      setActivity(rows)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevices()
    loadActivity()
  }, [loadDevices, loadActivity])

  const handleReset = async (device: AdminDevice) => {
    if (
      !window.confirm(
        `Reset the ${device.device_type} slot for ${device.admin_name}? They will need to re-register this device on their next login.`
      )
    )
      return

    const disableMfa = window.confirm(
      `Also disable MFA for ${device.admin_name}? This will remove their verified TOTP/passkey factors and force a fresh setup.`
    )

    setResetting(device.id)
    try {
      await deviceTrackingService.resetSlot(device.id, disableMfa)
      toast.success(
        disableMfa ? 'Device slot reset and MFA disabled' : 'Device slot reset'
      )
      await Promise.all([loadDevices(), loadActivity()])
    } catch (err) {
      console.error(err)
      toast.error('Failed to reset device slot')
    } finally {
      setResetting(null)
    }
  }

  // Group devices by admin.
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; role: string; devices: AdminDevice[] }>()
    for (const d of devices) {
      if (!map.has(d.admin_id))
        map.set(d.admin_id, { name: d.admin_name, role: d.role, devices: [] })
      map.get(d.admin_id)!.devices.push(d)
    }
    return [...map.entries()].map(([admin_id, v]) => ({ admin_id, ...v }))
  }, [devices])

  const kpis = [
    { label: 'Tracked admins', value: grouped.length, bar: 'hsl(var(--on-surface))' },
    { label: 'Registered devices', value: devices.length, bar: 'hsl(var(--primary))' },
    { label: 'Logins today', value: stats.loginsToday, bar: 'hsl(var(--accent))' },
    { label: 'Alerts', value: stats.alerts, bar: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="main">
      {/* KPI tiles */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Registered devices, grouped by admin */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="ph">
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Registered devices
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Three device slots per leader — laptop, tablet and mobile.
            </p>
          </div>
        </div>

        <div style={{ padding: '8px 16px 16px' }}>
          {loading ? (
            <p style={{ padding: 24, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
              Loading…
            </p>
          ) : grouped.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
              No devices registered yet. Slots fill automatically on each leader’s first admin
              login.
            </p>
          ) : (
            grouped.map((g) => (
              <div
                key={g.admin_id}
                style={{ padding: '14px 0', borderBottom: '1px solid hsl(var(--border))' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {g.name}
                  </span>
                  <span className="pill pill-mute">{g.role}</span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 12,
                  }}
                >
                  {SLOTS.map((slot) => {
                    const d = g.devices.find((x) => x.device_type === slot.type)
                    return (
                      <div
                        key={slot.type}
                        style={{
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius-md)',
                          padding: 14,
                          background: d ? 'hsl(var(--card))' : 'hsl(var(--container-low))',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 20,
                              color: d ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {slot.icon}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {slot.label}
                          </span>
                          {d && (
                            <span
                              className={`pill ${d.status === 'blocked' ? 'pill-err' : 'pill-ok'}`}
                              style={{ marginLeft: 'auto' }}
                            >
                              {d.status === 'blocked' ? 'Blocked' : 'Active'}
                            </span>
                          )}
                        </div>

                        {d ? (
                          <>
                            <Row
                              label="OS / Browser"
                              value={`${d.os_type ?? '—'} · ${d.browser ?? '—'}`}
                            />
                            <Row label="IP" value={d.ip_address ?? '—'} />
                            <Row label="Location" value={d.location ?? '—'} />
                            <Row label="Last seen" value={fmt(d.last_seen)} />
                            <Row
                              label="Biometric"
                              value={d.webauthn_enrolled ? 'Enrolled' : 'Not set'}
                            />
                            <button
                              className="btn btn-outline-dest btn-sm"
                              style={{ marginTop: 10, width: '100%' }}
                              disabled={resetting === d.id}
                              onClick={() => handleReset(d)}
                            >
                              {resetting === d.id ? 'Resetting…' : 'Reset slot'}
                            </button>
                          </>
                        ) : (
                          <p
                            style={{
                              margin: '6px 0 0',
                              fontSize: 12,
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            Empty — captured on first login from this device type.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent activity (latest 10) */}
      <div className="panel">
        <div className="ph" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'center', rowGap: 12 }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Recent activity
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              The latest {RECENT_LIMIT} device checks, enrolments and alerts.
            </p>
          </div>

          <button
            className="btn btn-outline btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/admin/it-department/leaders-auth/activity')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              history
            </span>
            View all activities
          </button>
        </div>

        <ActivityTable
          rows={activity}
          loading={activityLoading}
          emptyText="No activity yet."
          onView={setDetail}
        />

        {activityLoading && (
          <div style={{ padding: '14px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>Loading…</span>
          </div>
        )}
      </div>

      {detail && <DetailModal entry={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
