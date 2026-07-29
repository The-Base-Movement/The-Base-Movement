import { supabase } from '@/lib/supabase'

/**
 * Location cascade for registration, driven by the authoritative
 * polling_stations table: Region → District → Constituency → Polling Station.
 * Selecting a polling station yields its code (persisted on the member).
 */

/** Distinct districts within a region, alphabetical. */
export async function getDistricts(region: string): Promise<string[]> {
  if (!region) return []
  const { data, error } = await supabase
    .from('polling_stations')
    .select('district')
    .ilike('region', region)
    .order('district', { ascending: true })
  if (error || !data) return []
  return [...new Set(data.map((r) => r.district as string).filter(Boolean))]
}

/** Distinct constituencies within a region + district, alphabetical. */
export async function getConstituencies(region: string, district: string): Promise<string[]> {
  if (!region || !district) return []
  const { data, error } = await supabase
    .from('polling_stations')
    .select('constituency')
    .ilike('region', region)
    .ilike('district', district)
    .order('constituency', { ascending: true })
  if (error || !data) return []
  return [...new Set(data.map((r) => r.constituency as string).filter(Boolean))]
}

/** Distinct constituencies within a region, alphabetical (no district needed). */
export async function getConstituenciesByRegion(region: string): Promise<string[]> {
  if (!region) return []
  const { data, error } = await supabase
    .from('polling_stations')
    .select('constituency')
    .ilike('region', region)
    .order('constituency', { ascending: true })
  if (error || !data) return []
  return [...new Set(data.map((r) => r.constituency as string).filter(Boolean))]
}

/**
 * District a constituency belongs to. Constituency → district is 1:1 in the EC
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
 * Reverse lookup by unique polling-station code → full location, so entering a
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
  let q = supabase.from('polling_stations').select('code, name, constituency')
  if (region) q = q.ilike('region', region)
  if (district) q = q.ilike('district', district)
  if (constituency) q = q.ilike('constituency', constituency)
  if (search.trim()) q = q.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  const { data, error } = await q.limit(10)
  if (error || !data) return []
  return data as PollingStationOption[]
}
