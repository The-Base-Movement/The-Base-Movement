/**
 * CountryBadge Component
 * -------------------------------------------------------------
 * Renders a compact country flag in three modes:
 * - URL / data: URI → renders an <img> tag
 * - 2-letter ISO code (e.g. 'GH') → converts to a Unicode flag emoji
 * - Any other string → renders the raw value as an emoji span
 *
 * Used in diaspora chapter cards and member profile displays.
 */

import React from 'react'

interface CountryBadgeProps {
  flag: string
  className?: string
  alt?: string
}

/**
 * Converts a 2-letter ISO 3166-1 alpha-2 country code to its
 * corresponding Unicode regional indicator emoji pair (flag emoji).
 */
function isoToEmoji(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}

export const CountryBadge: React.FC<CountryBadgeProps> = ({ flag, alt = 'flag' }) => {
  if (!flag) return null

  const isUrl = flag.startsWith('http') || flag.startsWith('data:')
  const isIsoCode = flag.length === 2 && /^[A-Za-z]{2}$/.test(flag)

  if (isUrl) {
    return (
      <img
        src={flag}
        style={{
          height: '1.1em',
          width: 'auto',
          display: 'inline-block',
          verticalAlign: 'middle',
          borderRadius: 1,
        }}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  const emoji = isIsoCode ? isoToEmoji(flag) : flag

  return (
    <span
      role="img"
      aria-label={alt}
      style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: '1.1em', lineHeight: 1 }}
    >
      {emoji}
    </span>
  )
}
