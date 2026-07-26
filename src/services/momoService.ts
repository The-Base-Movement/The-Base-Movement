import { supabase } from '@/lib/supabase'

export interface MomoDetails {
  merchantNumber: string
  merchantName: string
  network: string
  /** USSD short code that works across all Ghana networks, e.g. *713*3742# */
  shortCode: string
  isActive: boolean
  updatedAt: string | null
}

const EMPTY: MomoDetails = {
  merchantNumber: '0597567336',
  merchantName: 'The Base Movement',
  network: 'MTN',
  shortCode: '*713*3742#',
  isActive: true,
  updatedAt: null,
}

// Same roles as bank details editor — both are finance-managed.
export const MOMO_EDITOR_ROLES = [
  'SUPER_ADMIN',
  'FOUNDER',
  'IT_MANAGER',
  'MOVEMENT_LEADER',
  'FINANCE_OFFICER',
] as const

export const momoService = {
  /** Public read of the single MoMo row. Returns blanks if unset. */
  async getMomoDetails(): Promise<MomoDetails> {
    // select('*') so a not-yet-migrated short_code column doesn't error the read.
    const { data, error } = await supabase
      .from('momo_details')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      console.error('[momoService] getMomoDetails failed:', error)
      return EMPTY
    }
    if (!data) return EMPTY
    return {
      merchantNumber: data.merchant_number ?? '',
      merchantName: data.merchant_name ?? 'The Base Movement',
      network: data.network ?? 'MTN',
      shortCode: data.short_code ?? '',
      isActive: data.is_active ?? true,
      updatedAt: data.updated_at ?? null,
    }
  },

  /** Update the single MoMo row. RLS restricts this to allowed roles. */
  async updateMomoDetails(
    details: Omit<MomoDetails, 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('momo_details').upsert(
      {
        id: 1,
        merchant_number: details.merchantNumber.trim(),
        merchant_name: details.merchantName.trim(),
        network: details.network.trim(),
        short_code: details.shortCode.trim() || null,
        is_active: details.isActive,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      },
      { onConflict: 'id' }
    )
    if (error) {
      console.error('[momoService] updateMomoDetails failed:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  },
}
