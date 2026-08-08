/**
 * @file utils.ts
 * @description Shared UI utility helpers. Provides classnames composition helper (cn),
 * emoji flag generators, and country name to ISO 2-letter mapping codes.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines CSS class names dynamically and resolves Tailwind CSS conflicts.
 *
 * @param inputs - List of class names, conditionals, or objects
 * @returns Single clean string of classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  ghana: 'GH',
  'united states': 'US',
  usa: 'US',
  'united states of america': 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  'great britain': 'GB',
  england: 'GB',
  germany: 'DE',
  france: 'FR',
  canada: 'CA',
  australia: 'AU',
  'south africa': 'ZA',
  nigeria: 'NG',
  kenya: 'KE',
  greece: 'GR',
  gabon: 'GA',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  "cote d'ivoire": 'CI',
  'cote divoire': 'CI',
  ivorycoast: 'CI',
  turkey: 'TR',
  türkiye: 'TR',
  turkiye: 'TR',
  morocco: 'MA',
  india: 'IN',
  netherlands: 'NL',
  holland: 'NL',
  italy: 'IT',
  spain: 'ES',
  portugal: 'PT',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  switzerland: 'CH',
  belgium: 'BE',
  austria: 'AT',
  'new zealand': 'NZ',
  ireland: 'IE',
  finland: 'FI',
  poland: 'PL',
  'czech republic': 'CZ',
  czechia: 'CZ',
  hungary: 'HU',
  romania: 'RO',
  ukraine: 'UA',
  russia: 'RU',
  cyprus: 'CY',
  malta: 'MT',
  israel: 'IL',
  egypt: 'EG',
  ethiopia: 'ET',
  tanzania: 'TZ',
  uganda: 'UG',
  rwanda: 'RW',
  cameroon: 'CM',
  senegal: 'SN',
  mali: 'ML',
  burkina: 'BF',
  'burkina faso': 'BF',
  togo: 'TG',
  benin: 'BJ',
  liberia: 'LR',
  'sierra leone': 'SL',
  gambia: 'GM',
  'guinea-bissau': 'GW',
  guinea: 'GN',
  'equatorial guinea': 'GQ',
  congo: 'CG',
  'democratic republic of congo': 'CD',
  'dr congo': 'CD',
  drc: 'CD',
  zambia: 'ZM',
  zimbabwe: 'ZW',
  malawi: 'MW',
  mozambique: 'MZ',
  botswana: 'BW',
  namibia: 'NA',
  angola: 'AO',
  madagascar: 'MG',
  mauritius: 'MU',
  seychelles: 'SC',
  somalia: 'SO',
  sudan: 'SD',
  'south sudan': 'SS',
  libya: 'LY',
  algeria: 'DZ',
  tunisia: 'TN',
  niger: 'NE',
  chad: 'TD',
  mauritania: 'MR',
  eswatini: 'SZ',
  swaziland: 'SZ',
  lesotho: 'LS',
  djibouti: 'DJ',
  comoros: 'KM',
  'cape verde': 'CV',
  'sao tome and principe': 'ST',
  japan: 'JP',
  china: 'CN',
  pakistan: 'PK',
  bangladesh: 'BD',
  'sri lanka': 'LK',
  singapore: 'SG',
  malaysia: 'MY',
  indonesia: 'ID',
  philippines: 'PH',
  'south korea': 'KR',
  korea: 'KR',
  vietnam: 'VN',
  thailand: 'TH',
  cambodia: 'KH',
  laos: 'LA',
  myanmar: 'MM',
  nepal: 'NP',
  brazil: 'BR',
  argentina: 'AR',
  colombia: 'CO',
  mexico: 'MX',
  chile: 'CL',
  peru: 'PE',
  venezuela: 'VE',
  ecuador: 'EC',
  uruguay: 'UY',
  paraguay: 'PY',
  jamaica: 'JM',
  haiti: 'HT',
  trinidad: 'TT',
  'trinidad and tobago': 'TT',
  bahamas: 'BS',
  barbados: 'BB',
  'saudi arabia': 'SA',
  'united arab emirates': 'AE',
  uae: 'AE',
  qatar: 'QA',
  kuwait: 'KW',
  bahrain: 'BH',
  oman: 'OM',
  jordan: 'JO',
  lebanon: 'LB',
  iran: 'IR',
  iraq: 'IQ',
  yemen: 'YE',
}

/**
 * Converts a 2-letter ISO country code into its corresponding unicode emoji flag.
 *
 * @param iso - The 2-letter country code (e.g. 'GH')
 * @returns Visual Unicode emoji character.
 */
export function toEmojiFlag(iso: string): string {
  return iso
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}

/**
 * Resolves a country name or code to its corresponding emoji flag.
 *
 * @param countryNameOrCode - Name of country or its ISO code
 * @returns Emoji character flag, or empty string if unmapped.
 */
export function getEmojiFlag(countryNameOrCode: string | null | undefined): string {
  if (!countryNameOrCode) return ''
  const s = countryNameOrCode.trim()
  if (s.length === 2 && /^[A-Za-z]{2}$/.test(s)) return toEmojiFlag(s)
  const iso = COUNTRY_NAME_TO_ISO[s.toLowerCase()]
  return iso ? toEmojiFlag(iso) : ''
}

/**
 * Resolves a country name or code to local flag image URL.
 *
 * @param countryNameOrCode - Name of country or its ISO code
 * @returns Relative flag asset URL path (e.g. '/flags/gh.png')
 */
export function getFlagImageUrl(countryNameOrCode: string | null | undefined): string {
  if (!countryNameOrCode) return ''
  const s = countryNameOrCode.trim()
  const iso =
    s.length === 2 && /^[A-Za-z]{2}$/.test(s)
      ? s.toLowerCase()
      : (COUNTRY_NAME_TO_ISO[s.toLowerCase()] || '').toLowerCase()
  return iso ? `/flags/${iso}.png` : ''
}

/**
 * Translates a country name or flags representation into ISO/Emoji values.
 *
 * @param flagOrCode - The flag image path, country name or ISO code
 * @param asEmoji - Flag indicating if output should be translated to Unicode Emoji character.
 * @returns Resolved ISO code, emoji, or original string.
 */
export function getCountryFlag(
  flagOrCode: string | null | undefined,
  asEmoji: boolean = false
): string {
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
