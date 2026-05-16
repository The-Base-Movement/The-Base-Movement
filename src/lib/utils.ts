import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a 2-letter ISO country code to an emoji flag or a Flagcdn URL.
 * If the input is not a 2-letter code, it returns the input as-is.
 */
export function getCountryFlag(flagOrCode: string | null | undefined, asEmoji: boolean = false): string {
  if (!flagOrCode) return ''
  
  // Handle 2-letter ISO codes
  if (flagOrCode.length === 2 && /^[A-Z]{2}$/i.test(flagOrCode)) {
    if (asEmoji) {
      const codePoints = flagOrCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }
    return `https://flagcdn.com/${flagOrCode.toLowerCase()}.svg`
  }

  // If it's already an emoji or a URL, return as is
  return flagOrCode
}
