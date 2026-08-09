import { BrandLine } from '@/components/ui/BrandLine'

export function FoundationSection() {
  return (
    <section
      aria-labelledby="foundation-heading"
      className="py-20 md:py-28 bg-[#181d19] text-white relative overflow-hidden"
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
          opacity: 0.05,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'invert(1)',
        }}
      />
      <div className="page-container relative z-10">
        <div className="mb-12 md:mb-16 max-w-xl" data-fade>
          <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-accent font-meta block mb-2">
            Core Beliefs
          </span>
          <h2
            id="foundation-heading"
            className="font-meta font-medium leading-tight mb-4 tracking-tight text-3xl md:text-5xl text-white"
          >
            Our Foundation
          </h2>
          <BrandLine />
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12" data-fade-stagger>
          <div className="border-l-2 border-destructive pl-6">
            <span className="text-destructive font-meta font-medium tracking-tight text-[11px] uppercase mb-2 block">
              Pillar 01
            </span>
            <h3 className="text-lg md:text-xl font-meta font-medium mb-3 tracking-tight text-white">
              Economic Responsibility
            </h3>
            <p className="text-white/75 leading-relaxed font-body-md text-sm">
              We advocate for the transparent management of national resources to ensure they are
              invested in projects that create sustainable, long‑term jobs for our youth.
            </p>
          </div>
          <div className="border-l-2 border-accent pl-6">
            <span className="text-accent font-meta font-medium tracking-tight text-[11px] uppercase mb-2 block">
              Pillar 02
            </span>
            <h3 className="text-lg md:text-xl font-meta font-medium mb-3 tracking-tight text-white">
              Youth Participation
            </h3>
            <p className="text-white/75 leading-relaxed font-body-md text-sm">
              We believe young people must be at the heart of our progress, equipped with the skills
              and opportunities to lead Ghana's development.
            </p>
          </div>
          <div className="border-l-2 border-primary pl-6">
            <span className="text-primary font-meta font-medium tracking-tight text-[11px] uppercase mb-2 block">
              Pillar 03
            </span>
            <h3 className="text-lg md:text-xl font-meta font-medium mb-3 tracking-tight text-white">
              Integrity & Accountability
            </h3>
            <p className="text-white/75 leading-relaxed font-body-md text-sm">
              A movement built on trust. We believe every leader must be answerable to the citizens
              they represent and the promises they make.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
