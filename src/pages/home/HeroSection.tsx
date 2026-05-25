import { Link } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'

interface HeroSectionProps {
  heroBgUrl: string
  logoUrl: string
  mousePos: { x: number; y: number }
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  lowBandwidthMode: boolean
}

export function HeroSection({
  heroBgUrl,
  logoUrl,
  mousePos,
  onMouseMove,
  lowBandwidthMode,
}: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative bg-on-surface text-white flex items-center overflow-hidden border-b-[8px] border-accent group"
      style={{ minHeight: 'clamp(560px, 80vh, 780px)' }}
      onMouseMove={onMouseMove}
    >
      {!lowBandwidthMode ? (
        <>
          <img
            src={heroBgUrl || '/hero-bg.png'}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity z-0 pointer-events-none"
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
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-on-surface to-on-surface/90 opacity-50" />
      )}

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-on-surface via-on-surface/60 to-transparent" />

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-14 md:py-[80px] relative z-10 flex flex-col md:flex-row items-center md:items-center justify-end md:justify-center gap-8 md:gap-12 w-full h-full">
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

        <div className="hidden sm:flex flex-1 justify-center md:justify-end opacity-90">
          <img
            src={logoUrl}
            alt="The Base"
            className="w-52 md:w-80 lg:w-96 drop-shadow-2xl object-contain"
            decoding="async"
          />
        </div>
      </div>
    </section>
  )
}
