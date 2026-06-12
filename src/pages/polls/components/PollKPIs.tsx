import type { Poll } from '@/types/admin'

interface PollKPIsProps {
  loading: boolean
  activePolls: Poll[]
  closedPolls: Poll[]
  totalVotes: number
  polls: Poll[]
  isDashboard: boolean
}

export function PollKPIs({
  loading,
  activePolls,
  closedPolls,
  totalVotes,
  polls,
  isDashboard,
}: PollKPIsProps) {
  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      {[
        {
          label: 'Active polls',
          value: loading ? '—' : activePolls.length,
          sub: 'Open for voting',
          bar: 'hsl(var(--primary))',
          icon: 'how_to_vote',
        },
        {
          label: 'Total responses',
          value: loading ? '—' : totalVotes.toLocaleString(),
          sub: 'Across all polls',
          bar: 'hsl(var(--accent))',
          icon: 'group',
        },
        {
          label: 'Closed polls',
          value: loading ? '—' : closedPolls.length,
          sub: 'Results available',
          bar: 'hsl(var(--on-surface))',
          icon: 'lock',
        },
        {
          label: 'Your votes',
          value: loading ? '—' : polls.filter((p) => p.voted).length,
          sub: 'Participation count',
          bar: 'hsl(var(--destructive))',
          icon: 'verified',
        },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="panel"
          style={{
            padding: isDashboard ? '16px 18px 16px 22px' : '20px 22px 20px 26px',
            position: 'relative',
            overflow: 'hidden',
            background: isDashboard ? undefined : 'hsl(var(--background))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: isDashboard ? 3 : 4,
              background: kpi.bar,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: isDashboard ? 10 : 12,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {kpi.label}
            </span>
            <span
              className="material-symbols-outlined desktop-only"
              style={{
                fontSize: isDashboard ? 16 : 20,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.4,
              }}
            >
              {kpi.icon}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: isDashboard ? 28 : 36,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            {kpi.value}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: isDashboard ? 11 : 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
