import { type AgendaPillar } from './agendaData'
import { formatAgendaNumber } from './agendaNumber'

interface AgendaMobileNavProps {
  activeSection: string
  pillars: AgendaPillar[]
}

export function AgendaMobileNav({ activeSection, pillars }: AgendaMobileNavProps) {
  return (
    <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-2 mb-2">
      <div className="flex gap-2 w-max">
        {pillars.map((pillar) => (
          <a
            key={pillar.id}
            href={`#${pillar.id}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold rounded-none whitespace-nowrap transition-colors"
            style={{
              borderColor:
                activeSection === pillar.id ? pillar.color : 'hsl(var(--border, 226 18% 89%))',
              color: activeSection === pillar.id ? pillar.color : '#6b7280',
              background: activeSection === pillar.id ? `${pillar.color}12` : 'transparent',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              {pillar.icon}
            </span>
            {formatAgendaNumber(pillar.number)}
          </a>
        ))}
      </div>
    </div>
  )
}
