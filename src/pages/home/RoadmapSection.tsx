interface RoadmapItem {
  color: string
  done: boolean
  current: boolean
  year: string
  title: string
  body: string | undefined
}

interface RoadmapSectionProps {
  roadmapItems: RoadmapItem[]
}

export function RoadmapSection({ roadmapItems }: RoadmapSectionProps) {
  return (
    <section
      aria-labelledby="roadmap-heading"
      className="py-16 md:py-24 bg-background border-b border-border/30"
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="mb-10 md:mb-12" data-fade>
          <span className="text-[10px] font-bold tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">
            Movement roadmap
          </span>
          <h2
            id="roadmap-heading"
            className="text-2xl md:text-3xl font-meta font-bold text-on-surface tracking-tight mb-1"
          >
            Where we are,
            <br />
            what's next.
          </h2>
        </div>

        <div className="relative">
          <div
            className="absolute left-3 right-0 hidden md:block"
            style={{
              top: '12px',
              height: '3px',
              background: 'linear-gradient(to right, #CE1126, #DAA520, #181d19, #006B3F)',
            }}
          />

          <div
            className="absolute top-0 bottom-0 left-[11px] md:hidden"
            style={{
              width: '3px',
              background: 'linear-gradient(to bottom, #CE1126, #DAA520, #181d19, #006B3F)',
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-8" data-fade-stagger>
            {roadmapItems.map((ms, idx) => (
              <div
                key={idx}
                className="relative flex md:block gap-6 pb-10 md:pb-0 md:pt-16 md:pr-4"
              >
                <div
                  className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-4 mt-1 md:absolute md:top-0 md:left-0 md:mt-0"
                  style={{ background: ms.done ? ms.color : '#fff', borderColor: ms.color }}
                >
                  {ms.done && (
                    <svg viewBox="0 0 10 10" width="8" height="8" fill="white">
                      <path
                        d="M1.5 5 L4 7.5 L8.5 2.5"
                        stroke="white"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {ms.current && !ms.done && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: ms.color }}
                    />
                  )}
                </div>

                <div className={idx < 3 ? '' : ''}>
                  <div
                    className="text-[11px] font-bold tracking-[.06em] uppercase mb-1.5 font-meta"
                    style={{ color: 'hsl(var(--on-surface-muted))' }}
                  >
                    {ms.year}
                  </div>
                  <h4 className="font-meta font-extrabold text-[15px] tracking-[-0.01em] text-on-surface mb-1.5 leading-snug">
                    {ms.title}
                  </h4>
                  <p className="text-[12px] text-muted-foreground leading-[1.5] font-body-md">
                    {ms.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
