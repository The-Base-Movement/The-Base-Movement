/**
 * NetworkStructureSection
 *
 * Explains the two parallel membership tracks of The Base Movement:
 *  - Ghana Network  → Constituency-based (members living in Ghana)
 *  - Diaspora Network → Chapter-based (members living outside Ghana)
 *
 * These are equal, independent tracks, not a hierarchy.
 * Constituencies exist only within Ghana's 275 electoral boundaries.
 * Chapters exist wherever Ghanaians in the diaspora are organised.
 */
import { Link } from 'react-router-dom'

const CONSTITUENCY_POINTS = [
  'Exclusively for members living in Ghana. Each of the 275 parliamentary constituencies maps to a defined electoral territory.',
  'You register under the constituency where you reside and are registered to vote.',
  'Constituencies are the primary unit of political accountability: your MP, your vote, your voice.',
]

const CHAPTER_POINTS = [
  'Exclusively for Ghanaians in the diaspora. There are no constituencies outside Ghana, so chapters fill that role.',
  'Chapters are organised by country and city: e.g. The Base London, The Base New York, The Base Hamburg.',
  'Diaspora members are equally valued: chapters feed resources, advocacy, and visibility back into the national movement.',
  'Each chapter is led by an appointed coordinator who connects directly to the national leadership structure.',
]

export function NetworkStructureSection() {
  return (
    <section
      aria-labelledby="network-structure-heading"
      style={{
        background: 'hsl(var(--container-low))',
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '72px 0',
      }}
    >
      <div className="page-container">
        {/* ── Header ── */}
        <div style={{ maxWidth: 640, marginBottom: 52 }} data-fade>
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
            How membership works
          </span>
          <h2
            id="network-structure-heading"
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
            Ghana Network or Diaspora Network: <br /> Which One Are You?
          </h2>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            The Base Movement has two equal membership tracks. Where you live determines which one
            you join. If you live in Ghana, you belong to a{' '}
            <strong style={{ color: 'hsl(var(--on-surface))' }}>constituency</strong>. If you live
            abroad, you belong to a{' '}
            <strong style={{ color: 'hsl(var(--on-surface))' }}>chapter</strong>. Both tracks carry
            the same weight in building a new Ghana.
          </p>
        </div>

        {/* ── Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginBottom: 24,
          }}
          data-fade-stagger
        >
          {/* ── Constituency card (Ghana Network) ── */}
          <article
            aria-label="Ghana Network: Constituency membership"
            style={{
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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
                    aria-hidden="true"
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
                      marginBottom: 3,
                    }}
                  >
                    If you live in Ghana
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
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Ghana is divided into 275 parliamentary constituencies. Every Base member living in
                Ghana joins under the constituency where they live and vote. There are no chapters
                inside Ghana. Constituencies are the unit.
              </p>
            </div>

            <div
              style={{
                padding: '20px 28px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flex: 1,
              }}
            >
              {CONSTITUENCY_POINTS.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(218,165,32,0.12)',
                      border: '1px solid rgba(218,165,32,0.28)',
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
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {point}
                  </p>
                </div>
              ))}

              <Link
                to="/register?platform=GHANA"
                style={{
                  marginTop: 10,
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
                Join the Ghana Network
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{ fontSize: 14 }}
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </article>

          {/* ── Chapter card (Diaspora Network) ── */}
          <article
            aria-label="Diaspora Network: Chapter membership"
            style={{
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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
                    aria-hidden="true"
                    style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
                  >
                    public
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
                      marginBottom: 3,
                    }}
                  >
                    If you live outside Ghana
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
                    Chapter
                  </h3>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Ghanaians in the diaspora don't have constituencies; those exist only within Ghana's
                borders. Instead, diaspora members organise through chapters: local groups in the
                cities and countries where they live.
              </p>
            </div>

            <div
              style={{
                padding: '20px 28px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flex: 1,
              }}
            >
              {CHAPTER_POINTS.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    aria-hidden="true"
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
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {point}
                  </p>
                </div>
              ))}

              <Link
                to="/register?platform=DIASPORA"
                style={{
                  marginTop: 10,
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
                Join the Diaspora Network
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{ fontSize: 14 }}
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </article>
        </div>

        {/* ── Bottom clarification ── */}
        <div
          style={{
            padding: '18px 24px',
            background: '#fff',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
          data-fade
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{
              fontSize: 20,
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            info
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12.5,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            <strong style={{ color: 'hsl(var(--on-surface))' }}>
              Constituencies and chapters never overlap.
            </strong>{' '}
            Ghana's 275 constituencies cover every resident member. There are no chapters inside
            Ghana. Chapters exist only outside Ghana, organised around the cities and countries
            where our diaspora lives. Whichever track you join, you are a full member of The Base
            Movement with equal rights, responsibilities, and voice.
          </p>
        </div>
      </div>
    </section>
  )
}
