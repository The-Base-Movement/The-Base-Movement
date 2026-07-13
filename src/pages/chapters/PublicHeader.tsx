import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BrandLine } from '@/components/ui/BrandLine'

interface PublicHeaderProps {
  totalChapters: number
}

export function PublicHeader({ totalChapters }: PublicHeaderProps) {
  return (
    <header
      className="bg-white border-b border-stone-200"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Decorative pattern — matches Polls/Press hero treatment */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          left: '-5%',
          width: '55%',
          height: '220%',
          background: 'radial-gradient(ellipse at center, rgba(0,107,63,0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/noise.png')",
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      />
      <div
        className="max-w-7xl mx-auto px-4 md:px-8 py-16"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Breadcrumbs />
        <div className="mt-6">
          <p className="text-brand-green text-[11px] font-bold tracking-[0.14em] uppercase mb-3">
            Global Community
          </p>
          <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6">
            Base Diaspora
          </h1>
          <BrandLine />
          <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
            Connect with Ghanaians and friends of Ghana around the world who are contributing their
            skills, networks, ideas, and practical support toward a stronger future for Ghana.
          </p>
          <p className="text-stone-400 mt-3 font-medium text-xs md:text-sm">
            {totalChapters} diaspora communities across countries and cities
          </p>
        </div>
      </div>
    </header>
  )
}
