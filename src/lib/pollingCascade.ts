import { supabase } from '@/lib/supabase'

/**
 * Location cascade for registration, driven by the authoritative
 * polling_stations table: Region -> District -> Constituency -> Polling Station.
 * Selecting a polling station yields its code (persisted on the member).
 */

const PAGE_SIZE = 1000

type PollingStationRow = Record<string, string | null>

async function fetchAllPollingStationRows(
  select: string,
  // ponytail: PostgrestFilterBuilder's generics don't survive reassignment
  // through a callback without exploding into an "excessively deep" TS error.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyFilters?: (query: any) => any
): Promise<PollingStationRow[]> {
  const rows: PollingStationRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from('polling_stations').select(select)
    if (applyFilters) query = applyFilters(query)
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1)
    if (error) return []
    if (!data?.length) return rows
    rows.push(...(data as unknown as PollingStationRow[]))
    if (data.length < PAGE_SIZE) return rows
  }
}

export function distinctSortedStrings(rows: PollingStationRow[], field: string): string[] {
  return [
    ...new Set(rows.map((row) => row[field]).filter((value): value is string => !!value)),
  ].sort((a, b) => a.localeCompare(b))
}

/** Distinct districts within a region, alphabetical. */
export async function getDistricts(region: string): Promise<string[]> {
  if (!region) return []
  const rows = await fetchAllPollingStationRows('district', (query) =>
    query.ilike('region', region)
  )
  return distinctSortedStrings(rows, 'district')
}

/** Distinct constituencies within a region + district, alphabetical. */
export async function getConstituencies(region: string, district: string): Promise<string[]> {
  if (!region || !district) return []
  const rows = await fetchAllPollingStationRows('constituency', (query) =>
    query.ilike('region', region).ilike('district', district)
  )
  return distinctSortedStrings(rows, 'constituency')
}

/** Distinct constituencies within a region, alphabetical (no district needed). */
export async function getConstituenciesByRegion(region: string): Promise<string[]> {
  if (!region) return []
  const rows = await fetchAllPollingStationRows('constituency', (query) =>
    query.ilike('region', region)
  )
  return distinctSortedStrings(rows, 'constituency')
}

/**
 * District a constituency belongs to. Constituency -> district is 1:1 in the EC
 * data, so the first match is authoritative (used to auto-fill the District field).
 */
export async function getDistrictForConstituency(
  region: string,
  constituency: string
): Promise<string | null> {
  if (!constituency) return null
  let q = supabase.from('polling_stations').select('district').ilike('constituency', constituency)
  if (region) q = q.ilike('region', region)
  const { data, error } = await q.limit(1)
  if (error || !data?.length) return null
  return (data[0].district as string) || null
}

export interface PollingStationFull {
  code: string
  name: string
  district: string
  constituency: string
  region: string
}

/**
 * Reverse lookup by unique polling-station code -> full location, so entering a
 * code auto-fills region / district / constituency / station name.
 */
export async function lookupPollingStationByCode(code: string): Promise<PollingStationFull | null> {
  const c = code.trim()
  if (!c) return null
  const { data, error } = await supabase
    .from('polling_stations')
    .select('code, name, district, constituency, region')
    .ilike('code', c)
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as PollingStationFull
}

export interface PollingStationOption {
  code: string
  name: string
  constituency: string
}

/** Search polling stations within the selected region/district/constituency. */
export async function searchPollingStations(
  region: string,
  district: string,
  constituency: string,
  search: string
): Promise<PollingStationOption[]> {
  const needle = search.trim()
  const rows = await fetchAllPollingStationRows('code, name, constituency', (query) => {
    let next = query
    if (region) next = next.ilike('region', region)
    if (district) next = next.ilike('district', district)
    if (constituency) next = next.ilike('constituency', constituency)
    if (needle) next = next.or(`code.ilike.%${needle}%,name.ilike.%${needle}%`)
    return next.order('name', { ascending: true })
  })

  return rows
    .flatMap((row) =>
      typeof row.code === 'string' &&
      typeof row.name === 'string' &&
      typeof row.constituency === 'string'
        ? [{ code: row.code, name: row.name, constituency: row.constituency }]
        : []
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code))
}
