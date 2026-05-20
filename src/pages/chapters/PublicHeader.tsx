import { Breadcrumbs } from '@/components/Breadcrumbs'

interface PublicHeaderProps {
  totalChapters: number
}

export function PublicHeader({ totalChapters }: PublicHeaderProps) {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <Breadcrumbs />
        <div className="mt-6">
          <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6">
            Movement Chapters
          </h1>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
          <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
            Connect with your local community through our global network of {totalChapters}+
            regional hubs.
          </p>
        </div>
      </div>
    </header>
  )
}
