import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Globe } from 'lucide-react'
import { adminService, type BlogPost } from '@/services/adminService'
import { usePerformance } from '@/context/PerformanceContext'
import { Button } from '@/components/ui/neon-button'
import { useBranding } from '@/hooks/useBranding'

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
  const { lowBandwidthMode } = usePerformance()

  useEffect(() => {
    adminService.getBlogPosts().then(data => setLatestPosts(data.slice(0, 3))).catch(() => {})
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
      {/* Hero Section */}
      <section 
        aria-labelledby="hero-heading"
        className="relative bg-on-surface text-white pt-32 pb-32 md:pt-40 md:pb-40 overflow-hidden border-b-[8px] border-accent group"
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
        <div className="max-w-[1280px] mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 id="hero-heading" className="text-5xl md:text-h1 font-meta font-bold mb-4 leading-[1.1] tracking-tighter">
              Ghana First,<br />Jobs for the youth!
            </h1>
            <div className="flex justify-center md:justify-start">
              <div className="flex h-1 w-24 mb-6">
                <div className="flex-1 bg-destructive" />
                <div className="flex-1 bg-accent" />
                <div className="flex-1 bg-primary" />
              </div>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-2xl mb-10 leading-relaxed font-body-md mx-auto md:mx-0">
              A global political movement uniting citizens to build a stronger, more prosperous Ghana through industry and innovation.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Button asChild variant="gold" size="lg" className="shadow-2xl shadow-brand-gold/20 w-full sm:w-auto">
                <Link to="/register">
                  Register Now <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link to="/our-agenda">
                  Read the Plan
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
                <MapPin className="text-primary w-8 h-8" /> Base Ghana
              </h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-body-md">
                For Ghanaians living in Ghana. Join our grassroots movement and make your voice heard in the development of our great nation.
              </p>
              <Button asChild variant="primary" className="w-full sm:w-auto">
                <Link to="/register?platform=GHANA">
                  Register for Base Ghana <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            <div className="border-t-[4px] border-accent pt-8 group">
              <h3 className="text-h3 font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight">
                <Globe className="text-accent w-8 h-8" /> Base Diaspora
              </h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-body-md">
                For Ghanaians and friends of Ghana living abroad. Stay connected and contribute to Ghana's progress from anywhere in the world.
              </p>
              <Button asChild variant="gold" className="w-full sm:w-auto">
                <Link to="/register?platform=DIASPORA">
                  Register for Diaspora <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
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
            <div className="flex h-1 w-24 mb-6">
              <div className="flex-1 bg-destructive" />
              <div className="flex-1 bg-accent" />
              <div className="flex-1 bg-primary" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="border-l-2 border-destructive pl-6">
              <span className="text-destructive font-meta font-bold tracking-tight text-xs mb-3 block">Our mission</span>
              <h3 className="text-2xl font-meta font-bold mb-4 tracking-tight text-white">Actionable agenda</h3>
              <p className="text-muted-foreground/60 leading-relaxed font-body-md text-sm">
                To deliver an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians, covering education, governance, industrialisation, infrastructure, institutional reform, and agriculture.
              </p>
            </div>
            <div className="border-l-2 border-accent pl-6">
              <span className="text-accent font-meta font-bold tracking-tight text-xs mb-3 block">Our values</span>
              <h3 className="text-2xl font-meta font-bold mb-4 tracking-tight text-white">Patriotism, honesty, discipline</h3>
              <p className="text-muted-foreground/60 leading-relaxed font-body-md text-sm">
                We are guided by love of country, transparency in leadership, and the moral courage to do what is right for Ghana.
              </p>
            </div>
            <div className="border-l-2 border-primary pl-6">
              <span className="text-primary font-meta font-bold tracking-tight text-xs mb-3 block">Our vision</span>
              <h3 className="text-2xl font-meta font-bold mb-4 tracking-tight text-white">A transformed nation</h3>
              <p className="text-muted-foreground/60 leading-relaxed font-body-md text-sm">
                A Ghana with quality education, lean accountable government, industrialisation, tourism, and agro-processing, quality infrastructure, comprehensive institutional reform, and expertise-led agriculture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Stark Typography */}
      <section aria-labelledby="stats-heading" className="py-24 md:py-32 bg-background border-y border-border/60">
        <div className="max-w-[1280px] mx-auto px-8">
          <h2 id="stats-heading" className="sr-only">Movement Statistics</h2>
          <dl className="grid md:grid-cols-2 gap-16 md:gap-8 items-center">
            <div className="pl-8 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-destructive via-accent to-primary" />
              <dd className="m-0">
                <AnimatedCounter target={355482} />
              </dd>
              <dt className="text-sm text-on-surface/40 mt-4 tracking-tight font-bold">Citizens joined</dt>
            </div>
            <div className="pl-8 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-destructive via-accent to-primary" />
              <dd className="m-0">
                <AnimatedCounter target={2} />
              </dd>
              <dt className="text-sm text-on-surface/40 mt-4 tracking-tight font-bold">Global platforms</dt>
            </div>
          </dl>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section aria-labelledby="updates-heading" className="pt-24 pb-48 bg-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary font-bold tracking-tight text-[10px] mb-3 block">Updates</span>
              <h2 id="updates-heading" className="text-3xl md:text-h2 font-meta font-bold text-on-surface tracking-tight">Latest updates</h2>
              <div className="flex h-1 w-24 mt-4">
                <div className="flex-1 bg-destructive" />
                <div className="flex-1 bg-accent" />
                <div className="flex-1 bg-primary" />
              </div>
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
                        <span className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">The Base</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-meta font-bold text-primary tracking-tight">{post.category}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-meta">
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
                  Join 355,482 people building Ghana’s future.
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground/80 mb-12 leading-relaxed font-body-md max-w-2xl mx-auto">
                  From Ghana to the diaspora, The Base is more than a platform - it's a collective engine for national industrialization and economic dignity.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-12">
                  <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
                    <Link to="/register" className="flex items-center justify-center gap-3">
                      Join The Base <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                    <Link to="/our-agenda" className="flex items-center justify-center gap-3">
                      See the Plan <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Row - Pill Badges */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {['Base Ghana', 'Base Diaspora', 'Free Registration'].map((label) => (
                    <span key={label} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-meta font-bold text-muted-foreground/80 tracking-tight">
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
