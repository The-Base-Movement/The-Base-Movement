import React from 'react'
import { cn } from '@/lib/utils'

interface CountryBadgeProps {
  flag: string
  className?: string
  alt?: string
}

export const CountryBadge: React.FC<CountryBadgeProps> = ({ flag, className, alt = 'flag' }) => {
  if (!flag) return null

  const isUrl = flag.startsWith('http') || flag.includes('flagcdn.com')
  const isIsoCode = flag.length === 2 && /^[A-Za-z]{2}$/.test(flag)

  // If it's a URL or a 2-letter code that we can turn into a URL
  if (isUrl || isIsoCode) {
    const src = isIsoCode ? `https://flagcdn.com/${flag.toLowerCase()}.svg` : flag
    return (
      <img 
        src={src} 
        className={cn("h-[1.1em] w-auto inline-block align-middle rounded-[1px] shadow-sm border border-black/5", className)} 
        alt={alt}
        loading="lazy"
        onError={(e) => {
          // If image fails, hide it (will show nothing) or we could show the text
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  // Otherwise assume it's an emoji
  return (
    <span className={cn("inline-block align-middle text-[1.1em]", className)} role="img" aria-label={alt}>
      {flag}
    </span>
  )
}
