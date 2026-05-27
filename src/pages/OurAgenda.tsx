import { useState, useEffect } from 'react'
import { DotLoader } from '@/components/states'
import { useIsClient } from '@/hooks/useIsClient'
import SEO from '@/components/SEO'
import { planService } from '@/services/planService'

import { agendaPillars, type AgendaPillar } from './ouragenda/agendaData'
import { AgendaHeader } from './ouragenda/AgendaHeader'
import { AgendaSubnav } from './ouragenda/AgendaSubnav'
import { AgendaIntroCards } from './ouragenda/AgendaIntroCards'
import { AgendaPillarsContent } from './ouragenda/AgendaPillarsContent'
import { AgendaCovenant } from './ouragenda/AgendaCovenant'

export default function OurAgenda() {
  const [pillars, setPillars] = useState<AgendaPillar[]>(agendaPillars)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(agendaPillars[0]?.id || '')
  const isClient = useIsClient()
  const isLoggedIn = isClient && !!localStorage.getItem('userName')

  const activeIndex = pillars.findIndex((p) => p.id === activeSection)
  const progress = pillars.length > 0 ? Math.round(((activeIndex + 1) / pillars.length) * 100) : 0

  useEffect(() => {
    planService
      .getPlanPillars()
      .then((data) => {
        if (data?.length) {
          setPillars(data)
          setActiveSection(data[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <SEO
        title="The Plan for Ghana"
        description="The Six Aims of The Base. A detailed, actionable blueprint to build a stronger, more prosperous nation through patriotism, honesty, and discipline."
        canonical="/our-agenda"
      />

      <AgendaHeader pillarsCount={pillars.length} />
      <AgendaSubnav
        pillars={pillars}
        activeSection={activeSection}
        progress={progress}
        onSelect={setActiveSection}
      />

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(64px, 8vw, 96px)',
        }}
      >
        <AgendaIntroCards pillars={pillars} onSelect={setActiveSection} />

        {isLoading ? (
          <DotLoader
            label="Loading Strategic Plan…"
            style={{ padding: '80px 0', justifyContent: 'center' }}
          />
        ) : (
          <AgendaPillarsContent
            pillars={pillars}
            activeSection={activeSection}
            onSelect={setActiveSection}
          />
        )}

        <AgendaCovenant isLoggedIn={isLoggedIn} />
      </div>
    </main>
  )
}
