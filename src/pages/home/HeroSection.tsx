import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'
import { TrustSignals, SIGNUP_TRUST } from '@/components/ui/TrustSignals'
import { getBlogImageUrl } from '@/lib/blogImages'
import { type BlogPost } from '@/services/adminService'

interface HeroSectionProps {
  heroBgUrl: string
  latestPosts: BlogPost[]
  mousePos: { x: number; y: number }
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  lowBandwidthMode: boolean
}

const DEFAULT_HERO_BG = '/branding/hero-background-image.webp'

function HeroUpdatesSlider({ latestPosts }: { latestPosts: BlogPost[] }) {
  const updates = latestPosts.slice(0, 3)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (updates.length < 2) return undefined

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % updates.length)
    }, 4200)

    return () => window.clearInterval(intervalId)
  }, [updates.length])

  const post = updates[currentIndex]

  return (
    <div className="w-full max-w-[320px] md:max-w-[360px]" aria-label="Latest movement updates">
      {updates.length === 0 || !post ? (
        <Link
          to="/blog"
          className="group block overflow-hidden border border-white/20 bg-white/95 text-on-surface"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div className="aspect-[16/7] overflow-hidden bg-muted">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/80">
              <span className="text-micro font-semibold tracking-tight text-muted-foreground/80">
                Latest updates
              </span>
            </div>
          </div>
          <div className="p-4">
            <h2 className="font-meta text-base md:text-lg font-medium leading-tight tracking-tight text-on-surface">
              Latest stories are loading
            </h2>
          </div>
        </Link>
      ) : (
        <div
          className="group block overflow-hidden border border-white/20 bg-white/95 text-on-surface"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <Link to={`/blog/${post.slug}`} aria-label={`Read update: ${post.title}`}>
            <div className="aspect-[16/7] overflow-hidden bg-muted">
              <img
                src={getBlogImageUrl(post.imageUrl)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                decoding="async"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-micro font-meta font-medium text-primary tracking-tight">
                  {post.category}
                </span>
                <span className="text-micro font-meta text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <h2 className="font-meta text-base md:text-lg font-medium leading-tight tracking-tight text-on-surface group-hover:text-primary transition-colors">
                {post.title}
              </h2>
            </div>
          </Link>
          {updates.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-3">
              {updates.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MobileHeroUpdatesTicker({ latestPosts }: { latestPosts: BlogPost[] }) {
  const updates = latestPosts.slice(0, 5)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (updates.length < 2) return undefined

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % updates.length)
    }, 3600)

    return () => window.clearInterval(intervalId)
  }, [updates.length])

  const post = updates[currentIndex]

  return (
    <section
      className="sm:hidden border-b border-accent/70 bg-primary text-primary-foreground"
      aria-label="Urgent updates"
    >
      <div className="page-container py-2.5">
        <div className="flex min-h-[68px] flex-col justify-center gap-2">
          <Link
            to="/blog"
            className="mobile-urgent-badge w-fit shrink-0 rounded-full bg-accent px-3 py-1.5 font-meta text-[10px] font-medium uppercase tracking-[0.08em] text-black"
          >
            <span className="mobile-urgent-badge__dot" aria-hidden="true" />
            Urgent updates
          </Link>

          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {updates.length === 0 || !post ? (
                <Link
                  to="/blog"
                  className="line-clamp-2 font-meta text-sm font-medium leading-snug tracking-tight"
                >
                  Latest movement updates are loading
                </Link>
              ) : (
                <Link
                  to={`/blog/${post.slug}`}
                  className="line-clamp-2 font-meta text-sm font-medium leading-snug tracking-tight"
                  aria-label={`Read update: ${post.title}`}
                >
                  {post.title}
                </Link>
              )}
            </div>

            <span className="material-symbols-outlined shrink-0 pt-0.5" style={{ fontSize: 18 }}>
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HeroSection({
  heroBgUrl,
  latestPosts,
  mousePos,
  onMouseMove,
  lowBandwidthMode,
}: HeroSectionProps) {
  const [failedHeroBgUrl, setFailedHeroBgUrl] = useState<string | null>(null)
  const resolvedHeroBgUrl =
    heroBgUrl && heroBgUrl !== DEFAULT_HERO_BG && failedHeroBgUrl !== heroBgUrl
      ? heroBgUrl
      : DEFAULT_HERO_BG

  return (
    <section
      aria-labelledby="hero-heading"
      className="home-hero relative text-white flex items-end overflow-hidden border-b-[8px] border-accent group"
      style={{ minHeight: '100vh', minBlockSize: '100svh' }}
      onMouseMove={onMouseMove}
    >
      {!lowBandwidthMode ? (
        <>
          <img
            src={DEFAULT_HERO_BG}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="home-hero-bg absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
            onError={() => {
              if (heroBgUrl && resolvedHeroBgUrl !== DEFAULT_HERO_BG) setFailedHeroBgUrl(heroBgUrl)
            }}
          />
          <div
            className="hidden md:block absolute inset-0 z-0 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
            style={{
              backgroundImage: `url('${resolvedHeroBgUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
              maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-black to-black/90 opacity-70" />
      )}

      <div className="home-hero-shade absolute inset-0 z-0" />

      <div className="page-container pb-14 pt-28 md:pb-[90px] md:pt-32 relative z-10 flex flex-col md:flex-row items-stretch md:items-end justify-end gap-8 md:gap-12 w-full min-h-screen">
        <div className="md:flex-1 text-center md:text-left">
          <h1
            id="hero-heading"
            className="font-meta font-medium mb-2 leading-[1.05] tracking-tighter"
            style={{ fontSize: 'clamp(34px, 8vw, 64px)' }}
          >
            Ghana First,
            <br />
            Jobs for the youth!
          </h1>
          <div className="flex justify-center md:justify-start">
            <BrandLine />
          </div>
          <p className="text-white/90 text-sm md:text-base font-body-md max-w-xl mt-4 mb-5 leading-relaxed">
            A grassroots movement for youth jobs, accountable leadership, and national development.
          </p>
          <p className="text-white/70 text-xs md:text-sm font-meta font-medium tracking-tight max-w-xl mb-3">
            Where you live decides how you join, by constituency in Ghana, or by country abroad.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center md:justify-start">
            <Link
              to="/register?platform=GHANA"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta text-sm tracking-tight hover:opacity-90 transition-opacity"
              style={{
                background: 'hsl(var(--accent))',
                color: '#000',
                borderRadius: 'var(--button-radius)',
                fontWeight: 'var(--button-font-weight)',
              }}
            >
              Join in Ghana
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                place
              </span>
            </Link>
            <Link
              to="/register?platform=DIASPORA"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta text-sm tracking-tight hover:opacity-90 transition-opacity"
              style={{
                background: 'hsl(var(--primary))',
                color: '#fff',
                borderRadius: 'var(--button-radius)',
                fontWeight: 'var(--button-font-weight)',
              }}
            >
              Join from Abroad
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                language
              </span>
            </Link>
          </div>
          <div className="home-hero-meta-panel mt-4 md:mt-5">
            <Link
              to="/our-agenda"
              className="inline-flex items-center gap-1.5 font-meta text-xs md:text-sm font-medium tracking-tight text-white/80 hover:text-white transition-colors"
            >
              Learn more about our agenda
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Link>
            <div className="mt-4 flex justify-start">
              <TrustSignals items={SIGNUP_TRUST} tone="dark" className="home-hero-trust-signals" />
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center md:justify-end">
          <HeroUpdatesSlider latestPosts={latestPosts} />
        </div>
      </div>
    </section>
  )
}
