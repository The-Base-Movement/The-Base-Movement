import { Link } from 'react-router-dom'

export function PublicCTA() {
  return (
    <section className="mt-20 py-12 px-6 md:py-16 md:px-12 bg-charcoal-dark text-white text-center border-l-4 border-brand-green">
      <p className="font-meta text-warm-gold tracking-tight text-xs mb-3">Join the conversation</p>
      <h2 className="font-meta font-bold text-3xl tracking-tight mb-4">
        Become a member. Shape the narrative.
      </h2>
      <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
        Registered members get early access to analysis, policy briefs and updates directly from our
        research desk.
      </p>
      <Link
        to="/register"
        className="h-14 px-10 inline-flex items-center gap-2 bg-accent text-white font-bold text-sm hover:opacity-90 transition-opacity"
      >
        Join The Base{' '}
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          arrow_forward
        </span>
      </Link>
    </section>
  )
}
