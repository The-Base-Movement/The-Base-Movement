import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from '../ITLayoutContext'
import {
  deviceTrackingService,
  type AdminDevice,
  type DeviceActivity,
  type DeviceType,
} from '@/services/deviceTrackingService'

const SLOTS: { type: DeviceType; icon: string; label: string }[] = [
  { type: 'desktop', icon: 'computer', label: 'Laptop / Desktop' },
  { type: 'tablet', icon: 'tablet_mac', label: 'Tablet' },
  { type: 'mobile', icon: 'smartphone', label: 'Mobile' },
]

const ACTION_PILL: Record<string, { cls: string; label: string }> = {
  enrolled: { cls: 'pill-ok', label: 'Enrolled' },
  verified: { cls: 'pill-ok', label: 'Verified' },
  step_up_passed: { cls: 'pill-ok', label: 'Step-up passed' },
  step_up_required: { cls: 'pill-warn', label: 'Step-up required' },
  blocked: { cls: 'pill-err', label: 'Blocked' },
  slot_reset: { cls: 'pill-mute', label: 'Slot reset' },
}

function fmt(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LeadersAuth() {
  const { setCurrentLabel } = usePageLabel()
  useEffect(() => setCurrentLabel('Leaders Auth'), [setCurrentLabel])
  useITLayout(
    'Leaders Auth',
    'verified_user',
    'Registered devices, IP and login activity for privileged admin roles.'
  )

  const [devices, setDevices] = useState<AdminDevice[]>([])
  const [activity, setActivity] = useState<DeviceActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, a] = await Promise.all([
        deviceTrackingService.getDevices(),
        deviceTrackingService.getActivity(100),
      ])
      setDevices(d)
      setActivity(a)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load device data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleReset = async (device: AdminDevice) => {
    if (
      !window.confirm(
        `Reset the ${device.device_type} slot for ${device.admin_name}? They will need to re-register this device on their next login.`
      )
    )
      return
    setResetting(device.id)
    try {
      await deviceTrackingService.resetSlot(device.id)
      toast.success('Device slot reset')
      await load()
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

  const kpis = useMemo(() => {
    const today = new Date().toDateString()
    const loginsToday = activity.filter(
      (a) =>
        (a.action === 'verified' || a.action === 'enrolled') &&
        new Date(a.created_at).toDateString() === today
    ).length
    const alerts = activity.filter(
      (a) => a.action === 'step_up_required' || a.action === 'blocked'
    ).length
    return [
      { label: 'Tracked admins', value: grouped.length, bar: 'hsl(var(--on-surface))' },
      { label: 'Registered devices', value: devices.length, bar: 'hsl(var(--primary))' },
      { label: 'Logins today', value: loginsToday, bar: 'hsl(var(--accent))' },
      { label: 'Alerts', value: alerts, bar: 'hsl(var(--destructive))' },
    ]
  }, [grouped, devices, activity])

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
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
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

      {/* Activity feed */}
      <div className="panel">
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
              Login activity
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Device checks, enrolments and alerts, most recent first.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Admin', 'Device', 'Event', 'IP', 'Location', 'When'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                      borderBottom: '1px solid hsl(var(--border))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 24,
                      color: 'hsl(var(--on-surface-muted))',
                      textAlign: 'center',
                    }}
                  >
                    No activity yet.
                  </td>
                </tr>
              ) : (
                activity.map((a) => {
                  const pill = ACTION_PILL[a.action] ?? { cls: 'pill-mute', label: a.action }
                  return (
                    <tr key={a.id}>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        {a.admin_name}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {a.device_type ?? '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        <span className={`pill ${pill.cls}`}>{pill.label}</span>
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid hsl(var(--border))',
                          fontFamily: 'monospace',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {a.ip_address ?? '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {a.location ?? '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid hsl(var(--border))',
                          whiteSpace: 'nowrap',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {fmt(a.created_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        padding: '3px 0',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
      <span style={{ color: 'hsl(var(--on-surface))', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  )
}
