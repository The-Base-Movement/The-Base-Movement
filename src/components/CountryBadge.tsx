import React from 'react'

interface CountryBadgeProps {
  flag: string
  className?: string
  alt?: string
}

function isoToEmoji(code: string): string {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('')
}

export const CountryBadge: React.FC<CountryBadgeProps> = ({ flag, alt = 'flag' }) => {
  if (!flag) return null

  const isUrl = flag.startsWith('http') || flag.startsWith('data:')
  const isIsoCode = flag.length === 2 && /^[A-Za-z]{2}$/.test(flag)

  if (isUrl) {
    return (
      <img
        src={flag}
        style={{ height: '1.1em', width: 'auto', display: 'inline-block', verticalAlign: 'middle', borderRadius: 1 }}
        alt={alt}
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }

  const emoji = isIsoCode ? isoToEmoji(flag) : flag

  return (
    <span role="img" aria-label={alt} style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: '1.1em', lineHeight: 1 }}>
      {emoji}
    </span>
  )
}
