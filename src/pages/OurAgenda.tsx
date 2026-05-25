import { useState, useEffect } from 'react'
import { useIsClient } from '@/hooks/useIsClient'
import SEO from '@/components/SEO'
import { planService } from '@/services/planService'

// Extracted Sub-Components
import { agendaPillars, type AgendaPillar } from './ouragenda/agendaData'
import { AgendaHeader } from './ouragenda/AgendaHeader'
import { AgendaMobileNav } from './ouragenda/AgendaMobileNav'
import { AgendaDesktopNav } from './ouragenda/AgendaDesktopNav'
import { AgendaIntroCards } from './ouragenda/AgendaIntroCards'
import { AgendaPillarsContent } from './ouragenda/AgendaPillarsContent'
import { AgendaCovenant } from './ouragenda/AgendaCovenant'

export default function OurAgenda() {
  const [pillars, setPillars] = useState<AgendaPillar[]>(agendaPillars)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('education')
  const isClient = useIsClient()
  const isLoggedIn = isClient && typeof window !== 'undefined' && !!localStorage.getItem('userName')

  useEffect(() => {
    const fetchPillars = async () => {
      try {
        const data = await planService.getPlanPillars()
        if (data && data.length > 0) {
          setPillars(data)
          // Set initial active section to the first pillar
          if (data[0]) {
            setActiveSection(data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic plan pillars:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPillars()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const sections = pillars.map((p) => document.getElementById(p.id))
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(pillars[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pillars])

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
          <AgendaMobileNav activeSection={activeSection} pillars={pillars} />

          <AgendaDesktopNav activeSection={activeSection} pillars={pillars} />

          {/* Main Content */}
          <div className="lg:w-3/4 flow" style={{ '--flow-space': '4rem' } as React.CSSProperties}>
            <AgendaIntroCards />

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div
                  className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' }}
                />
                <p className="text-sm font-medium text-stone-400 font-display uppercase tracking-wider">
                  Loading Strategic Plan…
                </p>
              </div>
            ) : (
              <AgendaPillarsContent pillars={pillars} />
            )}

            <AgendaCovenant isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>
    </main>
  )
}
