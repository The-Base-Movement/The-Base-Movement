import { agendaPillars } from './agendaData'
import { useBranding } from '@/hooks/useBranding'

interface AgendaDesktopNavProps {
  activeSection: string
}

export function AgendaDesktopNav({ activeSection }: AgendaDesktopNavProps) {
  const { settings } = useBranding()

  return (
    <aside className="lg:w-1/4 hidden lg:block">
      <div className="sticky top-20 space-y-4 font-meta">
        <p className="text-micro font-bold text-stone-400 tracking-tight mb-6">Plan pillars</p>
        <nav aria-label="Agenda Pillars" className="flex flex-col space-y-2">
          {agendaPillars.map((pillar) => (
            <a
              key={pillar.id}
              href={`#${pillar.id}`}
              className={`block py-2 text-sm transition-all ${activeSection === pillar.id ? 'sticky-nav-active' : 'text-slate-600 hover:text-primary border-l-3 border-transparent pl-4'}`}
            >
              {pillar.number}. {pillar.title}
            </a>
          ))}
        </nav>

        <div className="mt-8 overflow-hidden rounded-sm relative group">
          <img
            src={settings.founder_image_url || '/branding/founder-image.jpg'}
            alt="Dr. George Oti Bonsu The Base Movement Founder"
            className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
            decoding="async"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white text-micro font-bold tracking-tight leading-tight mb-0">
              Dr. George Oti Bonsu
            </p>
            <p className="text-white/70 text-micro font-bold tracking-tight mt-0.5 mb-0">
              Movement Founder
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
