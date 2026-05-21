import { Breadcrumbs } from '@/components/Breadcrumbs'

export function PublicHero() {
  return (
    <header
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #181d19 0%, #0e1510 100%)',
      }}
    >
      {/* Green radial glow — top-left behind the text */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          left: '-5%',
          width: '55%',
          height: '220%',
          background: 'radial-gradient(ellipse at center, rgba(0,107,63,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      {/* Noise overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/noise.png')",
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />

      <div
        className="max-w-7xl mx-auto px-4 md:px-8"
        style={{ paddingTop: 40, paddingBottom: 40, position: 'relative', zIndex: 1 }}
      >
        <Breadcrumbs />

        <div style={{ maxWidth: 640 }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'hsl(var(--accent))',
              marginBottom: 14,
            }}
          >
            The Base Movement
          </span>

          <h1
            style={{
              color: '#fff',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: '0 0 16px',
            }}
          >
            Updates &amp; Articles
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 520,
            }}
          >
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
