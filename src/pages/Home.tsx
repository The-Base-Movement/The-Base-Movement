import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Globe } from 'lucide-react'
import { adminService, type BlogPost } from '@/services/adminService'
import { usePerformance } from '@/context/PerformanceContext'
import SEO from '@/components/SEO'
import { Button } from '@/components/ui/neon-button'
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
      {/* top accent bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '5px', background: accent }} />
      {/* corner dot */}
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
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <main className="bg-background font-body-md">
      <SEO 
        title="Ghana First, Jobs for the Youth!"
        canonical="/"
        jsonLd={organizationSchema}
      />
      {/* Hero Section */}
      <section 
        aria-labelledby="hero-heading"
        className="relative bg-on-surface text-white min-h-[560px] flex items-center overflow-hidden border-b-[8px] border-accent group"
        onMouseMove={handleMouseMove}
      >
        {!lowBandwidthMode ? (
          <>
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity transition-opacity duration-1000 group-hover:opacity-20" style={{ backgroundImage: `url('${settings.hero_bg_url || "/hero-bg.png"}')` }}></div>
            
            {/* Color Spotlight */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
              style={{ 
                backgroundImage: `url('${settings.hero_bg_url || "/hero-bg.png"}')`,
                WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
              }}
            ></div>
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-on-surface to-on-surface/90 opacity-50"></div>
        )}

        <div className="absolute inset-0 z-0 bg-gradient-to-t from-on-surface via-on-surface/60 to-transparent"></div>
        <div className="max-w-[1280px] mx-auto px-8 py-[80px] relative z-10 flex flex-col md:flex-row items-center gap-12 w-full">
          <div className="flex-1 text-center md:text-left">
            <h1 id="hero-heading" className="text-[48px] md:text-[64px] font-meta font-extrabold mb-2 leading-[1.05] tracking-tighter">
              Ghana First,<br />Jobs for the youth!
            </h1>
            <div className="flex justify-center md:justify-start">
              <BrandLine />
            </div>
            <p className="text-white/90 text-sm md:text-base font-body-md max-w-xl animate-in slide-in-from-bottom duration-1000 delay-200">
              We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Button asChild variant="gold" size="lg" className="shadow-2xl shadow-brand-gold/20 w-full sm:w-auto">
                <Link to="/register">
                  Join the Movement <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link to="/our-agenda">
                  Learn More About Us
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end opacity-90 relative">
            <img src={settings.logo_url} alt="The Base" className="w-64 md:w-96 drop-shadow-2xl transition-all duration-700 object-contain"  decoding="async" />
          </div>
        </div>
      </section>

      {/* Ghana vs Diaspora - Stark architectural blocks */}
      <section aria-labelledby="platforms-heading" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <h2 id="platforms-heading" className="sr-only">Our Platforms</h2>
          <div className="grid md:grid-cols-2 gap-12 md:gap-24">
            <div className="border-t-[4px] border-primary pt-8 group">
              <h3 className="text-[28px] md:text-[32px] font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight leading-tight">
                <MapPin className="text-primary w-8 h-8" /> For Citizens in Ghana.
              </h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-body-md">
                Get involved in your district. Join your local branch, take part in community activity, and support practical action for jobs and development.
              </p>
              <Button asChild variant="primary" className="w-full sm:w-auto">
                <Link to="/register?platform=GHANA">
                  Join Base Ghana <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            <div className="border-t-[4px] border-accent pt-8 group">
              <h3 className="text-[28px] md:text-[32px] font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight leading-tight">
                <Globe className="text-accent w-8 h-8" /> For Ghanaians Abroad.
              </h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-body-md">
                Stay connected to home and support national development from abroad through your skills, networks, and commitment to Ghana’s future.
              </p>
              <Button asChild variant="gold" className="w-full sm:w-auto">
                <Link to="/register?platform=DIASPORA">
                  Join Base Diaspora <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision, Mission, Values - Editorial Grid */}
      <section aria-labelledby="foundation-heading" className="py-24 bg-on-surface text-white border-t border-white/5">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="mb-16">
            <h2 id="foundation-heading" className="text-4xl md:text-5xl font-meta font-bold leading-tight mb-4 tracking-tighter">
              Our Foundation
            </h2>
            <BrandLine />
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="border-l-2 border-destructive pl-6">
              <span className="text-destructive font-meta font-bold tracking-tight text-xs mb-3 block">Core Pillar 01</span>
              <h3 className="text-2xl font-meta font-bold mb-4 tracking-tight text-white">Economic Responsibility</h3>
              <p className="text-white/80 leading-relaxed font-body-md text-sm">
                We advocate for the transparent management of national resources to ensure they are invested in projects that create sustainable, long‑term jobs for our youth.
              </p>
            </div>
            <div className="border-l-2 border-accent pl-6">
              <span className="text-accent font-meta font-bold tracking-tight text-xs mb-3 block">Core Pillar 02</span>
              <h3 className="text-2xl font-meta font-bold mb-4 tracking-tight text-white">Youth Participation</h3>
              <p className="text-white/80 leading-relaxed font-body-md text-sm">
                We believe young people must be at the heart of our progress, equipped with the skills and opportunities to lead Ghana’s development.
              </p>
            </div>
            <div className="border-l-2 border-primary pl-6">
              <span className="text-primary font-meta font-bold tracking-tight text-xs mb-3 block">Core Pillar 03</span>
              <h3 className="text-2xl font-meta font-bold mb-4 tracking-tight text-white">Integrity & Accountability</h3>
              <p className="text-white/80 leading-relaxed font-body-md text-sm">
                A movement built on trust. We believe every leader must be answerable to the citizens they represent and the promises they make.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section — redesigned stat cards: red → gold → black → green */}
      <section aria-labelledby="stats-heading" className="py-24 bg-[#fafaf6] border-y border-border/40">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-end justify-between mb-5">
            <h2 id="stats-heading" className="font-meta font-extrabold text-xl tracking-tight text-on-surface">
              Movement at a glance
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.06em]">Updated · Q2 2026</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* RED — Regions */}
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
            {/* GOLD — Branches */}
            <StatCard
              accent="#DAA520"
              eye="Branches"
              value={stats.chapters}
              label="Community branches active in nearly every district"
              sparkHeights={[5,6,7,7,9,10,10,12,13,14,16,18]}
              delta={stats.chaptersDelta}
              deltaIcon="up"
            />
            {/* BLACK — Diaspora */}
            <StatCard
              accent="#1A1A1A"
              eye="Diaspora"
              value={stats.diaspora}
              label="Global Ghanaians supporting from abroad"
              sparkHeights={[3,4,4,5,7,7,10,11,13,14,16,18]}
              delta={stats.diasporaDelta}
              deltaIcon="up"
            />
            {/* GREEN — Members */}
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

      {/* Movement Roadmap */}
      <section aria-labelledby="roadmap-heading" className="py-24 bg-white border-b border-border/30">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="mb-12">
            <span className="text-[10px] font-bold tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">Movement roadmap</span>
            <h2 id="roadmap-heading" className="text-3xl font-meta font-bold text-on-surface tracking-tight mb-1">Where we are, what's next.</h2>
          </div>

          {/* Horizontal milestone track */}
          <div className="relative">
            {/* Gradient connecting line */}
            <div
              className="absolute left-3 right-0 hidden md:block"
              style={{
                top: '12px',
                height: '3px',
                background: 'linear-gradient(to right, #CE1126, #DAA520, #181d19, #006B3F)',
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { color: '#CE1126', done: true,  year: '2024',       title: 'Foundation laid',        body: 'Movement formally launched. First 50 branches opened across Greater Accra and Ashanti.', icon: 'check' },
                { color: '#DAA520', done: true,  year: '2025',       title: 'National coverage',      body: 'Reached presence in all 16 regions with 1,000+ branches and a verified diaspora chapter network.', icon: 'check' },
                { color: '#181d19', done: false, year: '2026 · Now', title: 'Jobs program scale-up',  body: '1M-job plan launched. First 50,000 youth in apprenticeships across four priority sectors.', icon: 'bolt', current: true },
                { color: '#006B3F', done: false, year: '2028',       title: 'National election',      body: 'Field every promise we made. Hold every leader accountable to the published Plan.', icon: 'target' },
              ].map((ms) => (
                <div key={ms.year} className="relative pt-16 md:pr-4">
                  {/* Dot */}
                  <div
                    className="absolute top-0 left-0 w-6 h-6 rounded-full flex items-center justify-center border-4"
                    style={{
                      background: ms.done ? ms.color : '#fff',
                      borderColor: ms.color,
                    }}
                  >
                    {ms.done && (
                      <svg viewBox="0 0 10 10" width="8" height="8" fill="white"><path d="M1.5 5 L4 7.5 L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {ms.current && !ms.done && (
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ms.color }} />
                    )}
                  </div>
                  <div
                    className="text-[11px] font-bold tracking-[.06em] uppercase mb-1.5 font-meta"
                    style={{ color: 'hsl(var(--on-surface-muted))' }}
                  >
                    {ms.year}
                  </div>
                  <h4 className="font-meta font-extrabold text-[15px] tracking-[-0.01em] text-on-surface mb-1.5 leading-snug">
                    {ms.title}
                  </h4>
                  <p className="text-[12px] text-muted-foreground leading-[1.5] font-body-md">
                    {ms.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section aria-labelledby="updates-heading" className="pt-24 pb-48 bg-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary font-bold tracking-tight text-micro mb-3 block">Updates</span>
              <h2 id="updates-heading" className="text-3xl md:text-h2 font-meta font-bold text-on-surface tracking-tight">Latest updates</h2>
              <p className="text-xs text-muted-foreground/60 mt-2">Stories from our communities, branches, and partners.</p>
              <BrandLine className="mt-4" />
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-primary font-meta font-bold tracking-tight text-xs hover:underline">
              View all news <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <div className="aspect-[16/10] overflow-hidden mb-6 border border-border/60 bg-muted">
                    {post.imageUrl ? (
                      <img src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                       decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                        <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">The Base</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-micro font-meta font-bold text-primary tracking-tight">{post.category}</span>
                    <span className="text-micro text-muted-foreground font-meta">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-meta font-bold text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))
            )}
          </div>

          <Button asChild variant="primary" className="md:hidden flex w-full h-12 mt-10">
            <Link to="/blog" className="flex items-center justify-center gap-2">
              View all news <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Decisive CTA Section */}
      <section aria-labelledby="cta-heading" className="relative px-8 pb-32 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="relative z-20 bg-on-surface rounded-[2rem] overflow-hidden shadow-[0_48px_96px_-16px_rgba(0,0,0,0.5)] -mt-20">
            {/* Subtle Texture/Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
            
            <div className="relative z-10 p-12 md:p-24 flex flex-col items-center text-center">
              {/* Content Column */}
              <div className="max-w-4xl">
                <span className="text-accent font-meta font-bold tracking-tight text-xs mb-6 block">Ready to build Ghana?</span>
                <h2 id="cta-heading" className="text-4xl md:text-6xl font-meta font-bold text-white mb-8 leading-[1.1] tracking-tighter">
                  Join the Movement Shaping Ghana’s Future.
                </h2>
                <p className="text-lg md:text-xl text-white/80 mb-12 leading-relaxed font-body-md max-w-2xl mx-auto">
                  Be part of a growing movement focused on jobs, accountability, and a stronger future for the next generation.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-12">
                  <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
                    <Link to="/register" className="flex items-center justify-center gap-3">
                      Register Now <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                    <Link to="/our-agenda" className="flex items-center justify-center gap-3">
                      Get Involved <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Row - Pill Badges */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {['Base Ghana', 'Base Diaspora', 'Free Registration'].map((label) => (
                    <span key={label} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-micro font-meta font-bold text-white/80 tracking-tight">
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
