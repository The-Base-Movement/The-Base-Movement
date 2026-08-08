/**
 * Returns the emoji flag for a given country name or ISO-2 code.
 * For Ghana platform members who have no country string, returns '🇬🇭'.
 * Falls back to '' when the country cannot be resolved.
 */

/** Map of common country names (lower-cased) to ISO 3166-1 alpha-2 codes */
const COUNTRY_TO_CODE: Record<string, string> = {
  ghana: 'GH',
  nigeria: 'NG',
  'united kingdom': 'GB',
  uk: 'GB',
  'great britain': 'GB',
  'united states': 'US',
  usa: 'US',
  'united states of america': 'US',
  canada: 'CA',
  germany: 'DE',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  netherlands: 'NL',
  belgium: 'BE',
  switzerland: 'CH',
  austria: 'AT',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  ireland: 'IE',
  portugal: 'PT',
  greece: 'GR',
  poland: 'PL',
  'czech republic': 'CZ',
  czechia: 'CZ',
  hungary: 'HU',
  romania: 'RO',
  ukraine: 'UA',
  russia: 'RU',
  turkey: 'TR',
  israel: 'IL',
  'south africa': 'ZA',
  kenya: 'KE',
  ethiopia: 'ET',
  egypt: 'EG',
  morocco: 'MA',
  tanzania: 'TZ',
  uganda: 'UG',
  rwanda: 'RW',
  cameroon: 'CM',
  senegal: 'SN',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
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
  gabon: 'GA',
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
  australia: 'AU',
  'new zealand': 'NZ',
  japan: 'JP',
  china: 'CN',
  india: 'IN',
  pakistan: 'PK',
  bangladesh: 'BD',
  'sri lanka': 'LK',
  singapore: 'SG',
  malaysia: 'MY',
  indonesia: 'ID',
  philippines: 'PH',
  'south korea': 'KR',
  korea: 'KR',
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
  'saudi arabia': 'SA',
  'united arab emirates': 'AE',
  uae: 'AE',
  qatar: 'QA',
  kuwait: 'KW',
  oman: 'OM',
  jordan: 'JO',
  lebanon: 'LB',
  iran: 'IR',
  iraq: 'IQ',
}

/**
 * Converts an ISO 3166-1 alpha-2 code to its emoji flag.
 * Uses Unicode regional indicator symbols.
 */
function codeToFlag(code: string): string {
  const upper = code.toUpperCase()
  if (!/^[A-Z]{2}$/.test(upper)) return ''
  // Regional indicator A = 0x1F1E6, offset by char code of 'A' = 65
  const base = 0x1f1e6 - 65
  return String.fromCodePoint(base + upper.charCodeAt(0), base + upper.charCodeAt(1))
}

/**
 * Returns the emoji flag for a member.
 * @param platform - 'GHANA' | 'DIASPORA'
 * @param country  - Free-text country name or ISO-2 code from the member record
 */
export function getMemberFlag(
  platform: 'GHANA' | 'DIASPORA' | string | undefined,
  country: string | undefined
): string {
  if (platform === 'GHANA') return codeToFlag('GH')

  if (!country) return ''

  const trimmed = country.trim()

  // Try direct ISO-2 match first (e.g. 'US', 'GB')
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const flag = codeToFlag(trimmed)
    if (flag) return flag
  }

  // Lookup by name
  const code = COUNTRY_TO_CODE[trimmed.toLowerCase()]
  return code ? codeToFlag(code) : ''
}
