import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'australia': 'au',
  'brazil': 'br',
  'canada': 'ca',
  'china': 'cn',
  'france': 'fr',
  'germany': 'de',
  'india': 'in',
  'italy': 'it',
  'japan': 'jp',
  'nigeria': 'ng',
  'russia': 'ru',
  'south africa': 'za',
  'spain': 'es',
  'united kingdom': 'gb',
  'uk': 'gb',
  'united states': 'us',
  'usa': 'us',
  'ghana': 'gh'
}

/**
 * Converts a 2-letter ISO country code or country name to an emoji flag or a Flagcdn URL.
 * If the input is not recognized, it returns the input as-is.
 */
export function getCountryFlag(flagOrCode: string | null | undefined, asEmoji: boolean = false): string {
  if (!flagOrCode) return ''
  
  let code = flagOrCode.trim().toLowerCase()
  
  // Check if it's a known country name
  if (COUNTRY_NAME_TO_CODE[code]) {
    code = COUNTRY_NAME_TO_CODE[code]
  }

  // Handle 2-letter ISO codes
  if (code.length === 2 && /^[a-z]{2}$/.test(code)) {
    if (asEmoji) {
      const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }
    return `https://flagcdn.com/${code}.svg`
  }

  // If it's already an emoji or a URL, return as is
  return flagOrCode
}
