import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'ghana': 'GH',
  'united states': 'US', 'usa': 'US', 'united states of america': 'US',
  'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB',
  'germany': 'DE',
  'france': 'FR',
  'canada': 'CA',
  'australia': 'AU',
  'south africa': 'ZA',
  'nigeria': 'NG',
  'kenya': 'KE',
  'ivory coast': 'CI', "côte d'ivoire": 'CI',
  'morocco': 'MA',
  'india': 'IN',
  'netherlands': 'NL', 'holland': 'NL',
  'italy': 'IT',
  'spain': 'ES',
  'portugal': 'PT',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'switzerland': 'CH',
  'belgium': 'BE',
  'austria': 'AT',
  'new zealand': 'NZ',
  'ireland': 'IE',
  'finland': 'FI',
  'poland': 'PL',
  'czech republic': 'CZ', 'czechia': 'CZ',
  'turkey': 'TR',
  'saudi arabia': 'SA',
  'united arab emirates': 'AE', 'uae': 'AE',
  'kuwait': 'KW',
  'qatar': 'QA',
  'bahrain': 'BH',
  'oman': 'OM',
  'singapore': 'SG',
  'malaysia': 'MY',
  'china': 'CN',
  'japan': 'JP',
  'south korea': 'KR',
  'brazil': 'BR',
  'argentina': 'AR',
  'ethiopia': 'ET',
  'cameroon': 'CM',
  'senegal': 'SN',
  'tanzania': 'TZ',
  'uganda': 'UG',
  'zambia': 'ZM',
  'zimbabwe': 'ZW',
  'botswana': 'BW',
  'namibia': 'NA',
}

export function toEmojiFlag(iso: string): string {
  return iso.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('')
}

export function getEmojiFlag(countryNameOrCode: string | null | undefined): string {
  if (!countryNameOrCode) return ''
  const s = countryNameOrCode.trim()
  if (s.length === 2 && /^[A-Za-z]{2}$/.test(s)) return toEmojiFlag(s)
  const iso = COUNTRY_NAME_TO_ISO[s.toLowerCase()]
  return iso ? toEmojiFlag(iso) : ''
}

export function getFlagImageUrl(countryNameOrCode: string | null | undefined): string {
  if (!countryNameOrCode) return ''
  const s = countryNameOrCode.trim()
  const iso = s.length === 2 && /^[A-Za-z]{2}$/.test(s)
    ? s.toLowerCase()
    : (COUNTRY_NAME_TO_ISO[s.toLowerCase()] || '').toLowerCase()
  return iso ? `/flags/${iso}.png` : ''
}

export function getCountryFlag(flagOrCode: string | null | undefined, asEmoji: boolean = false): string {
  if (!flagOrCode || typeof flagOrCode !== 'string') return ''

  const trimmed = flagOrCode.trim()

  // URL — return as-is
  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed

  // 2-letter ASCII ISO code (e.g. "GH", "GB")
  if (trimmed.length === 2 && /^[A-Za-z]{2}$/.test(trimmed)) {
    return asEmoji ? toEmojiFlag(trimmed) : trimmed.toUpperCase()
  }

  // Country name → ISO code
  const iso = COUNTRY_NAME_TO_ISO[trimmed.toLowerCase()]
  if (iso) {
    return asEmoji ? toEmojiFlag(iso) : iso
  }

  // Anything else (emoji flags, unknown strings) — pass through as-is
  return trimmed
}
