export function AgendaIntroCards() {
  return (
    <section
      aria-labelledby="agenda-intro-heading"
      className="flex-columns items-stretch"
      style={{ '--column-gap': '2rem' } as React.CSSProperties}
    >
      <h2 id="agenda-intro-heading" className="sr-only">
        Agenda Definitions
      </h2>
      <div
        className="bg-white p-5 md:p-8 border border-slate-200 rounded-none shadow-sm flow"
        style={{ '--flow-space': '1rem' } as React.CSSProperties}
      >
        <h3 className="text-primary tracking-tight">What is an Aim?</h3>
        <p className="text-slate-600 leading-relaxed text-sm prose-standard">
          An Aim is a broad, long-term statement of intent. It describes the desired end state or
          the overall direction a movement or organisation wishes to pursue. Aims are visionary in
          nature. They answer the question: "What kind of Ghana are we trying to build?" They are
          not time-bound or immediately measurable, but they provide the moral compass and purpose
          that guides all action.
        </p>
      </div>
      <div
        className="bg-white p-5 md:p-8 border border-slate-200 rounded-none shadow-sm flow"
        style={{ '--flow-space': '1rem' } as React.CSSProperties}
      >
        <h3 className="text-primary tracking-tight">What is an Objective?</h3>
        <p className="text-slate-600 leading-relaxed text-sm prose-standard">
          An Objective is a specific, actionable, and measurable step taken in pursuit of an Aim.
          Objectives answer the question: "Exactly what will we do and how?" They are concrete,
          time-oriented, and directly deliverable. Where an Aim sets the destination, an Objective
          maps the route. Every objective in this document is derived from one of THE BASE's six
          core Aims.
        </p>
      </div>
    </section>
  )
}
