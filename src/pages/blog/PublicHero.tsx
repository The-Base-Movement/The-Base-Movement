import { Breadcrumbs } from '@/components/Breadcrumbs'

export function PublicHero() {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <Breadcrumbs />
        <div className="mt-6">
          <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
            <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 40 }}>
              newspaper
            </span>
            Updates & Articles
          </h1>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
          <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
            Perspectives from within the movement on governance, youth empowerment, diaspora
            engagement and the future of Ghana.
          </p>
        </div>
      </div>
    </header>
  )
}
