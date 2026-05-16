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

  // If it's a 2-letter ISO code, use flag-icons CSS classes
  if (isIsoCode) {
    return (
      <span 
        className={cn("fi", `fi-${flag.toLowerCase()}`, "inline-block w-[1.1em] h-[0.8em] align-middle", className)} 
        title={alt}
        style={{ borderRadius: 1 }}
      />
    )
  }

  // If it's a URL
  if (isUrl) {
    return (
      <img 
        src={flag} 
        className={cn("h-[1.1em] w-auto inline-block align-middle rounded-[1px] shadow-sm border border-black/5", className)} 
        alt={alt}
        loading="lazy"
        onError={(e) => {
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
