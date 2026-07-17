import { BrandLine } from '@/components/ui/BrandLine'

export function FoundationSection() {
  return (
    <section
      aria-labelledby="foundation-heading"
      className="py-16 md:py-24 bg-on-surface text-white"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Eagle watermark */}
      <img
        src="/branding/patterns/eagle-in-flight.webp"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-4%',
          bottom: '-10%',
          width: '45%',
          maxWidth: 520,
          opacity: 0.06,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'invert(1)',
        }}
      />
      <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mb-10 md:mb-16" data-fade>
          <h2
            id="foundation-heading"
            className="font-meta font-medium leading-tight mb-4 tracking-tighter"
            style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}
          >
            Our Foundation
          </h2>
          <BrandLine />
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12" data-fade-stagger>
          <div className="border-l-2 border-destructive pl-6">
            <span className="text-destructive font-meta font-medium tracking-tight text-xs mb-3 block">
              Core Pillar 01
            </span>
            <h3 className="text-xl md:text-2xl font-meta font-medium mb-4 tracking-tight text-white">
              Economic Responsibility
            </h3>
            <p className="text-white/80 leading-relaxed font-body-md text-sm">
              We advocate for the transparent management of national resources to ensure they are
              invested in projects that create sustainable, long‑term jobs for our youth.
            </p>
          </div>
          <div className="border-l-2 border-accent pl-6">
            <span className="text-accent font-meta font-medium tracking-tight text-xs mb-3 block">
              Core Pillar 02
            </span>
            <h3 className="text-xl md:text-2xl font-meta font-medium mb-4 tracking-tight text-white">
              Youth Participation
            </h3>
            <p className="text-white/80 leading-relaxed font-body-md text-sm">
              We believe young people must be at the heart of our progress, equipped with the skills
              and opportunities to lead Ghana's development.
            </p>
          </div>
          <div className="border-l-2 border-primary pl-6">
            <span className="text-primary font-meta font-medium tracking-tight text-xs mb-3 block">
              Core Pillar 03
            </span>
            <h3 className="text-xl md:text-2xl font-meta font-medium mb-4 tracking-tight text-white">
              Integrity & Accountability
            </h3>
            <p className="text-white/80 leading-relaxed font-body-md text-sm">
              A movement built on trust. We believe every leader must be answerable to the citizens
              they represent and the promises they make.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
