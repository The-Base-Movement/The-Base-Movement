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

interface AgentStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
}

interface LeaderboardEntry {
  agentId: string
  agentName: string
  avatarUrl: string | null
  count: number
}

export default function FieldAgentDashboard() {
  const isMobile = useIsMobile()
  const { isOnline, draftCount, isSyncing, drafts, triggerSync } = useOfflineSync()
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [myStats, setMyStats] = useState<AgentStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const user = adminService.getCurrentUser()
        if (!user) return

        const [agents, members, stats, board] = await Promise.all([
          adminService.getFieldAgents(),
          adminService.getMembers(),
          adminService.getFieldAgentStats(user.id),
          adminService.getFieldAgentLeaderboard(),
        ])

        const myAssignment = agents.find((a) => a.member_id === user.id)
        if (myAssignment) {
          setAssignment({ region: myAssignment.region, constituency: myAssignment.constituency })
        }

        const pending = members.filter((m) => m.status === 'Pending')
        setPendingVerifications(pending.length)
        setMyStats(stats)
        setLeaderboard(board)
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const kpis = [
    { label: 'Registered Today', value: myStats?.today ?? 0, bar: 'hsl(var(--primary))' },
    { label: 'This Week', value: myStats?.thisWeek ?? 0, bar: 'hsl(var(--accent))' },
    { label: 'This Month', value: myStats?.thisMonth ?? 0, bar: 'hsl(var(--on-surface))' },
    { label: 'All Time', value: myStats?.total ?? 0, bar: 'hsl(var(--primary))' },
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
    { to: '/admin/chapters', icon: 'groups', label: 'Diaspora', color: 'hsl(var(--primary))' },
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

      {/* ── Operational Stats ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          className="panel"
          style={{
            flex: 1,
            minWidth: 120,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 20,
              color: draftCount > 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
            }}
          >
            cloud_upload
          </span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Pending Sync
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {draftCount}
            </p>
          </div>
        </div>
        <div
          className="panel"
          style={{
            flex: 1,
            minWidth: 120,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
          >
            verified_user
          </span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              KYC Queue
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {loading ? '—' : pendingVerifications}
            </p>
          </div>
        </div>
        <div
          className="panel"
          style={{
            flex: 1,
            minWidth: 120,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isOnline ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Status
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Agent Leaderboard ── */}
      {leaderboard.length > 0 && (
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
                Agent leaderboard
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                Total members registered by each field agent.
              </p>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
            >
              leaderboard
            </span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {leaderboard.map((entry, idx) => {
              const isMeEntry = entry.agentId === adminService.getCurrentUser()?.id
              return (
                <div
                  key={entry.agentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom:
                      idx < leaderboard.length - 1 ? '1px solid hsl(var(--border))' : undefined,
                    background: isMeEntry ? 'hsl(var(--primary) / 0.04)' : undefined,
                    borderRadius: isMeEntry ? 'var(--radius-sm)' : undefined,
                    paddingLeft: isMeEntry ? 12 : undefined,
                    paddingRight: isMeEntry ? 12 : undefined,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: idx < 3 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {idx + 1}
                  </span>
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {entry.agentName.charAt(0)}
                    </div>
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: isMeEntry ? 'var(--font-weight-medium, 500)' : undefined,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {entry.agentName}
                    {isMeEntry && (
                      <span style={{ fontSize: 11, color: 'hsl(var(--primary))', marginLeft: 6 }}>
                        (You)
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: idx === 0 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface))',
                    }}
                  >
                    {entry.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
