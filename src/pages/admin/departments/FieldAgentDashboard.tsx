import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useIsMobile } from '@/hooks/use-mobile'

interface AssignmentInfo {
  region: string | null
  constituency: string
}

export default function FieldAgentDashboard() {
  const isMobile = useIsMobile()
  const { isOnline, draftCount, isSyncing, drafts, triggerSync } = useOfflineSync()
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const user = adminService.getCurrentUser()
        if (!user) return

        const [agents, members] = await Promise.all([
          adminService.getFieldAgents(),
          adminService.getMembers(),
        ])

        const myAssignment = agents.find((a) => a.member_id === user.id)
        if (myAssignment) {
          setAssignment({ region: myAssignment.region, constituency: myAssignment.constituency })
        }

        const pending = members.filter((m) => m.status === 'Pending')
        setPendingVerifications(pending.length)
        setTotalMembers(members.length)
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const kpis = [
    {
      label: 'Pending Sync',
      value: draftCount,
      bar: draftCount > 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
    },
    { label: 'KYC Queue', value: pendingVerifications, bar: 'hsl(var(--accent))' },
    { label: 'Total Members', value: totalMembers, bar: 'hsl(var(--primary))' },
    {
      label: 'Connection',
      value: isOnline ? 'Online' : 'Offline',
      bar: isOnline ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
    },
  ]

  const actions = [
    {
      to: '/register',
      icon: 'person_add',
      label: 'Register New Member',
      color: 'hsl(var(--primary))',
    },
    {
      to: '/admin/verification',
      icon: 'verified_user',
      label: 'KYC Queue',
      color: 'hsl(var(--accent))',
    },
    {
      to: '/admin/members',
      icon: 'group',
      label: 'Member Directory',
      color: 'hsl(var(--on-surface))',
    },
    { to: '/admin/chapters', icon: 'groups', label: 'Chapters', color: 'hsl(var(--primary))' },
  ]

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <AdminPageHeader
        title="Field Agent Dashboard"
        icon="directions_walk"
        description={
          assignment
            ? `Assigned to ${assignment.constituency}${assignment.region ? `, ${assignment.region}` : ''}`
            : 'Ground operations — member registration & verification'
        }
      />

      {/* ── KPI tiles ── */}
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
              {loading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Offline Sync Panel ── */}
      {draftCount > 0 && (
        <div
          className="panel"
          style={{
            marginBottom: 24,
            padding: 20,
            border: isOnline
              ? '1px solid hsl(var(--primary) / 0.3)'
              : '1px solid hsl(var(--accent) / 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 24,
                  color: isOnline ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                }}
              >
                {isSyncing ? 'sync' : 'cloud_upload'}
              </span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {isSyncing
                    ? 'Syncing registrations…'
                    : `${draftCount} registration${draftCount > 1 ? 's' : ''} pending sync`}
                </p>
                <p
                  style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}
                >
                  {isOnline
                    ? 'You are online. Tap sync to upload now.'
                    : 'You are offline. Registrations will sync when connection is restored.'}
                </p>
              </div>
            </div>
            {isOnline && !isSyncing && (
              <button className="btn btn-primary btn-sm" onClick={triggerSync}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  sync
                </span>
                Sync Now
              </button>
            )}
          </div>

          {/* Draft list */}
          {drafts.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {drafts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--container-low))',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                    >
                      person
                    </span>
                    <span style={{ color: 'hsl(var(--on-surface))' }}>
                      {d.formData.fullName || 'Unnamed'}
                    </span>
                  </div>
                  <span
                    className={`pill ${d.status === 'failed' ? 'pill-err' : d.status === 'syncing' ? 'pill-warn' : 'pill-mute'}`}
                  >
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '20px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = a.color)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `${a.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: a.color }}>
                {a.icon}
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                textAlign: 'center',
              }}
            >
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Connection Status ── */}
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isOnline ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
              flexShrink: 0,
            }}
          />
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
            {isOnline
              ? 'Connected — registrations will save directly to the server.'
              : 'Offline mode — registrations are saved locally and will sync automatically when connection is restored.'}
          </p>
        </div>
      </div>
    </div>
  )
}
