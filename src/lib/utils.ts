import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Converts a 2-letter ISO country code or country name to an emoji flag or a Flagcdn URL.
 * If the input is not recognized, it returns the input as-is.
 */
export function getCountryFlag(flagOrCode: string | null | undefined, asEmoji: boolean = false): string {
  if (!flagOrCode) return ''
  
  const code = flagOrCode.trim()
  
  // Handle 2-letter ISO codes
  if (code.length === 2 && /^[A-Za-z]{2}$/.test(code)) {
    if (asEmoji) {
      const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }
    return `https://flagcdn.com/${code.toLowerCase()}.svg`
  }

  // If it's already an emoji or a URL, return as is
  return flagOrCode
}
