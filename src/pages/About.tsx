import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import {
  publicSiteService,
  EMPTY_PUBLIC_STATS,
  type PublicStats,
} from '@/services/publicSiteService'
import { AboutHero } from './about/AboutHero'
import { AboutPillars } from './about/AboutPillars'
import { AboutStats } from './about/AboutStats'
import { AboutCTA } from './about/AboutCTA'

export default function About() {
  const [stats, setStats] = useState<PublicStats>(EMPTY_PUBLIC_STATS)
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    publicSiteService
      .getPublicStats()
      .then(setStats)
      .catch(() => {})

    publicSiteService
      .getSiteSettings()
      .then((s) => setSiteSettings(s as Record<string, string>))
      .catch(() => {})
  }, [])

  return (
    <main
      style={{
        background: 'hsl(var(--background))',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <SEO
        title="About"
        description="Learn about The Base Movement, a grassroots political movement for Ghana built on patriotism, honesty, and discipline, uniting compatriots at home and across the diaspora behind a Ghana First agenda."
      />
      <section className="bg-surface-warm border-b border-border/60 py-16 md:py-24 px-4 sm:px-8">
        <AboutHero tagline={siteSettings.about_hero_tagline} />
      </section>

      <section className="bg-white py-20 md:py-28 border-b border-border/60 px-4 sm:px-8">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <AboutPillars
            mission={siteSettings.about_pillar_mission}
            vision={siteSettings.about_pillar_vision}
            values={siteSettings.about_pillar_values}
            leadership={siteSettings.about_pillar_leadership}
            ghanaNetwork={siteSettings.about_pillar_ghana_network}
            diaspora={siteSettings.about_pillar_diaspora}
          />
        </div>
      </section>

      <section className="bg-[#181d19] text-white py-20 md:py-28 px-4 sm:px-8">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <AboutStats stats={stats} />
        </div>
      </section>

      <section className="bg-surface-warm py-20 md:py-28 px-4 sm:px-8 border-t border-border/60">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <AboutCTA />
        </div>
      </section>
    </main>
  )
}
