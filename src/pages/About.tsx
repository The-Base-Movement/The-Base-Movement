import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { AboutHero } from './about/AboutHero'
import { AboutPillars } from './about/AboutPillars'
import { AboutStats } from './about/AboutStats'
import { AboutCTA } from './about/AboutCTA'

const DEFAULT_STATS = { members: 0, chapters: 0, regions: 16, diaspora: 0 }

export default function About() {
  const [stats, setStats] = useState(DEFAULT_STATS)

  useEffect(() => {
    adminService
      .getPublicStats()
      .then((s) => {
        setStats({
          members: s.members,
          chapters: s.chapters,
          regions: s.regions,
          diaspora: s.diaspora,
        })
      })
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
      {/* Hero */}
      <section
        style={{
          padding: 'clamp(64px, 10vw, 100px) clamp(16px, 5vw, 32px) clamp(48px, 6vw, 72px)',
        }}
      >
        <AboutHero />
      </section>

      {/* Pillars */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(64px, 8vw, 96px)',
        }}
      >
        <AboutPillars />
      </section>

      {/* Stats */}
      <section
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 48px)',
          background: 'hsl(var(--background) / 0.6)',
          borderTop: '1px solid hsl(var(--border))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <AboutStats stats={stats} />
        </div>
      </section>

      {/* CTA */}
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
