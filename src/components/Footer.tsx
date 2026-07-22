import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FacebookIcon, InstagramIcon, XIcon, TikTokIcon, YouTubeIcon } from './icons/SocialIcons'
import { useBranding } from '@/hooks/useBranding'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { EmailSuggestion } from '@/components/EmailSuggestion'
import { publicSiteService } from '@/services/publicSiteService'

const FOOTER_COLS = [
  {
    heading: 'Foundation',
    links: [
      { label: 'The plan', to: '/our-agenda' },
      { label: 'Impact', to: '/impact' },
      { label: 'Diaspora', to: '/chapters' },
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
      { label: 'Store', to: '/store' },
    ],
  },
]

export default function Footer() {
  const { settings } = useBranding()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (phone.trim() && phone.replace(/\D/g, '').length < 8) {
      toast.error('Please enter a valid phone number for SMS updates, or leave it blank.')
      return
    }
    setSubmitting(true)
    const success = await publicSiteService.subscribeToNewsletter(email.trim(), phone.trim())
    setSubmitting(false)
    if (success) {
      setSubscribed(true)
      toast.success("Subscribed! You'll receive updates from The Base.")
    } else {
      toast.error('Subscription failed. Please try again.')
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                  href: 'https://www.instagram.com/thebasemovementghana',
                  Icon: InstagramIcon,
                  title: 'Instagram',
                },
                {
                  href: 'https://x.com/TheBaseGame',
                  Icon: XIcon,
                  title: 'X',
                },
                {
                  href: 'https://www.tiktok.com/@thebasemovementghana',
                  Icon: TikTokIcon,
                  title: 'TikTok',
                },
                {
                  href: 'https://www.youtube.com/@TheBaseMovementGhana',
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                fontWeight: 'var(--font-weight-medium, 500)',
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

            <form
              onSubmit={handleSubscribe}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <input
                name="email"
                id="input-a60551"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                disabled={subscribed}
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
              <input
                name="phone"
                id="input-newsletter-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number for SMS (optional)"
                disabled={subscribed}
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
              <EmailSuggestion email={email} onAccept={(v) => setEmail(v)} />
              <ButtonPrimary type="submit" className="w-full" disabled={submitting || subscribed}>
                {submitting ? 'Subscribing…' : subscribed ? 'Subscribed' : 'Subscribe'}
                {!subscribed && (
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    send
                  </span>
                )}
              </ButtonPrimary>
            </form>
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
