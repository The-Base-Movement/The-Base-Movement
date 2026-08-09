import { supabase } from '@/lib/supabase'
import { politicalParties as defaultParties } from '@/components/admin/RegistrationForm.constants'
import { getPartyLogo, getPartyColor, getCanonicalPartyName } from '@/utils/partyLogos'

export interface PoliticalPartyRecord {
  id: string
  name: string
  code: string
  full_label: string
  sort_order: number
  logo_url: string | null
  color: string | null
  created_at?: string
}

export interface PartyAffiliationStat {
  id?: string
  partyName: string
  abbreviation: string
  logoUrl: string | null
  color: string
  totalMembers: number
  percentage: number
  ghanaCount: number
  diasporaCount: number
  topRegionOrCountry: string
}

export interface PartyAffiliationSummary {
  totalMembers: number
  totalAffiliated: number
  affiliationRate: number
  topParty: { name: string; count: number; percentage: number } | null
  ghanaTotal: number
  diasporaTotal: number
  partyStats: PartyAffiliationStat[]
  availableGhanaRegions: string[]
  availableDiasporaCountries: string[]
}

export const partyAffiliationService = {
  /**
   * Fetches all registered political parties / CSOs from the database.
   * Handles schema variations gracefully.
   */
  async getParties(): Promise<PoliticalPartyRecord[]> {
    let { data, error } = await supabase
      .from('political_parties')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.warn('[partyAffiliationService] getParties fallback query:', error.message)
      const fallback = await supabase
        .from('political_parties')
        .select('id, name, code, full_label, sort_order')
        .order('sort_order', { ascending: true })
      data = fallback.data as unknown as typeof data
    }

    if (!Array.isArray(data)) {
      return []
    }
    return data as PoliticalPartyRecord[]
  },

  /**
   * Creates a new political party or CSO entry.
   * Retries automatically without extra columns if live DB table lacks them.
   */
  async createParty(party: {
    name: string
    code: string
    full_label?: string
    logo_url?: string | null
    color?: string | null
    sort_order?: number
  }): Promise<PoliticalPartyRecord> {
    const fullLabel =
      party.full_label?.trim() || `${party.name.trim()} — ${party.code.trim().toUpperCase()}`

    const payload: Record<string, string | number | null> = {
      name: party.name.trim(),
      code: party.code.trim().toUpperCase(),
      full_label: fullLabel,
      logo_url: party.logo_url?.trim() || null,
      color: party.color?.trim() || null,
      sort_order: party.sort_order ?? 99,
    }

    let { data, error } = await supabase
      .from('political_parties')
      .insert([payload])
      .select()
      .single()

    if (error && (error.code === 'PGRST204' || error.message.includes('column') || error.message.includes('400'))) {
      console.warn('[partyAffiliationService] createParty retrying without new columns:', error.message)
      const safePayload = { ...payload }
      delete safePayload.color
      delete safePayload.logo_url
      const retry = await supabase
        .from('political_parties')
        .insert([safePayload])
        .select('id, name, code, full_label, sort_order')
        .single()
      data = retry.data as unknown as typeof data
      error = retry.error
    }

    if (error) {
      console.error('[partyAffiliationService] createParty failed:', error)
      throw new Error(error.message || 'Failed to create political party / CSO')
    }

    return data as PoliticalPartyRecord
  },

  /**
   * Updates an existing political party or CSO entry (name, logo, code, color, sort order).
   */
  async updateParty(
    id: string,
    updates: Partial<{
      name: string
      code: string
      full_label: string
      logo_url: string | null
      color: string | null
      sort_order: number
    }>
  ): Promise<PoliticalPartyRecord> {
    let { data, error } = await supabase
      .from('political_parties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error && (error.code === 'PGRST204' || error.message.includes('column') || error.message.includes('400'))) {
      console.warn('[partyAffiliationService] updateParty retrying without new columns:', error.message)
      const safeUpdates = { ...updates }
      delete safeUpdates.color
      delete safeUpdates.logo_url
      const retry = await supabase
        .from('political_parties')
        .update(safeUpdates)
        .eq('id', id)
        .select('id, name, code, full_label, sort_order')
        .single()
      data = retry.data as unknown as typeof data
      error = retry.error
    }

    if (error) {
      console.error('[partyAffiliationService] updateParty failed:', error)
      throw new Error(error.message || 'Failed to update political party / CSO')
    }

    return data as PoliticalPartyRecord
  },

  /**
   * Deletes a political party or CSO entry from the database.
   */
  async deleteParty(id: string): Promise<boolean> {
    const { error } = await supabase.from('political_parties').delete().eq('id', id)
    if (error) {
      console.error('[partyAffiliationService] deleteParty failed:', error)
      throw new Error(error.message || 'Failed to delete political party / CSO')
    }
    return true
  },

  /**
   * Uploads a logo image for a party/CSO to Supabase storage and returns the public URL.
   */
  async uploadPartyLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `party-logos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      // Fallback to branding bucket if media bucket fails
      const { error: fallbackError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (fallbackError) {
        throw new Error(uploadError.message || 'Failed to upload logo image')
      }
      const { data } = supabase.storage.from('branding').getPublicUrl(fileName)
      return data.publicUrl
    }

    const { data } = supabase.storage.from('media').getPublicUrl(fileName)
    return data.publicUrl
  },

  /**
   * Fetches party affiliation statistics with support for Platform (GHANA / DIASPORA)
   * and Region/Country cascading filters.
   */
  async getPartyAffiliationSummary(options?: {
    platform?: 'ALL' | 'GHANA' | 'DIASPORA'
    regionOrCountry?: string
  }): Promise<PartyAffiliationSummary> {
    const platform = options?.platform || 'ALL'
    const regionOrCountry = options?.regionOrCountry || ''

    // 1. Fetch DB political parties for dynamic matching & reference metadata
    let { data: dbParties, error: partiesErr } = await supabase
      .from('political_parties')
      .select('*')
      .order('sort_order', { ascending: true })

    if (partiesErr) {
      console.warn('[partyAffiliationService] Falling back to standard columns for political_parties:', partiesErr.message)
      const fallback = await supabase
        .from('political_parties')
        .select('id, name, code, full_label, sort_order')
        .order('sort_order', { ascending: true })
      dbParties = fallback.data as unknown as typeof dbParties
    }

    const dbPartyMap = new Map<
      string,
      { id: string; name: string; code: string; full_label: string; logo_url?: string | null; color?: string | null }
    >()

    const allKnownParties = new Set<string>()

    if (dbParties && Array.isArray(dbParties)) {
      dbParties.forEach((p) => {
        const full = p.full_label || `${p.name} — ${p.code}`
        dbPartyMap.set(full, p)
        dbPartyMap.set(p.name, p)
        if (p.code) dbPartyMap.set(p.code, p)
        allKnownParties.add(full)
      })
    }

    // Include defaults as backup
    defaultParties.forEach((p) => allKnownParties.add(p))

    // 2. Fetch members batch by batch
    const BATCH_SIZE = 1000
    let users: Array<{
      id: string
      party_affiliation: string | null
      platform: string | null
      region: string | null
      country: string | null
    }> = []

    let page = 0
    let hasMore = true

    while (hasMore) {
      const from = page * BATCH_SIZE
      const to = from + BATCH_SIZE - 1

      let query = supabase
        .from('users')
        .select('id, party_affiliation, platform, region, country')
        .is('deleted_at', null)
        .range(from, to)

      if (platform === 'GHANA') {
        query = query.eq('platform', 'GHANA')
        if (regionOrCountry) {
          query = query.eq('region', regionOrCountry)
        }
      } else if (platform === 'DIASPORA') {
        query = query.eq('platform', 'DIASPORA')
        if (regionOrCountry) {
          query = query.eq('country', regionOrCountry)
        }
      }

      const { data: batch, error } = await query
      if (error) {
        console.warn('[partyAffiliationService] Failed to fetch users:', error.message)
        if (page === 0) {
          return {
            totalMembers: 0,
            totalAffiliated: 0,
            affiliationRate: 0,
            topParty: null,
            ghanaTotal: 0,
            diasporaTotal: 0,
            partyStats: [],
            availableGhanaRegions: [],
            availableDiasporaCountries: [],
          }
        }
        break
      }

      if (!batch || batch.length === 0) {
        hasMore = false
      } else {
        users = users.concat(batch)
        if (batch.length < BATCH_SIZE) {
          hasMore = false
        } else {
          page++
        }
      }
    }
    const totalMembers = users.length

    // Extract unique regions for Ghana and countries for Diaspora dropdowns
    const availableGhanaRegions = Array.from(
      new Set(
        users.filter((u) => u.platform === 'GHANA' && u.region).map((u) => u.region as string)
      )
    ).sort()

    const availableDiasporaCountries = Array.from(
      new Set(
        users.filter((u) => u.platform === 'DIASPORA' && u.country).map((u) => u.country as string)
      )
    ).sort()

    // Aggregators by party
    const partyCounts: Record<
      string,
      { total: number; ghana: number; diaspora: number; regions: Record<string, number> }
    > = {}

    // Initialize all known political parties (DB + defaults)
    allKnownParties.forEach((p) => {
      partyCounts[p] = { total: 0, ghana: 0, diaspora: 0, regions: {} }
    })
    partyCounts['Unspecified / Independent'] = { total: 0, ghana: 0, diaspora: 0, regions: {} }

    let totalAffiliated = 0
    let ghanaTotal = 0
    let diasporaTotal = 0

    users.forEach((u) => {
      const isGhana = u.platform === 'GHANA'
      if (isGhana) ghanaTotal++
      else diasporaTotal++

      const rawParty = u.party_affiliation?.trim()
      let canonical = 'Unspecified / Independent'

      if (rawParty) {
        totalAffiliated++
        // Check if rawParty directly matches a DB party or canonical string
        if (partyCounts[rawParty]) {
          canonical = rawParty
        } else {
          canonical = getCanonicalPartyName(rawParty)
        }
      }

      if (!partyCounts[canonical]) {
        partyCounts[canonical] = { total: 0, ghana: 0, diaspora: 0, regions: {} }
      }

      const record = partyCounts[canonical]
      record.total++
      if (isGhana) {
        record.ghana++
        if (u.region) record.regions[u.region] = (record.regions[u.region] || 0) + 1
      } else {
        record.diaspora++
        if (u.country) record.regions[u.country] = (record.regions[u.country] || 0) + 1
      }
    })

    // Compute stats list
    const partyStats: PartyAffiliationStat[] = Object.entries(partyCounts)
      .map(([partyName, data], idx) => {
        const percentage =
          totalMembers > 0 ? Math.round((data.total / totalMembers) * 1000) / 10 : 0
        const dbInfo = dbPartyMap.get(partyName)
        const abbreviation =
          dbInfo?.code ||
          partyName.match(/—\s*([A-Z0-9]+)$/)?.[1] ||
          partyName.substring(0, 3).toUpperCase()
        const logoUrl = dbInfo?.logo_url || getPartyLogo(partyName)
        const color = dbInfo?.color || getPartyColor(partyName, idx)

        // Find top region or country for this party
        let topRegionOrCountry = '—'
        let maxRegionCount = 0
        Object.entries(data.regions).forEach(([loc, cnt]) => {
          if (cnt > maxRegionCount) {
            maxRegionCount = cnt
            topRegionOrCountry = loc
          }
        })

        return {
          id: dbInfo?.id,
          partyName,
          abbreviation,
          logoUrl,
          color,
          totalMembers: data.total,
          percentage,
          ghanaCount: data.ghana,
          diasporaCount: data.diaspora,
          topRegionOrCountry,
        }
      })
      .filter((p) => p.partyName !== 'Unspecified / Independent' || p.totalMembers > 0)
      .sort((a, b) => b.totalMembers - a.totalMembers)

    // Compute top party
    const validTop = partyStats.find((p) => p.partyName !== 'Unspecified / Independent')
    const topParty = validTop
      ? { name: validTop.partyName, count: validTop.totalMembers, percentage: validTop.percentage }
      : null

    const affiliationRate =
      totalMembers > 0 ? Math.round((totalAffiliated / totalMembers) * 1000) / 10 : 0

    return {
      totalMembers,
      totalAffiliated,
      affiliationRate,
      topParty,
      ghanaTotal,
      diasporaTotal,
      partyStats,
      availableGhanaRegions,
      availableDiasporaCountries,
    }
  },
}
