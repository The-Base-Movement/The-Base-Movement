import { Link } from 'react-router-dom'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { BrandLine } from '@/components/ui/BrandLine'
import { type BlogPost } from '@/services/adminService'
import 'swiper/css'
import 'swiper/css/pagination'

interface HeroSectionProps {
  heroBgUrl: string
  latestPosts: BlogPost[]
  mousePos: { x: number; y: number }
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  lowBandwidthMode: boolean
}

const fallbackUpdates = [
  {
    title: 'Youth jobs remain the mission',
    category: 'Movement',
    excerpt: 'Field notes and updates from branches working toward productive local economies.',
    imageUrl: '/branding/base-banner-image.png',
    slug: 'updates',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Branches are organising locally',
    category: 'Chapters',
    excerpt: 'Follow the latest work from communities, coordinators, and diaspora chapters.',
    imageUrl: '/branding/party-headquarters-image.webp',
    slug: 'updates',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Ghana First in action',
    category: 'Agenda',
    excerpt: 'Clear priorities, accountable leadership, and practical national development.',
    imageUrl: '/branding/hero-background-image.png',
    slug: 'updates',
    publishedAt: new Date().toISOString(),
  },
]

function HeroUpdatesSlider({
  latestPosts,
  lowBandwidthMode,
}: {
  latestPosts: BlogPost[]
  lowBandwidthMode: boolean
}) {
  const updates = latestPosts.length > 0 ? latestPosts.slice(0, 3) : fallbackUpdates

  return (
    <div
      className="w-full max-w-[360px] md:max-w-[400px]"
      aria-label="Latest movement updates"
      style={{ filter: 'drop-shadow(0 24px 50px rgba(0,0,0,.35))' }}
    >
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={updates.length > 1}
        autoplay={
          lowBandwidthMode || updates.length < 2
            ? false
            : { delay: 4200, disableOnInteraction: false }
        }
        pagination={{ clickable: true }}
        style={{ paddingBottom: 34 }}
      >
        {updates.map((post) => (
          <SwiperSlide key={post.slug}>
            <Link
              to={latestPosts.length > 0 ? `/blog/${post.slug}` : '/blog'}
              className="group block overflow-hidden border border-white/20 bg-white/95 text-on-surface"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <div className="aspect-[16/11] overflow-hidden bg-muted">
                <img
                  src={post.imageUrl || '/branding/base-banner-image.png'}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  decoding="async"
                  loading="lazy"
                />
              </div>
              <div className="p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
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
                <h2 className="font-meta text-lg md:text-xl font-medium leading-tight tracking-tight text-on-surface group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-meta font-medium text-primary">
                  Read update
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export function HeroSection({
  heroBgUrl,
  latestPosts,
  mousePos,
  onMouseMove,
  lowBandwidthMode,
}: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="home-hero relative text-white flex items-center overflow-hidden border-b-[8px] border-accent group"
      style={{ minHeight: 'clamp(560px, 80vh, 780px)' }}
      onMouseMove={onMouseMove}
    >
      {!lowBandwidthMode ? (
        <>
          <img
            src={heroBgUrl || '/hero-bg.png'}
            alt=""
            aria-hidden="true"
            className="home-hero-bg absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
          />
          <div
            className="absolute inset-0 z-0 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
            style={{
              backgroundImage: `url('${heroBgUrl || '/hero-bg.png'}')`,
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

      <div className="page-container py-14 md:py-[80px] relative z-10 flex flex-col md:flex-row items-center md:items-center justify-end md:justify-center gap-8 md:gap-12 w-full h-full">
        <div className="flex-1 text-center md:text-left mt-auto md:mt-0">
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
          <p className="text-white/90 text-sm md:text-base font-body-md max-w-xl mt-4 mb-6 leading-relaxed">
            We are a grassroots movement committed to youth jobs, accountable leadership, and
            national development. Join citizens in Ghana and across the diaspora working for a more
            productive future.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center md:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta text-sm tracking-tight hover:opacity-90 transition-opacity"
              style={{
                background: 'hsl(var(--accent))',
                color: '#000',
                borderRadius: 'var(--button-radius)',
                fontWeight: 'var(--button-font-weight)',
              }}
            >
              Join the Movement
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </Link>
            <Link
              to="/our-agenda"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta text-sm tracking-tight hover:opacity-90 transition-opacity"
              style={{
                background: 'hsl(var(--primary))',
                color: '#fff',
                borderRadius: 'var(--button-radius)',
                fontWeight: 'var(--button-font-weight)',
              }}
            >
              Learn More About Us
            </Link>
          </div>
        </div>

        <div className="hidden sm:flex flex-1 justify-center md:justify-end">
          <HeroUpdatesSlider latestPosts={latestPosts} lowBandwidthMode={lowBandwidthMode} />
        </div>
      </div>
    </section>
  )
}
