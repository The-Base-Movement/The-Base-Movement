/* eslint-disable react-refresh/only-export-components */
/**
 * TrustSignals — compact row of reassurance cues shown near signup/donation CTAs.
 *
 * Communicates privacy, expected effort, verification/moderation, and how to get
 * help — reducing form abandonment at the point of conversion.
 *
 * Usage:
 *   <TrustSignals items={SIGNUP_TRUST} />
 *   <TrustSignals items={DONATION_TRUST} tone="dark" />
 */

import { Link } from 'react-router-dom'

export interface TrustItem {
  icon: string
  text: string
  /** Optional internal route — renders the item as a link (e.g. contact). */
  to?: string
}

interface TrustSignalsProps {
  items: TrustItem[]
  /** 'light' for light backgrounds (default), 'dark' for coloured/photo heroes. */
  tone?: 'light' | 'dark'
  className?: string
}

/** Signup-flow reassurance (registration / Join CTAs). */
export const SIGNUP_TRUST: TrustItem[] = [
  { icon: 'lock', text: 'Your details stay private' },
  { icon: 'schedule', text: 'About 3 minutes to complete' },
  { icon: 'verified', text: 'Every member is verified' },
  { icon: 'mail', text: 'Questions? Contact us', to: '/contact' },
]

/** Donation-flow reassurance (Donate CTAs). */
export const DONATION_TRUST: TrustItem[] = [
  { icon: 'lock', text: 'Private unless you choose to appear' },
  { icon: 'schedule', text: 'Takes under a minute' },
  { icon: 'mail', text: 'Questions? Contact us', to: '/contact' },
]

export function TrustSignals({ items, tone = 'light', className }: TrustSignalsProps) {
  const color = tone === 'dark' ? 'rgba(255,255,255,0.72)' : 'hsl(var(--on-surface-muted))'
  const linkColor = tone === 'dark' ? '#fff' : 'hsl(var(--primary))'

  return (
    <ul
      className={className}
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 18px',
      }}
    >
      {items.map((item) => {
        const content = (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
              {item.icon}
            </span>
            {item.text}
          </>
        )
        return (
          <li
            key={item.icon + item.text}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color,
            }}
          >
            {item.to ? (
              <Link
                to={item.to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: linkColor,
                  textDecoration: 'none',
                }}
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ul>
  )
}
