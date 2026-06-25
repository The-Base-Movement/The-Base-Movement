import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { referralService } from '@/services/referralService'

interface Stats {
  totalReferrals: number
  totalPointsAwarded: number
  topReferrers: {
    id: string
    name: string
    avatarUrl: string | null
    regNo: string
    count: number
    points: number
  }[]
  monthlyTrend: { month: string; count: number }[]
}

export default function ReferralAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    referralService
      .getAdminReferralStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, bar: 'hsl(var(--primary))' },
    {
      label: 'Points Awarded',
      value: stats?.totalPointsAwarded ?? 0,
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Top Referrers',
      value: stats?.topReferrers.length ?? 0,
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'This Month',
      value: stats?.monthlyTrend.at(-1)?.count ?? 0,
      bar: 'hsl(var(--primary))',
    },
  ]

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <AdminPageHeader
        title="Referral Analytics"
        icon="share"
        description="Track member referrals, points, and top recruiters."
      />

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
              {loading ? '—' : kpi.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly Trend Chart */}
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
              Referral trend
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              New referrals per month over the last 12 months.
            </p>
          </div>
        </div>
        <div style={{ padding: '12px 20px 20px', height: 260 }}>
          {!loading && stats && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--on-surface-muted))' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--on-surface-muted))' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                  name="Referrals"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Referrers Leaderboard */}
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
              Top referrers
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Members driving the most registrations through their referral links.
            </p>
          </div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
          >
            leaderboard
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['#', 'Member', 'Reg No', 'Referrals', 'Points'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 16px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : !stats?.topReferrers.length ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    No referrals yet.
                  </td>
                </tr>
              ) : (
                stats.topReferrers.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: idx < 3 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {r.avatarUrl ? (
                          <img
                            src={r.avatarUrl}
                            alt=""
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: 'hsl(var(--container-low))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {r.name.charAt(0)}
                          </div>
                        )}
                        <span style={{ color: 'hsl(var(--on-surface))' }}>{r.name}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        color: 'hsl(var(--on-surface-muted))',
                        fontSize: 12,
                      }}
                    >
                      {r.regNo}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {r.count}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'hsl(var(--accent))' }}>
                      {r.points.toLocaleString()} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
