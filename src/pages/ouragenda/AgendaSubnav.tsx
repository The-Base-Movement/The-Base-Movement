import { type AgendaPillar } from './agendaData'
import { formatAgendaNumber } from './agendaNumber'

interface AgendaSubnavProps {
  pillars: AgendaPillar[]
  activeSection: string
  progress: number
  onSelect: (id: string) => void
}

export function AgendaSubnav({ pillars, activeSection, progress, onSelect }: AgendaSubnavProps) {
  return (
    <>
      {/* Reading progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          zIndex: 200,
          background: 'hsl(var(--border))',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background:
              'linear-gradient(to right, hsl(var(--destructive)), hsl(var(--accent)), hsl(var(--primary)))',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Sticky tab bar — hidden on mobile */}
      <div
        className="agenda-subnav-tabs"
        style={{
          position: 'sticky',
          top: 4,
          zIndex: 100,
          background: 'hsl(var(--background))',
          borderBottom: '1px solid hsl(var(--border))',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 clamp(16px, 5vw, 48px)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {pillars.map((pillar) => {
            const isActive = activeSection === pillar.id
            const label = pillar.title.length > 22 ? pillar.title.slice(0, 22) + '…' : pillar.title
            return (
              <button
                key={pillar.id}
                onClick={() => {
                  onSelect(pillar.id)
                  document
                    .getElementById('pillar-panel')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }}
                style={{
                  flexShrink: 0,
                  padding: '13px 16px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  letterSpacing: '-0.005em',
                  color: isActive ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `3px solid ${isActive ? pillar.color : 'transparent'}`,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {formatAgendaNumber(pillar.number)}. {label}
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .agenda-subnav-tabs { display: none !important; }
        }
      `}</style>
    </>
  )
}
