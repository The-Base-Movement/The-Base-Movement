import { politicalParties } from '@/components/admin/RegistrationForm.constants'

/**
 * Official Political Party Logo & Color Mapping Helper
 * -------------------------------------------------------------
 * Maps canonical party names and database string variations (abbreviations,
 * hyphen variations, legacy strings) to official logo image asset URLs.
 */

export const PARTY_LOGO_MAP: Record<string, string> = {
  'All People’s Congress — APC': '/party-affiliations/All_Peoples_Congress_-_APC.jpeg',
  'Convention People’s Party — CPP': '/party-affiliations/Convention_Peoples_Party.jpeg',
  'Ghana Freedom Party — GFP': '/party-affiliations/Ghana_Freedom_Party.jpeg',
  'Ghana Union Movement — GUM': '/party-affiliations/Ghana_Union_Movement_-_GUM.jpeg',
  'Great Consolidated Popular Party — GCPP':
    '/party-affiliations/Great_Consolidated_Popular_Party_-_GCPP.jpeg',
  'Liberal Party of Ghana — LPG': '/party-affiliations/Liberal_Party_of_Ghana_-_LPG.jpeg',
  'National Democratic Congress — NDC':
    '/party-affiliations/National_Democratic_Congress_-_NDC.jpeg',
  'National Democratic Party — NDP': '/party-affiliations/National_Democratic_Party_-_NDP.jpeg',
  'New Patriotic Party — NPP': '/party-affiliations/New_Patriotic_Party_-_NPP.jpeg',
  'The New Force — NF': '/party-affiliations/The_New_Force_-_NF.jpeg',
}

/** Explicit abbreviation fallback map */
export const PARTY_ABBREV_MAP: Record<string, string> = {
  APC: '/party-affiliations/All_Peoples_Congress_-_APC.jpeg',
  CPP: '/party-affiliations/Convention_Peoples_Party.jpeg',
  GFP: '/party-affiliations/Ghana_Freedom_Party.jpeg',
  GUM: '/party-affiliations/Ghana_Union_Movement_-_GUM.jpeg',
  GCPP: '/party-affiliations/Great_Consolidated_Popular_Party_-_GCPP.jpeg',
  LPG: '/party-affiliations/Liberal_Party_of_Ghana_-_LPG.jpeg',
  NDC: '/party-affiliations/National_Democratic_Congress_-_NDC.jpeg',
  NDP: '/party-affiliations/National_Democratic_Party_-_NDP.jpeg',
  NPP: '/party-affiliations/New_Patriotic_Party_-_NPP.jpeg',
  NF: '/party-affiliations/The_New_Force_-_NF.jpeg',
}

/** Color palette for party charts matching party brand aesthetics */
export const PARTY_COLOR_MAP: Record<string, string> = {
  'New Patriotic Party — NPP': '#1d4ed8', // Deep Blue
  'National Democratic Congress — NDC': '#15803d', // Green
  'Convention People’s Party — CPP': '#dc2626', // Red
  'The New Force — NF': '#eab308', // Gold / Yellow
  'Ghana Union Movement — GUM': '#9333ea', // Purple
  'All People’s Congress — APC': '#ea580c', // Orange
  'Ghana Freedom Party — GFP': '#06b6d4', // Cyan
  'Great Consolidated Popular Party — GCPP': '#059669', // Emerald
  'Liberal Party of Ghana — LPG': '#d97706', // Amber
  'National Democratic Party — NDP': '#4f46e5', // Indigo
}

function normalize(str: string): string {
  return str
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/[\u2014\u2013-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Resolves any raw DB string to the single canonical political party name */
export function getCanonicalPartyName(input?: string | null): string {
  if (!input || !input.trim()) return 'Unspecified / Independent'
  const trimmed = input.trim()
  const normInput = normalize(trimmed)

  // 1. Direct match in canonical politicalParties array
  for (const party of politicalParties) {
    if (normalize(party) === normInput) return party
  }

  // 2. Abbreviation match
  const abbrevMatch = trimmed.match(/\b(APC|CPP|GFP|GUM|GCPP|LPG|NDC|NDP|NPP|NF)\b/i)
  if (abbrevMatch) {
    const code = abbrevMatch[1].toUpperCase()
    for (const party of politicalParties) {
      if (party.toUpperCase().includes(code)) return party
    }
  }

  // 3. Partial substring match
  for (const party of politicalParties) {
    const normP = normalize(party)
    if (normP.includes(normInput) || normInput.includes(normP)) {
      return party
    }
  }

  return trimmed
}

export function getPartyLogo(partyName: string): string | null {
  if (!partyName) return null

  // 1. Direct match
  if (PARTY_LOGO_MAP[partyName]) return PARTY_LOGO_MAP[partyName]

  // 2. Abbreviation direct match (e.g. "NPP", "NDC", "GUM")
  const cleanUpper = partyName.trim().toUpperCase()
  if (PARTY_ABBREV_MAP[cleanUpper]) return PARTY_ABBREV_MAP[cleanUpper]

  // 3. Extract abbreviation from string (e.g., "New Patriotic Party - NPP" or "NPP (New Patriotic Party)")
  const abbrevMatch = partyName.match(/\b(APC|CPP|GFP|GUM|GCPP|LPG|NDC|NDP|NPP|NF)\b/i)
  if (abbrevMatch) {
    const code = abbrevMatch[1].toUpperCase()
    if (PARTY_ABBREV_MAP[code]) return PARTY_ABBREV_MAP[code]
  }

  // 4. Normalized string match
  const normInput = normalize(partyName)
  for (const [key, logoUrl] of Object.entries(PARTY_LOGO_MAP)) {
    const normKey = normalize(key)
    if (normKey === normInput || normKey.includes(normInput) || normInput.includes(normKey)) {
      return logoUrl
    }
  }

  return null
}

export function getPartyColor(partyName: string, index = 0): string {
  if (PARTY_COLOR_MAP[partyName]) return PARTY_COLOR_MAP[partyName]

  const normInput = normalize(partyName)
  for (const [key, color] of Object.entries(PARTY_COLOR_MAP)) {
    if (normalize(key).includes(normInput) || normInput.includes(normalize(key))) {
      return color
    }
  }

  const defaultColors = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#ca8a04',
    '#9333ea',
    '#ea580c',
    '#0891b2',
    '#4f46e5',
    '#be185d',
    '#0d9488',
  ]
  return defaultColors[index % defaultColors.length]
}
