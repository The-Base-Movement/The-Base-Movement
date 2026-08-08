import { supabase } from '@/lib/supabase'

/** Trailing-30-day growth label. Empty when there is nothing to report, so the
 *  stat card can drop its trend arrow rather than show a bare icon. */
function formatDelta(value: unknown): string {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count) || count <= 0) return ''
  return `+${count.toLocaleString()} in the last 30 days`
}

/** 12-week trend series from the RPC. Empty when absent, which tells the
 *  sparkline to render nothing rather than invent a shape. */
function toSeries(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map((n) => Number(n) || 0)
}

export interface PublicStats {
  members: number
  chapters: number
  regions: number
  diaspora: number
  countries: number
  membersDelta: string
  chaptersDelta: string
  diasporaDelta: string
  membersSeries: number[]
  diasporaSeries: number[]
  countriesSeries: number[]
  regionsSeries: number[]
}

export const EMPTY_PUBLIC_STATS: PublicStats = {
  members: 0,
  chapters: 0,
  regions: 16,
  diaspora: 0,
  countries: 0,
  membersDelta: '',
  chaptersDelta: '',
  diasporaDelta: '',
  membersSeries: [],
  diasporaSeries: [],
  countriesSeries: [],
  regionsSeries: [],
}

export const publicSiteService = {
  async getPublicStats(): Promise<PublicStats> {
    const { data, error } = await supabase.rpc('get_public_stats')
    if (error || !data) {
      console.warn('[PUBLIC SITE] Failed to fetch public stats:', error)
      return EMPTY_PUBLIC_STATS
    }

    // get_public_stats() returns: members, diaspora, chapters, regions,
    // countries, {members,diaspora}_delta_30d, and *_series (12 weekly points).
    const chapters = Number(data.chapters ?? 0)
    return {
      members: Number(data.members ?? 0),
      chapters,
      regions: Number(data.regions ?? 16),
      diaspora: Number(data.diaspora ?? 0),
      countries: Number(data.countries ?? 0),
      membersDelta: formatDelta(data.members_delta_30d),
      // Chapters carry no created_at, so there is no growth figure to show on
      // the countries card — it reports the live community count instead.
      chaptersDelta: chapters ? `Across ${chapters.toLocaleString()} communities` : '',
      diasporaDelta: formatDelta(data.diaspora_delta_30d),
      membersSeries: toSeries(data.members_series),
      diasporaSeries: toSeries(data.diaspora_series),
      countriesSeries: toSeries(data.countries_series),
      regionsSeries: toSeries(data.regions_series),
    }
  },

  async subscribeToNewsletter(email: string, phone?: string): Promise<boolean> {
    try {
      const normalizedPhone = phone?.trim() || null
      const normalizedEmail = email.trim().toLowerCase()
      const { data: subscriber, error } = await supabase
        .from('newsletter_subscribers')
        .upsert(
          { email: normalizedEmail, phone_number: normalizedPhone, status: 'Active' },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select('id, email, phone_number, created_at')
        .single()

      if (error && error.code === '42501') {
        const { data: insertedSubscriber, error: insertError } = await supabase
          .from('newsletter_subscribers')
          .insert({ email: normalizedEmail, phone_number: normalizedPhone, status: 'Active' })
          .select('id, email, phone_number, created_at')
          .single()
        if (insertError && insertError.code === '23505') return true
        if (insertError) throw insertError
        return !!insertedSubscriber
      }

      if (error && error.code === '23505') return true
      if (error) throw error
      return !!subscriber
    } catch (error) {
      console.error('[PUBLIC SITE] Newsletter subscription failed:', error)
      return false
    }
  },

  async getSiteSettings(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase.from('site_settings').select('key, value')
      if (error) throw error
      return (data || []).reduce<Record<string, unknown>>((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})
    } catch (error) {
      console.error('[PUBLIC SITE] Failed to fetch site settings:', error)
      return {}
    }
  },
}
