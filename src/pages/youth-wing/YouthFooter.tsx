import { Link } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'
import { YW_ACCENT } from './theme'

/**
 * Footer for the Youth Wing surface.
 *
 * Same shape as the adult Footer (brand block, link columns, legal strip) but
 * different contents: no Donate, no Store, no Join-the-party column, and no
 * newsletter capture, since collecting a minor's email for marketing is not
 * something the guardian consented to. What it does carry, permanently, is the
 * not-party-membership line and a safeguarding contact route.
 */

const COLUMNS = [
  {
    heading: 'Programme',
    links: [
      { label: 'About the Youth Wing', to: '/youth-wing' },
      { label: 'Articles', to: '/youth-wing/articles' },
      { label: 'Events', to: '/events' },
    ],
  },
  {
    heading: 'Members',
    links: [
      { label: 'Join', to: '/youth-wing/register' },
      { label: 'My portal', to: '/youth-wing/portal' },
      { label: 'Paper form', to: '/youth-wing/form' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
]

export function YouthFooter() {
  return (
    <footer
      style={{
        background: 'hsl(var(--container-low))',
        borderTop: '1px solid hsl(var(--border))',
        marginTop: 'auto',
      }}
    >
      <div style={{ height: 3, background: YW_ACCENT }} aria-hidden="true" />
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 18,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              The Base Youth Wing
            </p>
            <BrandLine width={96} />
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13.5,
                color: 'hsl(var(--on-surface-muted))',
                margin: '16px 0 0',
                maxWidth: 380,
                lineHeight: 1.65,
              }}
            >
              Civic education, mentorship and community service for young Ghanaians aged 14 to 17.
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: 'hsl(var(--on-surface-muted))',
                margin: '14px 0 0',
                maxWidth: 380,
                lineHeight: 1.6,
              }}
            >
              A civic and mobilization programme, not political party membership. No voting rights,
              no leadership eligibility. Party membership opens at 18.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 24px' }}>
            {COLUMNS.map((col) => (
              <div key={col.heading} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: YW_ACCENT,
                    margin: 0,
                  }}
                >
                  {col.heading}
                </p>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="yw-link"
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          className="panel"
          style={{
            marginTop: 32,
            padding: '16px 20px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: YW_ACCENT, marginTop: 1 }}
          >
            shield_person
          </span>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            <strong>Parents and guardians:</strong> we contact you by phone to confirm consent
            before any young person is activated. If you did not consent, or you want a record
            removed,{' '}
            <Link to="/contact" style={{ color: YW_ACCENT }}>
              tell us
            </Link>{' '}
            and we will remove it.
          </p>
        </div>

        <div
          style={{
            marginTop: 26,
            paddingTop: 18,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span>&copy; {new Date().getFullYear()} The Base Movement. Ghana First.</span>
          <Link to="/" className="yw-link" style={{ textDecoration: 'none' }}>
            Main site &rarr;
          </Link>
        </div>
      </div>
    </footer>
  )
}
