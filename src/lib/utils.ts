import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a 2-letter ISO country code to an emoji flag.
 * If the input is not a 2-letter code, it returns the input as-is.
 */
export function getCountryFlag(flagOrCode: string | null | undefined): string {
  if (!flagOrCode) return ''
  
  // If it's already an emoji (roughly check for non-ASCII)
  // or if it's a URL, return as is.
  if (flagOrCode.length > 2 || flagOrCode.includes('/') || flagOrCode.includes('.')) {
    return flagOrCode
  }

  // Handle 2-letter ISO codes
  if (flagOrCode.length === 2 && /^[A-Z]{2}$/i.test(flagOrCode)) {
    const codePoints = flagOrCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  return flagOrCode
}
