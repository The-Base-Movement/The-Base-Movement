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
import { WingDivider } from '@/components/ui/WingDivider'

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
        background: `linear-gradient(to bottom, hsl(var(--surface-warm)), hsl(var(--background)))`,
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <SEO
        title="About"
        description="Learn about The Base Movement — a grassroots political movement for Ghana built on patriotism, honesty, and discipline, uniting compatriots at home and across the diaspora behind a Ghana First agenda."
      />
      <section
        style={{
          padding: 'clamp(64px, 10vw, 100px) clamp(16px, 5vw, 32px) clamp(48px, 6vw, 72px)',
        }}
      >
        <AboutHero tagline={siteSettings.about_hero_tagline} />
      </section>

      <WingDivider />

      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(64px, 8vw, 96px)',
        }}
      >
        <AboutPillars
          mission={siteSettings.about_pillar_mission}
          vision={siteSettings.about_pillar_vision}
          values={siteSettings.about_pillar_values}
          leadership={siteSettings.about_pillar_leadership}
          ghanaNetwork={siteSettings.about_pillar_ghana_network}
          diaspora={siteSettings.about_pillar_diaspora}
        />
      </section>

      <WingDivider />

      <section
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 48px)',
          background: 'hsl(var(--background) / 0.6)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <AboutStats stats={stats} />
        </div>
      </section>

      <WingDivider />

      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 48px)',
        }}
      >
        <AboutCTA />
      </section>
    </main>
  )
}
