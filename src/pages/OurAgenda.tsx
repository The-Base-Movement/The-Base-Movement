import { useState, useEffect } from 'react'
import { useIsClient } from '@/hooks/useIsClient'
import SEO from '@/components/SEO'

// Extracted Sub-Components
import { agendaPillars } from './ouragenda/agendaData'
import { AgendaHeader } from './ouragenda/AgendaHeader'
import { AgendaMobileNav } from './ouragenda/AgendaMobileNav'
import { AgendaDesktopNav } from './ouragenda/AgendaDesktopNav'
import { AgendaIntroCards } from './ouragenda/AgendaIntroCards'
import { AgendaPillarsContent } from './ouragenda/AgendaPillarsContent'
import { AgendaCovenant } from './ouragenda/AgendaCovenant'

export default function OurAgenda() {
  const [activeSection, setActiveSection] = useState('education')
  const isClient = useIsClient()
  const isLoggedIn = isClient && typeof window !== 'undefined' && !!localStorage.getItem('userName')

  useEffect(() => {
    const handleScroll = () => {
      const sections = agendaPillars.map((p) => document.getElementById(p.id))
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(agendaPillars[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      <SEO
        title="The Plan for Ghana"
        description="The Six Aims of The Base. A detailed, actionable blueprint to build a stronger, more prosperous nation through patriotism, honesty, and discipline."
        canonical="/our-agenda"
      />

      <AgendaHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-10 md:mt-16">
        <div className="flex flex-col lg:flex-row gap-12">
          <AgendaMobileNav activeSection={activeSection} />

          <AgendaDesktopNav activeSection={activeSection} />

          {/* Main Content */}
          <div className="lg:w-3/4 flow" style={{ '--flow-space': '4rem' } as React.CSSProperties}>
            <AgendaIntroCards />
            <AgendaPillarsContent />
            <AgendaCovenant isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>
    </main>
  )
}
