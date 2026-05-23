import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from './icons/SocialIcons'
import { adminService } from '../services/adminService'
import { useBranding } from '@/hooks/useBranding'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'

const FOOTER_COLS = [
  {
    heading: 'Foundation',
    links: [
      { label: 'The plan', to: '/our-agenda' },
      { label: 'Impact', to: '/impact' },
      { label: 'Chapters', to: '/chapters' },
      { label: 'Polls', to: '/polls' },
    ],
  },
  {
    heading: 'Connect',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'Press', to: '/press' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
    ],
  },
  {
    heading: 'Action',
    links: [
      { label: 'Join', to: '/register' },
      { label: 'Donate', to: '/donate' },
      { label: 'Supplies', to: '/store' },
    ],
  },
]

export default function Footer() {
  const { settings } = useBranding()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    const success = await adminService.subscribeToNewsletter(email)
    if (success) {
      setSubscribed(true)
      setEmail('')
    }
  }

  const linkStyle: React.CSSProperties = {
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 500,
    fontSize: 12.5,
    color: 'hsl(var(--on-surface-muted))',
    textDecoration: 'none',
    display: 'block',
    lineHeight: 1,
  }

  return (
    <footer
      style={{
        background: 'hsl(var(--surface-warm))',
        borderTop: '1px solid hsl(var(--border))',
        color: 'hsl(var(--on-surface))',
        padding: '72px 0 0',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px' }}>
        {/* Main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr',
            gap: '0 48px',
            alignItems: 'start',
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Link
              to="/"
              style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}
            >
              <img
                alt="The Base Logo"
                style={{ height: 48, width: 48, objectFit: 'contain' }}
                src={settings.logo_url}
                decoding="async"
                loading="lazy"
              />
              <div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    letterSpacing: '-.02em',
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1,
                  }}
                >
                  The Base
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    color: 'hsl(var(--primary))',
                    letterSpacing: '.01em',
                    marginTop: 5,
                  }}
                >
                  Ghana First, Jobs for the Youth!
                </div>
              </div>
            </Link>

            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 400,
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.65,
                maxWidth: 340,
                margin: 0,
              }}
            >
              A grassroots movement committed to youth jobs, accountable leadership, and national
              development for a more productive Ghana.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {[
                {
                  href: 'https://www.facebook.com/profile.php?id=61579415816496',
                  Icon: FacebookIcon,
                  title: 'Facebook',
                },
                {
                  href: 'https://www.instagram.com/thebasemovementgh',
                  Icon: InstagramIcon,
                  title: 'Instagram',
                },
                {
                  href: 'https://www.tiktok.com/@thebasemovementgh',
                  Icon: TikTokIcon,
                  title: 'TikTok',
                },
                {
                  href: 'https://www.youtube.com/@thebasemovementgh',
                  Icon: YouTubeIcon,
                  title: 'YouTube',
                },
              ].map(({ href, Icon, title }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  style={{ opacity: 0.7, transition: 'opacity 0.15s, transform 0.15s' }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.opacity = '1'
                    ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.opacity = '0.7'
                    ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                  }}
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav link columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 24px' }}>
            {FOOTER_COLS.map((col) => (
              <div key={col.heading} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    color: 'hsl(var(--primary))',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {col.heading}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {col.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      style={linkStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--primary))')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'hsl(var(--on-surface-muted))')
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div
            style={{
              background: '#0f1310',
              borderLeft: '3px solid hsl(var(--accent))',
              padding: '28px 24px',
              color: '#fff',
            }}
          >
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: '-.01em',
                marginBottom: 10,
                color: '#fff',
              }}
            >
              Stay Informed.
            </div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 400,
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
                marginBottom: 20,
                marginTop: 0,
              }}
            >
              Subscribe to receive regular updates on our progress, community initiatives, and news
              from across the movement.
            </p>

            {subscribed ? (
              <div
                style={{
                  padding: '12px 16px',
                  border: '1px solid hsl(var(--primary) / 30%)',
                  background: 'hsl(var(--primary) / 10%)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                  }}
                >
                  Successfully Enlisted
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <input
                  name="email"
                  id="input-a60551"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 'var(--button-radius)',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                <ButtonPrimary type="submit" className="w-full">
                  Subscribe
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    send
                  </span>
                </ButtonPrimary>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 72,
            paddingTop: 28,
            paddingBottom: 28,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 400,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} The Base Movement. Ghana First.
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            Flag icons by{' '}
            <a
              href="https://flagpedia.net"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'hsl(var(--on-surface-muted))', textDecoration: 'underline' }}
            >
              Flagpedia.net
            </a>
          </p>
          {/* Brand gradient bar */}
          <div
            style={{
              display: 'flex',
              height: 3,
              width: 160,
              borderRadius: 99,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, background: 'hsl(var(--destructive))' }} />
            <div style={{ flex: 1, background: 'hsl(var(--accent))' }} />
            <div style={{ flex: 1, background: 'hsl(var(--primary))' }} />
          </div>
        </div>
      </div>
    </footer>
  )
}
