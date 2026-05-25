import { type AgendaPillar } from './agendaData'

interface AgendaPillarsContentProps {
  pillars: AgendaPillar[]
}

export function AgendaPillarsContent({ pillars }: AgendaPillarsContentProps) {
  return (
    <>
      {pillars.map((pillar) => (
        <section
          key={pillar.id}
          id={pillar.id}
          aria-labelledby={`pillar-heading-${pillar.id}`}
          className="pillar-card bg-white border border-slate-200 rounded-none p-5 md:p-12 shadow-sm border-l-4 scroll-mt-24"
          style={{ borderLeftColor: pillar.color }}
        >
          <div className="space-y-4 mb-6 md:space-y-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-surface-warm"
                style={{ color: pillar.color }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  {pillar.icon}
                </span>
              </div>
              <p
                className="text-micro font-medium tracking-tight mb-0"
                style={{ color: pillar.color }}
              >
                Aim {pillar.number}
              </p>
            </div>
            <h2 id={`pillar-heading-${pillar.id}`} className="mb-0 text-xl md:text-3xl">
              {pillar.title}
            </h2>
          </div>

          <p className="text-slate-700 leading-relaxed font-normal mb-6 pb-6 md:mb-10 md:pb-10 border-b border-slate-100 prose-standard">
            {pillar.summary}
          </p>

          <div className="space-y-5 md:space-y-8">
            <p className="text-micro font-medium text-stone-400 tracking-tight mb-0">Objectives</p>
            {pillar.objectives.map((obj, idx) => (
              <div key={idx} className="bg-surface-warm p-4 md:p-6 rounded-none">
                <h3 className="mb-4">{obj.title}</h3>
                <ul className="space-y-3">
                  {obj.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 mt-2 bg-accent shrink-0 rounded-none"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
