import { BrandLine } from '@/components/ui/BrandLine'

interface Props {
  onResetDefaults: () => void
  onCreate: () => void
}

export default function PlanManagerHeader({ onResetDefaults, onCreate }: Props) {
  return (
    <div
      className="top"
      style={{
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 0,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 6,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            route
          </span>
          Mission Plan Manager
        </h2>
        <div style={{ marginTop: 10, marginBottom: 4 }}>
          <BrandLine />
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12.5,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Manage the strategic plan pillars, key summaries, specific objectives, and actionable
          checklist points.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button className="btn btn-outline btn-sm" onClick={onResetDefaults}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            database
          </span>
          Seed Defaults
        </button>
        <button className="btn btn-primary btn-sm" onClick={onCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            add
          </span>
          Create Pillar
        </button>
      </div>
    </div>
  )
}
