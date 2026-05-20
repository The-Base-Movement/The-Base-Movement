import { Link } from 'react-router-dom'

interface AgendaCovenantProps {
  isLoggedIn: boolean
}

export function AgendaCovenant({ isLoggedIn }: AgendaCovenantProps) {
  return (
    <section
      aria-labelledby="covenant-heading"
      className="bg-charcoal-dark text-white p-6 md:p-12 text-center mt-12 md:mt-24"
    >
      <div className="w-16 h-16 bg-primary mx-auto mb-6 flex items-center justify-center">
        <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }}>
          handshake
        </span>
      </div>
      <h2 id="covenant-heading" className="mb-6">
        Our Covenant with Ghana
      </h2>
      <div className="max-w-2xl mx-auto space-y-4 text-slate-300 mb-8">
        <p>
          These Aims define the Ghana we are building. These Objectives are the steps we will be
          held accountable to. Together, they form THE BASE's covenant with every Ghanaian who
          believes this country can, and must, do better.
        </p>
        <p>
          We do not offer vague promises. We offer an honest, detailed, and actionable agenda rooted
          in the realities of ordinary Ghanaians and the potential of an extraordinary nation.
        </p>
        <p className="text-accent font-bold tracking-tight mt-4 mb-0">Ghana First. Always.</p>
      </div>
      {isLoggedIn ? (
        <Link
          to="/dashboard/members"
          className="inline-flex items-center gap-2 h-14 px-10 bg-primary text-white font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          View Members{' '}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_forward
          </span>
        </Link>
      ) : (
        <Link
          to="/register"
          className="inline-flex items-center gap-2 h-14 px-10 bg-primary text-white font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          Join The Movement{' '}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_forward
          </span>
        </Link>
      )}
    </section>
  )
}
