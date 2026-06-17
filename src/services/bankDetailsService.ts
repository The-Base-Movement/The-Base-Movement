import { supabase } from '@/lib/supabase'

export interface BankTransferDetails {
  bankName: string
  accountName: string
  accountNumber: string
  swiftCode: string
  branch: string
  address: string
  updatedAt: string | null
}

const EMPTY: BankTransferDetails = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  swiftCode: '',
  branch: '',
  address: '',
  updatedAt: null,
}

// Roles allowed to edit the bank details (mirrors can_edit_bank_details() in SQL,
// which is the actual enforcement — this only drives UI visibility).
export const BANK_DETAILS_EDITOR_ROLES = [
  'SUPER_ADMIN',
  'FOUNDER',
  'IT_MANAGER',
  'MOVEMENT_LEADER',
  'FINANCE_OFFICER',
] as const

export const bankDetailsService = {
  /** Public read of the single bank-details row. Returns blanks if unset. */
  async getBankDetails(): Promise<BankTransferDetails> {
    const { data, error } = await supabase
      .from('bank_transfer_details')
      .select('bank_name, account_name, account_number, swift_code, branch, address, updated_at')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      console.error('[bankDetailsService] getBankDetails failed:', error)
      return EMPTY
    }
    if (!data) return EMPTY
    return {
      bankName: data.bank_name ?? '',
      accountName: data.account_name ?? '',
      accountNumber: data.account_number ?? '',
      swiftCode: data.swift_code ?? '',
      branch: data.branch ?? '',
      address: data.address ?? '',
      updatedAt: data.updated_at ?? null,
    }
  },

  /** Update the single bank-details row. RLS restricts this to allowed roles. */
  async updateBankDetails(
    details: Omit<BankTransferDetails, 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('bank_transfer_details').upsert(
      {
        id: 1,
        bank_name: details.bankName.trim(),
        account_name: details.accountName.trim(),
        account_number: details.accountNumber.trim(),
        swift_code: details.swiftCode.trim(),
        branch: details.branch.trim(),
        address: details.address.trim(),
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      },
      { onConflict: 'id' }
    )
    if (error) {
      console.error('[bankDetailsService] updateBankDetails failed:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  },
}
