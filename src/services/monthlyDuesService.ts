import { supabase } from '@/lib/supabase'

/**
 * Supabase integration layer for the voluntary monthly dues system.
 * All mutations go through server-authorized RPCs — the browser never
 * writes payment or enrollment state directly.
 */

export interface MonthlyDuesSettings {
  amount_ghs: number
  due_day: number
  grace_period_days: number
  recurring_enrollment_enabled: boolean
  policy_version: string
  effective_from: string
}

export interface MonthlyDuesEnrollment {
  id: string
  member_id: string
  status: 'active' | 'opted_out' | 'pending_activation' | 'cancellation_pending'
  payment_mode: 'manual' | 'recurring'
  hubtel_invoice_id: string | null
  enrolled_at: string
  opted_out_at: string | null
  provider_cancelled_at: string | null
}

export interface MonthlyDuesConsent {
  id: string
  member_id: string
  email_enabled: boolean
  sms_enabled: boolean
  dues_enrollment_enabled: boolean
  recurring_payment_authorized: boolean
  policy_version: string | null
  source: 'enrollment' | 'profile_settings' | 'opt_out' | 'admin_correction'
  recorded_at: string
}

export interface MonthlyDuesPayment {
  id: string
  member_id: string
  dues_month: string
  due_date: string
  amount_ghs: number
  display_amount: number
  display_currency: string
  exchange_rate_to_ghs: number
  payment_mode: 'manual_hubtel' | 'recurring_hubtel' | 'offline'
  status: 'due' | 'pending' | 'paid' | 'failed' | 'overdue' | 'waived' | 'cancelled'
  hubtel_reference: string | null
  provider_transaction_id: string | null
  paid_at: string | null
  verified_by: string | null
  verification_notes: string | null
  receipt_number: string | null
  created_at: string
}

export interface FinanceDuesPaymentRow extends MonthlyDuesPayment {
  member_name: string | null
  member_reg_no: string | null
}

export interface FinanceDuesFilters {
  status?: MonthlyDuesPayment['status']
  duesMonth?: string
  paymentMode?: MonthlyDuesPayment['payment_mode']
  search?: string
  limit?: number
}

export const monthlyDuesService = {
  /** Current active dues policy terms (restricted RPC; null when unset). */
  async getCurrentSettings(): Promise<MonthlyDuesSettings | null> {
    const { data, error } = await supabase.rpc('get_current_monthly_dues_settings')
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null
    return { ...row, amount_ghs: Number(row.amount_ghs) } as MonthlyDuesSettings
  },

  /** The signed-in member's enrollment, if any (RLS-scoped). */
  async getMyEnrollment(): Promise<MonthlyDuesEnrollment | null> {
    const { data, error } = await supabase
      .from('monthly_dues_enrollments')
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data as MonthlyDuesEnrollment | null
  },

  /** The signed-in member's latest consent row (append-only history). */
  async getMyLatestConsent(): Promise<MonthlyDuesConsent | null> {
    const { data, error } = await supabase
      .from('monthly_dues_consents')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data as MonthlyDuesConsent | null
  },

  /** The signed-in member's dues obligations, newest month first. */
  async getMyPayments(): Promise<MonthlyDuesPayment[]> {
    const { data, error } = await supabase
      .from('monthly_dues_payments')
      .select('*')
      .order('dues_month', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => ({
      ...row,
      amount_ghs: Number(row.amount_ghs),
      display_amount: Number(row.display_amount),
      exchange_rate_to_ghs: Number(row.exchange_rate_to_ghs),
    })) as MonthlyDuesPayment[]
  },

  /** Appends a consent row for the signed-in member. Returns the consent id. */
  async setConsent(
    emailEnabled: boolean,
    smsEnabled: boolean,
    source: 'enrollment' | 'profile_settings' = 'profile_settings'
  ): Promise<string> {
    const { data, error } = await supabase.rpc('set_monthly_dues_consent', {
      p_email: emailEnabled,
      p_sms: smsEnabled,
      p_source: source,
    })
    if (error) throw error
    return data as string
  },

  /** Enrolls the signed-in member. Consent is recorded before enrollment. */
  async enroll(
    paymentMode: 'manual' | 'recurring',
    emailEnabled: boolean,
    smsEnabled: boolean,
    policyVersion: string
  ): Promise<{ enrollment_id: string; status: string }> {
    const { data, error } = await supabase.rpc('enroll_monthly_dues', {
      p_payment_mode: paymentMode,
      p_email: emailEnabled,
      p_sms: smsEnabled,
      p_policy_version: policyVersion,
    })
    if (error) throw error
    return data as { enrollment_id: string; status: string }
  },

  /** Opts the signed-in member out. History is preserved server-side. */
  async optOut(): Promise<{ enrollment_id: string; status: string }> {
    const { data, error } = await supabase.rpc('opt_out_monthly_dues')
    if (error) throw error
    return data as { enrollment_id: string; status: string }
  },

  /**
   * Ensures the signed-in member's obligation exists for a month. The
   * currency arguments only snapshot the cosmetic display conversion —
   * the GHS amount always comes from the active settings server-side.
   */
  async ensureMyObligation(
    month: string,
    displayCurrency?: string,
    exchangeRateToGhs?: number
  ): Promise<{ payment_id: string; status: string }> {
    const { data, error } = await supabase.rpc('ensure_monthly_dues_obligation', {
      p_member_id: null,
      p_month: month,
      p_display_currency: displayCurrency ?? null,
      p_exchange_rate_to_ghs: exchangeRateToGhs ?? null,
    })
    if (error) throw error
    return data as { payment_id: string; status: string }
  },

  /**
   * Hubtel Recurring Invoice lifecycle for the signed-in member.
   * 'create' registers the provider invoice for a pending enrollment,
   * 'verify' reconciles provider state (activating on confirmation),
   * 'cancel' cancels at the provider — enrollment opts out only on success.
   */
  async manageRecurring(
    action: 'create' | 'verify' | 'cancel'
  ): Promise<{ status: string; invoiceId?: string; retryable?: boolean }> {
    const { data, error } = await supabase.functions.invoke('monthly-dues-recurring', {
      body: { action },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as { status: string; invoiceId?: string; retryable?: boolean }
  },

  // ------------------------------------------------------------------
  // Finance (requires MANAGE_DONATIONS:DONATIONS — enforced by RLS/RPC)
  // ------------------------------------------------------------------

  /** Full active settings row for the finance settings card. */
  async getFinanceSettings(): Promise<
    (MonthlyDuesSettings & { id: string; is_active: boolean }) | null
  > {
    const { data, error } = await supabase
      .from('monthly_dues_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return { ...data, amount_ghs: Number(data.amount_ghs) }
  },

  /** Creates or updates the singleton active dues policy. */
  async saveFinanceSettings(settings: {
    amount_ghs: number
    due_day: number
    grace_period_days: number
    recurring_enrollment_enabled: boolean
    policy_version: string
  }): Promise<void> {
    const existing = await this.getFinanceSettings()
    if (existing) {
      const { error } = await supabase
        .from('monthly_dues_settings')
        .update(settings)
        .eq('id', existing.id)
      if (error) throw error
      return
    }
    const { error } = await supabase.from('monthly_dues_settings').insert(settings)
    if (error) throw error
  },

  /** Filtered dues obligations for the finance table, with member identity. */
  async listFinancePayments(filters: FinanceDuesFilters = {}): Promise<FinanceDuesPaymentRow[]> {
    let query = supabase
      .from('monthly_dues_payments')
      .select('*, users(full_name, registration_number)')
      .order('due_date', { ascending: false })
      .limit(filters.limit ?? 500)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.duesMonth) query = query.eq('dues_month', filters.duesMonth)
    if (filters.paymentMode) query = query.eq('payment_mode', filters.paymentMode)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => {
      const member = Array.isArray(row.users) ? row.users[0] : row.users
      return {
        ...row,
        users: undefined,
        amount_ghs: Number(row.amount_ghs),
        display_amount: Number(row.display_amount),
        exchange_rate_to_ghs: Number(row.exchange_rate_to_ghs),
        member_name: member?.full_name ?? null,
        member_reg_no: member?.registration_number ?? null,
      }
    }) as FinanceDuesPaymentRow[]
  },

  /** All enrollments, for finance KPIs. */
  async listFinanceEnrollments(): Promise<MonthlyDuesEnrollment[]> {
    const { data, error } = await supabase
      .from('monthly_dues_enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as MonthlyDuesEnrollment[]
  },

  /** A member's append-only consent history, for finance review. */
  async getMemberConsentHistory(memberId: string): Promise<MonthlyDuesConsent[]> {
    const { data, error } = await supabase
      .from('monthly_dues_consents')
      .select('*')
      .eq('member_id', memberId)
      .order('recorded_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as MonthlyDuesConsent[]
  },

  /** Marks an offline payment verified with required notes (finance RPC). */
  async verifyOfflinePayment(paymentId: string, notes: string): Promise<void> {
    const { error } = await supabase.rpc('verify_offline_monthly_dues_payment', {
      p_payment_id: paymentId,
      p_notes: notes,
    })
    if (error) throw error
  },
}
