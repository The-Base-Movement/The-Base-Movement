import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import {
  useBlogPosts,
  usePublicStats,
  useMilestones,
  useActivePolls,
} from '@/hooks/queries/usePublicContent'
import { usePerformance } from '@/context/PerformanceContext'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'

import { HeroSection, MobileHeroUpdatesTicker } from './home/HeroSection'
import { WingDivider } from '@/components/ui/WingDivider'

const MILESTONE_COLORS = ['#CE1126', '#DAA520', '#181d19', '#006B3F']

const HomeOfficers = lazy(() =>
  import('@/components/HomeOfficers').then((module) => ({ default: module.HomeOfficers }))
)
const LatestUpdatesSection = lazy(() =>
  import('./home/LatestUpdatesSection').then((module) => ({ default: module.LatestUpdatesSection }))
)
const NetworkStructureSection = lazy(() =>
  import('./home/NetworkStructureSection').then((module) => ({
    default: module.NetworkStructureSection,
  }))
)
const PollsSection = lazy(() =>
  import('./home/PollsSection').then((module) => ({ default: module.PollsSection }))
)
const FoundationSection = lazy(() =>
  import('./home/FoundationSection').then((module) => ({ default: module.FoundationSection }))
)
const PlatformsSection = lazy(() =>
  import('./home/PlatformsSection').then((module) => ({ default: module.PlatformsSection }))
)
const RoadmapSection = lazy(() =>
  import('./home/RoadmapSection').then((module) => ({ default: module.RoadmapSection }))
)
const StatsSection = lazy(() =>
  import('./home/StatsSection').then((module) => ({ default: module.StatsSection }))
)

const DEFAULT_STATS = {
  members: 0,
  chapters: 0,
  regions: 0,
  diaspora: 0,
  countries: 0,
  membersDelta: '...',
  chaptersDelta: '...',
  diasporaDelta: '...',
}

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
  const { data: blogPosts } = useBlogPosts()
  const { data: statsData } = usePublicStats()
  const { data: milestonesData } = useMilestones()
  const { data: pollsData } = useActivePolls()

  const latestPosts = useMemo(() => (blogPosts ?? []).slice(0, 3), [blogPosts])
  const stats = statsData ?? DEFAULT_STATS
  const milestones = useMemo(
    () =>
      [...(milestonesData ?? [])]
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 4),
    [milestonesData]
  )
  const activePolls = useMemo(
    () => (pollsData ?? []).filter((p) => p.status === 'Active').slice(0, 2),
    [pollsData]
  )
  const { lowBandwidthMode } = usePerformance()

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'PoliticalParty',
    name: 'The Base Movement',
    // Brand variants people actually search (from GSC) so Google maps these
    // navigational queries to this entity. Only names that are ours to claim.
    alternateName: ['The Base Movement Ghana', 'Base Movement Ghana', 'TBM'],
    url: 'https://www.thebasemovement.org.gh',
    logo: settings.logo_url,
    slogan: 'Ghana First, Jobs for the Youth!',
    areaServed: ['Ghana', 'Diaspora'],
    sameAs: [
      'https://www.facebook.com/profile.php?id=61579415816496',
      'https://www.instagram.com/thebasemovementghana',
      'https://x.com/thebasemovement',
      'https://www.tiktok.com/@thebasemovementghana',
      'https://www.youtube.com/@TheBaseMovementGhana',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general info',
      url: 'https://www.thebasemovement.org.gh/contact',
    },
  }

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
      <SEO
        title="The Base Movement Ghana | Ghana First, Jobs for the Youth"
        canonical="/"
        jsonLd={organizationSchema}
      />

      <HeroSection
        heroBgUrl={settings.hero_bg_url || '/hero-bg.png'}
        latestPosts={latestPosts}
        mousePos={mousePos}
        onMouseMove={handleMouseMove}
        lowBandwidthMode={lowBandwidthMode}
      />

      <MobileHeroUpdatesTicker latestPosts={latestPosts} />

      <Suspense fallback={null}>
        <StatsSection statsGridRef={statsGridRef} stats={stats} />
      </Suspense>

      <WingDivider />

      <Suspense fallback={null}>
        <PlatformsSection />
      </Suspense>

      <WingDivider />

      <Suspense fallback={null}>
        <FoundationSection />
      </Suspense>

      <WingDivider />

      <Suspense fallback={null}>
        <RoadmapSection roadmapItems={roadmapItems} />
      </Suspense>

      <WingDivider />

      <Suspense fallback={null}>
        <NetworkStructureSection />
      </Suspense>

      <WingDivider />

      <Suspense fallback={null}>
        <HomeOfficers />
      </Suspense>

      <WingDivider />

      <Suspense fallback={null}>
        <LatestUpdatesSection latestPosts={latestPosts} />
      </Suspense>

      {activePolls.length > 0 && (
        <>
          <WingDivider />
          <Suspense fallback={null}>
            <PollsSection activePolls={activePolls} />
          </Suspense>
        </>
      )}
    </main>
  )
}
