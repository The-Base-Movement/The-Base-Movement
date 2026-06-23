import { supabase } from '@/lib/supabase'
import type { PartyOfficial, PartyTier } from '@/pages/admin/partyofficials/utils'

export const partyOfficialsService = {
  async getOfficials(): Promise<PartyOfficial[]> {
    const { data, error } = await supabase
      .from('party_officials')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as PartyOfficial[]
  },

  async getTiers(): Promise<PartyTier[]> {
    const { data } = await supabase
      .from('party_tiers')
      .select('*')
      .order('order_index', { ascending: true })
    return (data ?? []) as PartyTier[]
  },

  async createOfficial(official: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('party_officials').insert([official])
    if (error) throw error
  },

  async updateOfficial(id: string, official: Record<string, unknown>): Promise<void> {
    const { id: _id, ...rest } = official
    void _id
    const { error } = await supabase.from('party_officials').update(rest).eq('id', id)
    if (error) throw error
  },

  async deleteOfficial(id: string): Promise<void> {
    const { error } = await supabase.from('party_officials').delete().eq('id', id)
    if (error) throw error
  },

  async createTier(tier: Partial<PartyTier>): Promise<void> {
    const { error } = await supabase.from('party_tiers').insert([tier])
    if (error) throw error
  },

  async updateTier(id: string, tier: Partial<PartyTier>): Promise<void> {
    const { error } = await supabase.from('party_tiers').update(tier).eq('id', id)
    if (error) throw error
  },

  async deleteTier(id: string): Promise<void> {
    const { error } = await supabase.from('party_tiers').delete().eq('id', id)
    if (error) throw error
  },
}
