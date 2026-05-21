import { Breadcrumbs } from '@/components/Breadcrumbs'

export function PublicHero() {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <Breadcrumbs />
        <div className="mt-6">
          <div className="mb-6">
            <span
              className="material-symbols-outlined text-brand-green block mb-2 md:hidden"
              style={{ fontSize: 32 }}
            >
              newspaper
            </span>
            <h1 className="text-stone-900 text-3xl md:text-5xl font-meta font-bold tracking-tighter flex items-center gap-3">
              <span
                className="material-symbols-outlined text-brand-green hidden md:inline"
                style={{ fontSize: 40 }}
              >
                newspaper
              </span>
              Updates & Articles
            </h1>
          </div>
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
