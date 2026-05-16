import React from 'react'
import { cn } from '@/lib/utils'

interface CountryBadgeProps {
  flag: string
  className?: string
  alt?: string
}

export const CountryBadge: React.FC<CountryBadgeProps> = ({ flag, className, alt = 'flag' }) => {
  if (!flag) return null

  // If it's a URL (starts with http or contains flagcdn)
  if (flag.startsWith('http') || flag.includes('flagcdn.com')) {
    return (
      <img 
        src={flag} 
        className={cn("h-[1em] w-auto inline-block align-middle rounded-[1px] shadow-sm", className)} 
        alt={alt}
        loading="lazy"
      />
    )
  }

  // Otherwise assume it's an emoji
  return (
    <span className={cn("inline-block align-middle", className)} role="img" aria-label={alt}>
      {flag}
    </span>
  )
}
