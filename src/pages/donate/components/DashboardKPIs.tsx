interface DashboardKPIsProps {
  globalStats: { totalMembers: number; totalRaised: number }
  campaigns: { id: string }[]
  personalHistory: { id: string }[]
  loading: boolean
}

export function DashboardKPIs({
  globalStats,
  campaigns,
  personalHistory,
  loading,
}: DashboardKPIsProps) {
  const kpis = [
    {
      label: 'Movement Reserves',
      value: `₵ ${globalStats.totalRaised.toLocaleString()}`,
      icon: 'account_balance_wallet',
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Total Contributors',
      value: globalStats.totalMembers.toLocaleString(),
      icon: 'group',
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Active Campaigns',
      value: loading ? '—' : campaigns.length.toString(),
      icon: 'campaign',
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'My Contributions',
      value: loading ? '—' : personalHistory.length.toString(),
      icon: 'volunteer_activism',
      bar: 'hsl(var(--destructive))',
    },
  ]

  return (
    <div className="kpis">
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              {kpi.label}
            </p>
            <span
              className="material-symbols-outlined desktop-only"
              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
            >
              {kpi.icon}
            </span>
          </div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {loading ? '—' : kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
