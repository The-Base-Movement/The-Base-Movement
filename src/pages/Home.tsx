import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Globe } from 'lucide-react'
import { adminService, type BlogPost } from '@/services/adminService'
import { usePerformance } from '@/context/PerformanceContext'
import SEO from '@/components/SEO'
import { Button } from '@/components/ui/neon-button'
import { useBranding } from '@/hooks/useBranding'
import { BrandLine } from '@/components/ui/BrandLine'

function AnimatedCounter({ target, duration = 2000, className }: { target: number; duration?: number; className?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  const getColor = (val: number) => {
    if (val <= 100000) return 'hsl(var(--destructive))'
    if (val <= 200001) return 'hsl(var(--accent))'
    return 'hsl(var(--primary))'
  }

  return (
    <div 
      ref={ref} 
      className={className || "text-6xl md:text-[5rem] font-meta font-bold tracking-tighter transition-colors duration-300"} 
      style={!className ? { color: getColor(count) } : undefined}
    >
      {count.toLocaleString()}
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
    diaspora: 0
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
        className="relative bg-on-surface text-white min-h-screen flex items-center overflow-hidden border-b-[8px] border-accent group"
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
        <div className="max-w-[1280px] mx-auto px-8 py-20 relative z-10 flex flex-col md:flex-row items-center gap-12 w-full">
          <div className="flex-1 text-center md:text-left">
            <h1 id="hero-heading" className="text-5xl md:text-h1 font-meta font-bold mb-4 leading-[1.1] tracking-tighter">
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
              <h3 className="text-h3 font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight">
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
              <h3 className="text-h3 font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight">
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

      {/* Stats Section - Modernized Hardened Typography */}
      <section aria-labelledby="stats-heading" className="py-32 bg-stone-50 border-y border-border/40 relative overflow-hidden">
        {/* Subtle background texture for premium feel */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" />
        
        <div className="max-w-[1280px] mx-auto px-8 relative z-10">
          <h2 id="stats-heading" className="sr-only">Movement Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {/* Stat Pillar 01 */}
            <div className="group">
              <BrandLine className="mb-6 opacity-60" />
              <dd className="m-0">
                <AnimatedCounter target={stats.members} className="text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" />
              </dd>
              <dt className="text-micro font-bold text-primary tracking-tight normal-case mb-2">
                Members registered nationwide
              </dt>
              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]">
                Verified citizens joined across the movement's national network.
              </p>
            </div>

            {/* Stat Pillar 02 */}
            <div className="group">
              <BrandLine className="mb-6 opacity-60" />
              <dd className="m-0">
                <AnimatedCounter target={stats.chapters} className="text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" />
              </dd>
              <dt className="text-micro font-bold text-accent tracking-tight normal-case mb-2">
                Community branches active in nearly every district
              </dt>
              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]">
                Local community branches established and operating nationwide.
              </p>
            </div>

            {/* Stat Pillar 03 */}
            <div className="group">
              <BrandLine className="mb-6 opacity-60" />
              <dd className="m-0">
                <AnimatedCounter target={stats.regions} className="text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" />
              </dd>
              <dt className="text-micro font-bold text-destructive tracking-tight normal-case mb-2">
                Movement presence across all 16 regions
              </dt>
              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]">
                Full representation and active coordination across every administrative region.
              </p>
            </div>

            {/* Stat Pillar 04 */}
            <div className="group">
              <BrandLine className="mb-6 opacity-60" />
              <dd className="m-0">
                <AnimatedCounter target={stats.diaspora} className="text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" />
              </dd>
              <dt className="text-micro font-bold text-on-surface/80 tracking-tight normal-case mb-2">
                Diaspora supporters registered online
              </dt>
              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]">
                Global Ghanaians committed to supporting national development from abroad.
              </p>
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
