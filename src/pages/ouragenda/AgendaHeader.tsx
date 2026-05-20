import { cn } from '@/lib/utils'

export function AgendaHeader() {
  return (
    <header className="bg-charcoal-dark text-white pt-16 pb-12 md:pt-24 md:pb-16 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 bg-hero-gradient"></div>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 relative z-10 text-center">
        <h1 className="tracking-tighter mb-4">The Plan</h1>
        <div className={cn('bl', 'mx-auto')}>
          <div />
          <div />
          <div />
        </div>
        <p className="text-slate-300 max-w-2xl mx-auto prose-standard">
          The Six Aims of The Base. A detailed, actionable blueprint to build a stronger, more
          prosperous nation through patriotism, honesty, and discipline.
        </p>
      </div>
    </header>
  )
}
