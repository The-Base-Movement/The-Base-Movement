import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService, type BlogPost, type Milestone, type Chapter, type Poll } from '@/services/adminService'
import { usePerformance } from '@/context/PerformanceContext'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { BrandLine } from '@/components/ui/BrandLine'

function Sparkline({ heights, accent }: { heights: number[]; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', width: '78px' }}>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            background: accent,
            opacity: i >= heights.length - 5 ? 0.85 : 0.18,
            borderRadius: '1px',
            minHeight: '3px',
            height: `${h}px`,
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}

function StatCard({
  accent, eye, value, suffix, label, sparkHeights, delta, deltaIcon
}: {
  accent: string
  eye: string
  value: number
  suffix?: string
  label: string
  sparkHeights: number[]
  delta: string
  deltaIcon: 'up' | 'circle'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started || !value) return
    let cur = 0
    const inc = value / (1800 / 16)
    const t = setInterval(() => {
      cur += inc
      if (cur >= value) { setCount(value); clearInterval(t) } else setCount(Math.floor(cur))
    }, 16)
    return () => clearInterval(t)
  }, [started, value])

  return (
    <div
      ref={ref}
      style={{
        background: '#fff',
        border: '1px solid #dfe4dd',
        borderRadius: '6px',
        padding: '22px 22px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'transform .18s ease, box-shadow .18s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px -8px rgba(0,0,0,.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px -2px rgba(0,0,0,.04)' }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '5px', background: accent }} />
      <div style={{ position: 'absolute', top: '14px', right: '18px', width: '6px', height: '6px', borderRadius: '50%', background: accent }} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#6f7a71', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif" }}>{eye}</span>
      </div>

      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: '48px', letterSpacing: '-.03em', lineHeight: '.95', color: '#181d19', fontVariantNumeric: 'tabular-nums' }}>
        {count.toLocaleString()}
        {suffix && <small style={{ fontSize: '20px', fontWeight: 700, color: '#6f7a71', marginLeft: '2px', letterSpacing: 0 }}>{suffix}</small>}
      </div>

      <div style={{ fontSize: '12px', fontWeight: 700, color: '#181d19', letterSpacing: '-.005em', lineHeight: 1.4, fontFamily: "'Public Sans', sans-serif" }}>{label}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #dfe4dd', paddingTop: '12px', marginTop: 'auto' }}>
        <Sparkline heights={sparkHeights} accent={accent} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 700, color: accent, letterSpacing: '-.005em', fontFamily: "'Public Sans', sans-serif" }}>
          {deltaIcon === 'circle' ? (
            <svg viewBox="0 0 8 8" width="9" height="9"><circle cx="4" cy="4" r="3" fill="currentColor"/></svg>
          ) : (
            <svg viewBox="0 0 8 8" width="9" height="9"><path d="M0 6 L4 2 L8 6 Z" fill="currentColor"/></svg>
          )}
          {delta}
        </span>
      </div>
    </div>
  )
}


export default function Home() {
  const { settings } = useBranding()
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [stats, setStats] = useState({
    members: 0,
    chapters: 0,
    regions: 0,
    diaspora: 0,
    membersDelta: '...',
    chaptersDelta: '...',
    diasporaDelta: '...'
  })
  const { lowBandwidthMode } = usePerformance()

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Base Movement",
    "url": "https://thebasemovement.com",
    "logo": settings.logo_url,
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61579415816496",
      "https://www.instagram.com/thebasemovementgh",
      "https://www.tiktok.com/@thebasemovementgh",
      "https://www.youtube.com/@thebasemovementgh"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "general info",
      "url": "https://thebasemovement.com/contact"
    }
  }

  useEffect(() => {
    adminService.getBlogPosts().then(data => setLatestPosts(data.slice(0, 3))).catch(() => {})
    adminService.getPublicStats().then(setStats).catch(() => {})
    adminService.getMilestones().then(data => {
      const sorted = [...data].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
      setMilestones(sorted.slice(0, 4))
    }).catch(() => {})
    adminService.getChapters().then(data => setChapters(data.slice(0, 3))).catch(() => {})
    adminService.getPolls().then(data => setActivePolls(data.filter(p => p.status === 'Active').slice(0, 2))).catch(() => {})
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const MILESTONE_COLORS = ['#CE1126', '#DAA520', '#181d19', '#006B3F']
  const fallbackMilestones = [
    { color: '#CE1126', done: true,  current: false, year: '2024',       title: 'Foundation laid',       body: 'Movement formally launched. First 50 branches opened across Greater Accra and Ashanti.' },
    { color: '#DAA520', done: true,  current: false, year: '2025',       title: 'National coverage',     body: 'Reached presence in all 16 regions with 1,000+ branches and a verified diaspora chapter network.' },
    { color: '#181d19', done: false, current: true,  year: '2026 · Now', title: 'Jobs program scale-up', body: '1M-job plan launched. First 50,000 youth in apprenticeships across four priority sectors.' },
    { color: '#006B3F', done: false, current: false, year: '2028',       title: 'National election',     body: 'Field every promise we made. Hold every leader accountable to the published Plan.' },
  ]
  const roadmapItems = milestones.length > 0
    ? milestones.map((ms, idx) => ({
        color: MILESTONE_COLORS[idx] ?? '#006B3F',
        done: ms.status === 'Completed',
        current: ms.status === 'In Progress',
        year: ms.status === 'In Progress'
          ? `${new Date(ms.target_date).getFullYear()} · Now`
          : String(new Date(ms.target_date).getFullYear()),
        title: ms.title,
        body: ms.description,
      }))
    : fallbackMilestones

  return (
    <main className="bg-background font-body-md">
      <SEO
        title="Ghana First, Jobs for the Youth!"
        canonical="/"
        jsonLd={organizationSchema}
      />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative bg-on-surface text-white flex items-center overflow-hidden border-b-[8px] border-accent group"
        style={{ minHeight: 'clamp(420px, 60vw, 620px)' }}
        onMouseMove={handleMouseMove}
      >
        {!lowBandwidthMode ? (
          <>
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity" style={{ backgroundImage: `url('${settings.hero_bg_url || "/hero-bg.png"}')` }} />
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
              style={{
                backgroundImage: `url('${settings.hero_bg_url || "/hero-bg.png"}')`,
                WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-on-surface to-on-surface/90 opacity-50" />
        )}

        <div className="absolute inset-0 z-0 bg-gradient-to-t from-on-surface via-on-surface/60 to-transparent" />

        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 md:py-[80px] relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full">
          <div className="flex-1 text-center md:text-left">
            <h1
              id="hero-heading"
              className="font-meta font-extrabold mb-2 leading-[1.05] tracking-tighter"
              style={{ fontSize: 'clamp(34px, 8vw, 64px)' }}
            >
              Ghana First,<br />Jobs for the youth!
            </h1>
            <div className="flex justify-center md:justify-start">
              <BrandLine />
            </div>
            <p className="text-white/90 text-sm md:text-base font-body-md max-w-xl mt-4 mb-6 leading-relaxed">
              We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center md:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
                style={{ background: 'hsl(var(--accent))', color: '#000', borderRadius: 2 }}
              >
                Join the Movement
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
              <Link
                to="/our-agenda"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
                style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
              >
                Learn More About Us
              </Link>
            </div>
          </div>

          {/* Logo — hidden on small screens to save vertical space */}
          <div className="hidden sm:flex flex-1 justify-center md:justify-end opacity-90">
            <img
              src={settings.logo_url}
              alt="The Base"
              className="w-52 md:w-80 lg:w-96 drop-shadow-2xl object-contain"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* ── Ghana vs Diaspora ──────────────────────────────────── */}
      <section aria-labelledby="platforms-heading" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
          <h2 id="platforms-heading" className="sr-only">Our Platforms</h2>
          <div className="grid md:grid-cols-2 gap-10 md:gap-24">

            <div className="border-t-[4px] border-primary pt-8">
              <h3 className="text-[22px] md:text-[32px] font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight leading-tight">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>place</span>
                For Citizens in Ghana.
              </h3>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed font-body-md">
                Get involved in your district. Join your local branch, take part in community activity, and support practical action for jobs and development.
              </p>
              <Link
                to="/register?platform=GHANA"
                className="inline-flex items-center gap-2 px-6 py-3 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity w-full sm:w-auto justify-center sm:justify-start"
                style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
              >
                Join Base Ghana
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
            </div>

            <div className="border-t-[4px] border-accent pt-8">
              <h3 className="text-[22px] md:text-[32px] font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight leading-tight">
                <span className="material-symbols-outlined text-accent" style={{ fontSize: 28 }}>language</span>
                For Ghanaians Abroad.
              </h3>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed font-body-md">
                Stay connected to home and support national development from abroad through your skills, networks, and commitment to Ghana's future.
              </p>
              <Link
                to="/register?platform=DIASPORA"
                className="inline-flex items-center gap-2 px-6 py-3 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity w-full sm:w-auto justify-center sm:justify-start"
                style={{ background: 'hsl(var(--accent))', color: '#000', borderRadius: 2 }}
              >
                Join Base Diaspora
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Foundation pillars ─────────────────────────────────── */}
      <section aria-labelledby="foundation-heading" className="py-16 md:py-24 bg-on-surface text-white border-t border-white/5">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
          <div className="mb-10 md:mb-16">
            <h2
              id="foundation-heading"
              className="font-meta font-bold leading-tight mb-4 tracking-tighter"
              style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}
            >
              Our Foundation
            </h2>
            <BrandLine />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="border-l-2 border-destructive pl-6">
              <span className="text-destructive font-meta font-bold tracking-tight text-xs mb-3 block">Core Pillar 01</span>
              <h3 className="text-xl md:text-2xl font-meta font-bold mb-4 tracking-tight text-white">Economic Responsibility</h3>
              <p className="text-white/80 leading-relaxed font-body-md text-sm">
                We advocate for the transparent management of national resources to ensure they are invested in projects that create sustainable, long‑term jobs for our youth.
              </p>
            </div>
            <div className="border-l-2 border-accent pl-6">
              <span className="text-accent font-meta font-bold tracking-tight text-xs mb-3 block">Core Pillar 02</span>
              <h3 className="text-xl md:text-2xl font-meta font-bold mb-4 tracking-tight text-white">Youth Participation</h3>
              <p className="text-white/80 leading-relaxed font-body-md text-sm">
                We believe young people must be at the heart of our progress, equipped with the skills and opportunities to lead Ghana's development.
              </p>
            </div>
            <div className="border-l-2 border-primary pl-6">
              <span className="text-primary font-meta font-bold tracking-tight text-xs mb-3 block">Core Pillar 03</span>
              <h3 className="text-xl md:text-2xl font-meta font-bold mb-4 tracking-tight text-white">Integrity & Accountability</h3>
              <p className="text-white/80 leading-relaxed font-body-md text-sm">
                A movement built on trust. We believe every leader must be answerable to the citizens they represent and the promises they make.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading" className="py-16 md:py-24 bg-[#fafaf6] border-y border-border/40">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
          <div className="mb-5">
            <h2 id="stats-heading" className="font-meta font-extrabold text-xl tracking-tight text-on-surface">
              Movement at a glance
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.06em] mt-1.5 block">Updated · Q2 2026</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            <StatCard
              accent="#CE1126"
              eye="Regions"
              value={stats.regions}
              suffix="/16"
              label="Full presence across every administrative region of Ghana"
              sparkHeights={[6,8,10,11,12,13,14,15,16,17,18,18]}
              delta="National coverage"
              deltaIcon="circle"
            />
            <StatCard
              accent="#DAA520"
              eye="Branches"
              value={stats.chapters}
              label="Community branches active in nearly every district"
              sparkHeights={[5,6,7,7,9,10,10,12,13,14,16,18]}
              delta={stats.chaptersDelta}
              deltaIcon="up"
            />
            <StatCard
              accent="#1A1A1A"
              eye="Diaspora"
              value={stats.diaspora}
              label="Global Ghanaians supporting from abroad"
              sparkHeights={[3,4,4,5,7,7,10,11,13,14,16,18]}
              delta={stats.diasporaDelta}
              deltaIcon="up"
            />
            <StatCard
              accent="#006B3F"
              eye="Members"
              value={stats.members}
              label="Verified citizens registered nationwide"
              sparkHeights={[4,6,7,7,9,11,12,14,15,16,17,18]}
              delta={stats.membersDelta}
              deltaIcon="up"
            />
          </div>
        </div>
      </section>

      {/* ── Roadmap ────────────────────────────────────────────── */}
      <section aria-labelledby="roadmap-heading" className="py-16 md:py-24 bg-white border-b border-border/30">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
          <div className="mb-10 md:mb-12">
            <span className="text-[10px] font-bold tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">Movement roadmap</span>
            <h2 id="roadmap-heading" className="text-2xl md:text-3xl font-meta font-bold text-on-surface tracking-tight mb-1">Where we are,<br />what's next.</h2>
          </div>

          <div className="relative">
            {/* Connecting line — desktop only */}
            <div
              className="absolute left-3 right-0 hidden md:block"
              style={{ top: '12px', height: '3px', background: 'linear-gradient(to right, #CE1126, #DAA520, #181d19, #006B3F)' }}
            />

            {/* Vertical line — mobile only */}
            <div
              className="absolute top-0 bottom-0 left-[11px] md:hidden"
              style={{ width: '3px', background: 'linear-gradient(to bottom, #CE1126, #DAA520, #181d19, #006B3F)' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-8">
              {roadmapItems.map((ms, idx) => (
                <div key={ms.year} className="relative flex md:block gap-6 pb-10 md:pb-0 md:pt-16 md:pr-4">
                  {/* Dot */}
                  <div
                    className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-4 mt-1 md:absolute md:top-0 md:left-0 md:mt-0"
                    style={{ background: ms.done ? ms.color : '#fff', borderColor: ms.color }}
                  >
                    {ms.done && (
                      <svg viewBox="0 0 10 10" width="8" height="8" fill="white"><path d="M1.5 5 L4 7.5 L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {ms.current && !ms.done && (
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ms.color }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={idx < 3 ? '' : ''}>
                    <div className="text-[11px] font-bold tracking-[.06em] uppercase mb-1.5 font-meta" style={{ color: 'hsl(var(--on-surface-muted))' }}>
                      {ms.year}
                    </div>
                    <h4 className="font-meta font-extrabold text-[15px] tracking-[-0.01em] text-on-surface mb-1.5 leading-snug">
                      {ms.title}
                    </h4>
                    <p className="text-[12px] text-muted-foreground leading-[1.5] font-body-md">
                      {ms.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapters near you ─────────────────────────────────── */}
      <section aria-labelledby="chapters-heading" className="py-16 md:py-24 bg-[#fafaf6] border-y border-border/40">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <span className="text-[10px] font-bold tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">Community</span>
              <h2 id="chapters-heading" className="text-2xl md:text-3xl font-meta font-bold text-on-surface tracking-tight">Chapters near you</h2>
              <p className="text-xs text-muted-foreground/60 mt-1">Community branches across all 16 regions. Find yours.</p>
            </div>
            <Link to="/chapters" className="hidden md:inline-flex items-center gap-2 text-primary font-meta font-bold tracking-tight text-xs hover:underline">
              All chapters <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {chapters.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-sm border border-border/50 overflow-hidden animate-pulse">
                    <div className="h-14 bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-8 bg-muted rounded" />)}
                      </div>
                    </div>
                  </div>
                ))
              : chapters.map(chapter => {
                  const isFeatured = chapter.status === 'Active' && chapter.member_count > 500
                  return (
                    <Link key={chapter.id} to="/chapters" style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6, overflow: 'hidden', height: '100%' }}>
                        <div style={{ padding: '14px 16px', background: isFeatured ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '-.005em' }}>{chapter.name}</div>
                            <div style={{ fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: isFeatured ? 'rgba(255,255,255,.85)' : 'hsl(var(--accent))', marginTop: 2 }}>
                              {chapter.city_or_region || chapter.country}
                            </div>
                          </div>
                          <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 2, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', flexShrink: 0 }}>
                            {chapter.country !== 'Ghana' ? 'Diaspora' : isFeatured ? 'Featured' : 'Active'}
                          </span>
                        </div>
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                            {[
                              { v: chapter.member_count.toLocaleString(), l: 'Members' },
                              { v: String(chapter.activities?.length ?? 0), l: 'Events' },
                              { v: chapter.status === 'Active' ? 'Open' : 'Closed', l: 'Status' },
                            ].map(stat => (
                              <div key={stat.l}>
                                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: '-.015em' }}>{stat.v}</div>
                                <div style={{ fontSize: 9.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 2 }}>{stat.l}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--primary))', border: '2px solid hsl(var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>person</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11.5, fontWeight: 800 }}>{chapter.leader_name}</div>
                              <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', display: 'block', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Branch chair</span>
                            </div>
                            <span style={{ marginLeft: 'auto', padding: '5px 12px', background: isFeatured ? 'hsl(var(--primary))' : 'transparent', border: `1px solid ${isFeatured ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: isFeatured ? '#fff' : 'hsl(var(--on-surface))' }}>
                              Join
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
            }
          </div>

          <Link
            to="/chapters"
            className="md:hidden mt-8 flex items-center justify-center gap-2 w-full h-12 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
            style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
          >
            View all chapters
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── Open polls ─────────────────────────────────────────── */}
      {activePolls.length > 0 && (
        <section aria-labelledby="polls-heading" className="py-16 md:py-24 bg-white border-b border-border/30">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <div>
                <span className="text-[10px] font-bold tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">Member voice</span>
                <h2 id="polls-heading" className="text-2xl md:text-3xl font-meta font-bold text-on-surface tracking-tight">Open polls</h2>
                <p className="text-xs text-muted-foreground/60 mt-1">Member voice surveys. Results visible to chapter leadership.</p>
              </div>
              <Link to="/polls" className="hidden md:inline-flex items-center gap-2 text-primary font-meta font-bold tracking-tight text-xs hover:underline">
                All polls <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {activePolls.map(poll => {
                const totalVotes = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0)
                const topOption = poll.options.length > 0 ? poll.options.reduce((a, b) => a.votes > b.votes ? a : b) : null
                return (
                  <div key={poll.id} style={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: 22, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'hsl(var(--destructive))' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%', display: 'inline-block' }} />
                        Live · {poll.endDate && poll.endDate !== 'N/A' ? `Closes ${new Date(poll.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Ongoing'}
                      </span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>{totalVotes.toLocaleString()} votes</span>
                    </div>
                    <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1.3, letterSpacing: '-.01em', marginBottom: 14 }}>{poll.question}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {poll.options.slice(0, 4).map(opt => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                        const isLead = topOption !== null && opt.id === topOption.id && totalVotes > 0
                        return (
                          <div key={opt.id} style={{ position: 'relative', padding: '10px 14px', background: 'hsl(var(--container-low))', border: `1px solid ${isLead ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: isLead ? 'rgba(0,107,63,.18)' : 'rgba(0,107,63,.1)' }} />
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontFamily: "'Public Sans', sans-serif", fontSize: 12.5, fontWeight: 800, letterSpacing: '-.005em', color: isLead ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))' }}>
                              <span>{opt.label}</span>
                              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid hsl(var(--border))' }}>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>Login to cast your vote</span>
                      <Link
                        to="/polls"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'hsl(var(--primary))', color: '#fff', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, borderRadius: 4, textDecoration: 'none' }}
                      >
                        Cast vote <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link
              to="/polls"
              className="md:hidden mt-8 flex items-center justify-center gap-2 w-full h-12 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
              style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
            >
              View all polls
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── Latest updates ─────────────────────────────────────── */}
      <section aria-labelledby="updates-heading" className="pt-16 md:pt-24 pb-16 md:pb-32 bg-white">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
          <div className="flex justify-between items-end mb-10 md:mb-12">
            <div>
              <span className="text-primary font-bold tracking-tight text-micro mb-3 block">Updates</span>
              <h2 id="updates-heading" className="text-2xl md:text-3xl font-meta font-bold text-on-surface tracking-tight">Latest updates</h2>
              <p className="text-xs text-muted-foreground/60 mt-2">Stories from our communities, branches, and partners.</p>
              <BrandLine className="mt-4" />
            </div>
            <Link
              to="/blog"
              className="hidden md:inline-flex items-center gap-2 text-primary font-meta font-bold tracking-tight text-xs hover:underline"
            >
              View all news
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {latestPosts.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[16/10] bg-muted animate-pulse" />
                  <div className="h-4 bg-muted animate-pulse w-3/4" />
                  <div className="h-3 bg-muted animate-pulse w-1/2" />
                </div>
              ))
            ) : (
              latestPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                  <div className="aspect-[16/10] overflow-hidden mb-4 md:mb-6 border border-border/60 bg-muted">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                        <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">The Base</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-micro font-meta font-bold text-primary tracking-tight">{post.category}</span>
                    <span className="text-micro text-muted-foreground font-meta">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-meta font-bold text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))
            )}
          </div>

          {/* Mobile-only view all button */}
          <Link
            to="/blog"
            className="md:hidden mt-10 flex items-center justify-center gap-2 w-full h-12 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
            style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
          >
            View all news
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section aria-labelledby="cta-heading" className="px-5 sm:px-8 pt-16 md:pt-24 pb-16 md:pb-32 bg-white" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="max-w-[1280px] mx-auto">
          <div
            className="relative z-20 bg-on-surface overflow-hidden shadow-[0_48px_96px_-16px_rgba(0,0,0,0.5)]"
            style={{ borderRadius: 'clamp(12px, 3vw, 32px)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

            <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 md:px-24 md:py-24 flex flex-col items-center text-center">
              <div className="max-w-4xl">
                <span className="text-accent font-meta font-bold tracking-tight text-xs mb-4 md:mb-6 block">Ready to build Ghana?</span>
                <h2
                  id="cta-heading"
                  className="font-meta font-bold text-white mb-6 md:mb-8 leading-[1.1] tracking-tighter"
                  style={{ fontSize: 'clamp(28px, 6vw, 60px)' }}
                >
                  Join the Movement Shaping Ghana's Future.
                </h2>
                <p className="text-base md:text-xl text-white/80 mb-8 md:mb-12 leading-relaxed font-body-md max-w-2xl mx-auto">
                  Be part of a growing movement focused on jobs, accountability, and a stronger future for the next generation.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center mb-8 md:mb-12">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
                    style={{ background: 'hsl(var(--accent))', color: '#000', borderRadius: 2 }}
                  >
                    Register Now
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </Link>
                  <Link
                    to="/our-agenda"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
                    style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
                  >
                    Get Involved
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {['Base Ghana', 'Base Diaspora', 'Free Registration'].map((label) => (
                    <span
                      key={label}
                      className="px-4 py-1.5 rounded-full font-meta font-bold text-white/80 tracking-tight"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
