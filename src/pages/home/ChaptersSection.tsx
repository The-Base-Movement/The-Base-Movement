import { Link } from 'react-router-dom'

const CONSTITUENCY_POINTS = [
  'Ghana has 275 parliamentary constituencies — each a defined electoral territory.',
  'Members join under the constituency where they are registered to vote.',
  'Constituencies elect parliamentary representatives and are the primary unit of political accountability.',
  'The Base tracks sentiment, feedback, and turnout data by constituency.',
]

const CHAPTER_POINTS = [
  'A chapter hub is a local organisational branch within a constituency.',
  'Multiple chapters can operate inside the same constituency.',
  'Chapters coordinate rallies, outreach, and ground-level mobilisation activities.',
  'Each chapter is led by an appointed coordinator who reports to the regional structure.',
]

export function ChaptersSection() {
  return (
    <section
      aria-labelledby="structure-heading"
      style={{
        background: 'hsl(var(--container-low))',
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '72px 0',
      }}
    >
      <div className="page-container">
        {/* Header */}
        <div style={{ maxWidth: 600, marginBottom: 52 }} data-fade>
          <span
            style={{
              display: 'block',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 10,
            }}
          >
            Our structure
          </span>
          <h2
            id="structure-heading"
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              color: 'hsl(var(--on-surface))',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: '0 0 14px',
            }}
          >
            Constituencies &amp; Chapters
          </h2>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            The Base Movement operates across two distinct tiers. Understanding both helps you know
            where you fit — and how your voice moves from your street to Parliament.
          </p>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginBottom: 48,
          }}
          data-fade-stagger
        >
          {/* ── Constituency card ── */}
          <div
            style={{
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Card header */}
            <div
              style={{
                borderTop: '4px solid hsl(var(--accent))',
                padding: '28px 28px 20px',
                background: 'rgba(218,165,32,0.04)',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(218,165,32,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: 'hsl(var(--accent))' }}
                  >
                    location_city
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9.5,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--accent))',
                      marginBottom: 2,
                    }}
                  >
                    Tier 1
                  </span>
                  <h3
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 20,
                      color: 'hsl(var(--on-surface))',
                      letterSpacing: '-0.015em',
                      margin: 0,
                    }}
                  >
                    Constituency
                  </h3>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                The political foundation — a legally defined electoral territory from which a Member
                of Parliament is elected. Every Ghanaian voter belongs to one.
              </p>
            </div>

            {/* Key points */}
            <div
              style={{
                padding: '20px 28px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {CONSTITUENCY_POINTS.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(218,165,32,0.12)',
                      border: '1px solid rgba(218,165,32,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 11, color: 'hsl(var(--accent))' }}
                    >
                      check
                    </span>
                  </span>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      fontSize: 12.5,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {point}
                  </p>
                </div>
              ))}

              <Link
                to="/register"
                style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--accent))',
                  textDecoration: 'none',
                }}
              >
                Join your constituency
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {/* ── Chapter Hub card ── */}
          <div
            style={{
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Card header */}
            <div
              style={{
                borderTop: '4px solid hsl(var(--primary))',
                padding: '28px 28px 20px',
                background: 'rgba(34,197,94,0.03)',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(34,197,94,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
                  >
                    groups
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9.5,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--primary))',
                      marginBottom: 2,
                    }}
                  >
                    Tier 2
                  </span>
                  <h3
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 20,
                      color: 'hsl(var(--on-surface))',
                      letterSpacing: '-0.015em',
                      margin: 0,
                    }}
                  >
                    Chapter Hub
                  </h3>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                The movement's operational branch — an active local unit that runs events, drives
                recruitment, and delivers accountability on the ground.
              </p>
            </div>

            {/* Key points */}
            <div
              style={{
                padding: '20px 28px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {CHAPTER_POINTS.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(34,197,94,0.10)',
                      border: '1px solid rgba(34,197,94,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 11, color: 'hsl(var(--primary))' }}
                    >
                      check
                    </span>
                  </span>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      fontSize: 12.5,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {point}
                  </p>
                </div>
              ))}

              <Link
                to="/chapters"
                style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--primary))',
                  textDecoration: 'none',
                }}
              >
                Find your chapter
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom relationship note */}
        <div
          style={{
            padding: '18px 24px',
            background: '#fff',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
          data-fade
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))', flexShrink: 0 }}
          >
            info
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12.5,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            <strong style={{ color: 'hsl(var(--on-surface))' }}>How they relate:</strong> A
            constituency is the political territory; a chapter hub is the movement's active presence
            within it. You register under your constituency — then connect with your nearest chapter
            to take action.
          </p>
        </div>
      </div>
    </section>
  )
}
