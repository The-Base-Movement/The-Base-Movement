import { supabase } from '@/lib/supabase'
import { politicalParties } from '@/components/admin/RegistrationForm.constants'
import { getPartyLogo, getPartyColor, getCanonicalPartyName } from '@/utils/partyLogos'

export interface PartyAffiliationStat {
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
   * Fetches party affiliation statistics with support for Platform (GHANA / DIASPORA)
   * and Region/Country cascading filters.
   */
  async getPartyAffiliationSummary(options?: {
    platform?: 'ALL' | 'GHANA' | 'DIASPORA'
    regionOrCountry?: string
  }): Promise<PartyAffiliationSummary> {
    const platform = options?.platform || 'ALL'
    const regionOrCountry = options?.regionOrCountry || ''

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

    // Initialize all canonical political parties
    politicalParties.forEach((p) => {
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
      const canonical = getCanonicalPartyName(rawParty)
      const targetKey = partyCounts[canonical] ? canonical : 'Unspecified / Independent'

      if (rawParty) {
        totalAffiliated++
      }

      const record = partyCounts[targetKey]
      record.total++
      if (isGhana) {
        record.ghana++
        if (u.region) record.regions[u.region] = (record.regions[u.region] || 0) + 1
      } else {
        record.diaspora++
        if (u.country) record.regions[u.country] = (record.regions[u.country] || 0) + 1
      }
    })

    // Query political_parties database table for party reference data and logo URLs
    const { data: dbParties } = await supabase
      .from('political_parties')
      .select('name, code, full_label, logo_url')
      .order('sort_order', { ascending: true })

    const dbPartyMap = new Map<
      string,
      { code: string; full_label: string; logo_url: string | null }
    >()
    if (dbParties) {
      dbParties.forEach((p) => {
        if (p.full_label) dbPartyMap.set(p.full_label, p)
        if (p.name) dbPartyMap.set(p.name, p)
        if (p.code) dbPartyMap.set(p.code, p)
      })
    }

    // Compute stats list
    const partyStats: PartyAffiliationStat[] = Object.entries(partyCounts)
      .map(([partyName, data], idx) => {
        const percentage =
          totalMembers > 0 ? Math.round((data.total / totalMembers) * 1000) / 10 : 0
        const dbInfo = dbPartyMap.get(partyName)
        const abbreviation =
          dbInfo?.code ||
          partyName.match(/—\s*([A-Z]+)$/)?.[1] ||
          partyName.substring(0, 3).toUpperCase()
        const logoUrl = dbInfo?.logo_url || getPartyLogo(partyName)

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
          partyName,
          abbreviation,
          logoUrl,
          color: getPartyColor(partyName, idx),
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
