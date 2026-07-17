import { supabase } from '@/lib/supabase'

export const publicSiteService = {
  async getPublicStats(): Promise<{
    members: number
    chapters: number
    regions: number
    diaspora: number
    countries: number
    membersDelta: string
    chaptersDelta: string
    diasporaDelta: string
  }> {
    const { data, error } = await supabase.rpc('get_public_stats')
    if (error || !data) {
      console.warn('[PUBLIC SITE] Failed to fetch public stats:', error)
      return {
        members: 0,
        chapters: 0,
        regions: 16,
        diaspora: 0,
        countries: 0,
        membersDelta: '',
        chaptersDelta: '',
        diasporaDelta: '',
      }
    }

    return {
      members: Number(data.members_total ?? 0),
      chapters: Number(data.chapters_total ?? 0),
      regions: Number(data.regions_total ?? 16),
      diaspora: Number(data.diaspora_total ?? 0),
      countries: Number(data.countries_total ?? 0),
      membersDelta: String(data.members_delta ?? ''),
      chaptersDelta: String(data.chapters_delta ?? ''),
      diasporaDelta: String(data.diaspora_delta ?? ''),
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
