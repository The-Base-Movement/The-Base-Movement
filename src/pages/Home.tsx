import { useEffect, useRef, useState } from 'react'
import { adminService, type BlogPost, type Milestone, type Poll } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { usePerformance } from '@/context/PerformanceContext'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { HomeOfficers } from '@/components/HomeOfficers'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import { HeroSection, MobileHeroUpdatesTicker } from './home/HeroSection'
import { StatsSection } from './home/StatsSection'
import { RoadmapSection } from './home/RoadmapSection'
import { NetworkStructureSection } from './home/NetworkStructureSection'
import { FoundationSection } from './home/FoundationSection'
import { LatestUpdatesSection } from './home/LatestUpdatesSection'
import { PlatformsSection } from './home/PlatformsSection'
import { PollsSection } from './home/PollsSection'
import { WingDivider } from '@/components/ui/WingDivider'

gsap.registerPlugin(ScrollTrigger)

const MILESTONE_COLORS = ['#CE1126', '#DAA520', '#181d19', '#006B3F']

const fallbackMilestones = [
  {
    color: '#CE1126',
    done: true,
    current: false,
    year: '2024',
    title: 'Foundation laid',
    body: 'Movement formally launched. First 50 branches opened across Greater Accra and Ashanti.',
  },
  {
    color: '#DAA520',
    done: true,
    current: false,
    year: '2025',
    title: 'National coverage',
    body: 'Reached presence in all 16 regions with 1,000+ branches and a verified diaspora chapter network.',
  },
  {
    color: '#181d19',
    done: false,
    current: true,
    year: '2026 · Now',
    title: 'Jobs program scale-up',
    body: '1M-job plan launched. First 50,000 youth in apprenticeships across four priority sectors.',
  },
  {
    color: '#006B3F',
    done: false,
    current: false,
    year: '2028',
    title: 'National election',
    body: 'Field every promise we made. Hold every leader accountable to the published Plan.',
  },
]

export default function Home() {
  const { settings } = useBranding()
  const statsGridRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [stats, setStats] = useState({
    members: 0,
    chapters: 0,
    regions: 0,
    diaspora: 0,
    membersDelta: '...',
    chaptersDelta: '...',
    diasporaDelta: '...',
  })
  const { lowBandwidthMode } = usePerformance()

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Base Movement',
    url: 'https://www.thebasemovement.org.gh',
    logo: settings.logo_url,
    sameAs: [
      'https://www.facebook.com/profile.php?id=61579415816496',
      'https://www.instagram.com/thebasemovementgh',
      'https://www.tiktok.com/@thebasemovementgh',
      'https://www.youtube.com/@thebasemovementgh',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general info',
      url: 'https://www.thebasemovement.org.gh/contact',
    },
  }

  useEffect(() => {
    contentService
      .getBlogPosts()
      .then((data) => setLatestPosts(data.slice(0, 3)))
      .catch(() => {})
    adminService
      .getPublicStats()
      .then(setStats)
      .catch(() => {})
    adminService
      .getMilestones()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        )
        setMilestones(sorted.slice(0, 4))
      })
      .catch(() => {})
    adminService
      .getPolls()
      .then((data) => setActivePolls(data.filter((p) => p.status === 'Active').slice(0, 2)))
      .catch(() => {})
  }, [])

  useGSAP(
    () => {
      if (!statsGridRef.current) return
      gsap.fromTo(
        statsGridRef.current.children,
        { opacity: 0, y: 30, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.08,
        }
      )
    },
    { scope: statsGridRef, dependencies: [stats] }
  )

  useGSAP(() => {
    gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      )
    })
    gsap.utils.toArray<HTMLElement>('[data-fade-stagger]').forEach((container) => {
      gsap.fromTo(
        Array.from(container.children),
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: container, start: 'top 85%', once: true },
        }
      )
    })
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const roadmapItems =
    milestones.length > 0
      ? milestones.map((ms, idx) => ({
          color: MILESTONE_COLORS[idx] ?? '#006B3F',
          done: ms.status === 'Completed',
          current: ms.status === 'In Progress',
          year:
            ms.status === 'In Progress'
              ? `${new Date(ms.target_date).getFullYear()} · Now`
              : String(new Date(ms.target_date).getFullYear()),
          title: ms.title,
          body: ms.description,
        }))
      : fallbackMilestones

  return (
    <main className="bg-background font-body-md">
      <SEO title="Ghana First, Jobs for the Youth!" canonical="/" jsonLd={organizationSchema} />

      <HeroSection
        heroBgUrl={settings.hero_bg_url || '/hero-bg.png'}
        latestPosts={latestPosts}
        mousePos={mousePos}
        onMouseMove={handleMouseMove}
        lowBandwidthMode={lowBandwidthMode}
      />

      <MobileHeroUpdatesTicker latestPosts={latestPosts} />

      <StatsSection statsGridRef={statsGridRef} stats={stats} />

      <WingDivider />

      <PlatformsSection />

      <WingDivider />

      <FoundationSection />

      <WingDivider />

      <RoadmapSection roadmapItems={roadmapItems} />

      <WingDivider />

      <NetworkStructureSection />

      <WingDivider />

      <HomeOfficers />

      <WingDivider />

      <LatestUpdatesSection latestPosts={latestPosts} />

      {activePolls.length > 0 && (
        <>
          <WingDivider />
          <PollsSection activePolls={activePolls} />
        </>
      )}
    </main>
  )
}
