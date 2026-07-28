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
