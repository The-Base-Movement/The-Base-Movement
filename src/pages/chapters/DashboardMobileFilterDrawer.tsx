import { DashboardFilterControls } from './DashboardFilterControls'
import type { DashboardFilterControlsProps } from './DashboardFilterControls'

interface DashboardMobileFilterDrawerProps extends DashboardFilterControlsProps {
  onClose: () => void
  onRequestChapter: () => void
}

export function DashboardMobileFilterDrawer({
  onClose,
  onRequestChapter,
  ...filterProps
}: DashboardMobileFilterDrawerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          width: 300,
          height: '100%',
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Filters
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
            >
              close
            </span>
          </button>
        </div>
        <DashboardFilterControls {...filterProps} onRequestChapter={onRequestChapter} />
      </div>
    </div>
  )
}
