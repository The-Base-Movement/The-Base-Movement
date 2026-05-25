import { Link } from 'react-router-dom'

export function PublicCTA() {
  return (
    <section
      className="py-16 md:py-20 px-6 md:px-12 text-white text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(156 100% 14%) 0%, hsl(0 0% 8%) 45%, hsl(45 60% 18%) 100%)`,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-green" />
      <p className="font-meta text-warm-gold tracking-tight text-xs mb-3">Join the conversation</p>
      <h2 className="font-meta font-medium text-3xl tracking-tight mb-4">
        Become a member. Shape the narrative.
      </h2>
      <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
        Registered members get early access to analysis, policy briefs and updates directly from our
        research desk.
      </p>
      <Link
        to="/register"
        className="inline-flex items-center justify-center gap-2 px-7 py-4 font-meta text-sm tracking-tight hover:opacity-90 transition-opacity"
        style={{
          background: 'hsl(var(--accent))',
          color: '#000',
          borderRadius: 'var(--button-radius)',
          fontWeight: 'var(--button-font-weight)',
        }}
      >
        Join The Base
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          arrow_forward
        </span>
      </Link>
    </section>
  )
}
