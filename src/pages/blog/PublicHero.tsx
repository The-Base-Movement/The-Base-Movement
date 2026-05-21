import { Breadcrumbs } from '@/components/Breadcrumbs'

export function PublicHero() {
  return (
    <header className="bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-8 md:pb-12">
        <Breadcrumbs />
        <div className="mt-5">
          <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-primary font-meta block mb-3">
            The Base Movement
          </span>
          <h1 className="text-stone-900 text-[2rem] md:text-5xl font-meta font-bold tracking-tighter leading-[1.1] mb-4">
            Updates &amp; Articles
          </h1>
          <p className="text-stone-500 max-w-2xl leading-relaxed font-medium text-sm md:text-base">
            Perspectives from within the movement on governance, youth empowerment, diaspora
            engagement and the future of Ghana.
          </p>
        </div>
      </div>

      {/* Ghana flag tricolor accent bar */}
      <div style={{ display: 'flex', height: 4 }}>
        <div style={{ flex: 1, background: 'var(--brand-red)' }} />
        <div style={{ flex: 1, background: 'var(--brand-gold)' }} />
        <div style={{ flex: 1, background: 'var(--brand-green)' }} />
      </div>
    </header>
  )
}
