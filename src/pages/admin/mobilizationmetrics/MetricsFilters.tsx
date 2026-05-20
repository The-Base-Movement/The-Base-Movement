import { pillBase } from './utils'

interface MetricsFiltersProps {
  regions: string[]
  regionFilter: string
  setRegionFilter: (r: string) => void
}

export function MetricsFilters({ regions, regionFilter, setRegionFilter }: MetricsFiltersProps) {
  return (
    <div
      className="panel"
      style={{
        padding: '14px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 800,
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
          flexShrink: 0,
        }}
      >
        Region:
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            style={{
              ...pillBase,
              cursor: 'pointer',
              border: 'none',
              ...(regionFilter === r
                ? { background: 'hsl(var(--primary))', color: '#fff' }
                : {
                    background: 'hsl(var(--container-low))',
                    color: 'hsl(var(--on-surface-muted))',
                    border: '1px solid hsl(var(--border))',
                  }),
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
