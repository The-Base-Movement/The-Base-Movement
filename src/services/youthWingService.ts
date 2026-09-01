import { supabase } from '@/lib/supabase'
import { contentService } from '@/services/contentService'
import type { BlogPost } from '@/types/admin'

/** Youth Wing (14-17) is a civic/mobilization track, not party membership. These
 * records live in their own table and must never be counted as members, folded
 * into constituency/diaspora rolls, or given internal party access. */
export const YOUTH_WING_ROLE = 'youth_wing'

export type YouthWingStatus = 'PENDING_CONSENT' | 'ACTIVE' | 'REJECTED' | 'GRADUATED'

export interface YouthWingRegistration {
  fullName: string
  dateOfBirth: string
  gender: string
  region: string
  country: string
  religion: string
  schoolName: string
  educationLevel: string
  guardianName: string
  guardianRelationship: string
  guardianPhone: string
  consent: boolean
}

export interface YouthWingMember {
  id: string
  membership_number: string
  role: string
  full_name: string
  date_of_birth: string
  birth_year: number
  gender: string | null
  region: string | null
  country: string
  religion: string | null
  school_name: string | null
  education_level: string | null
  guardian_name: string
  guardian_relationship: string
  guardian_phone: string
  consent_given: boolean
  consent_at: string | null
  status: YouthWingStatus
  verified_at: string | null
  graduated_at: string | null
  rejection_reason: string | null
  created_at: string
}

/** A row of the admin directory view: the record plus its live age. */
export interface YouthWingDirectoryRow extends YouthWingMember {
  age: number
  is_over_age: boolean
  has_birthday_within_30_days: boolean
}

/** What a youth sees of their own record in the portal. */
export interface YouthWingLookup {
  membership_number: string
  full_name: string
  status: YouthWingStatus
  gender: string | null
  region: string | null
  country: string | null
  religion: string | null
  education_level: string | null
  school_name: string | null
  date_of_birth: string
  age: number
  created_at: string
}

/** What a card QR scan reveals. Never date of birth, school or guardian. */
export interface YouthWingVerification {
  membership_number: string
  full_name: string
  status: YouthWingStatus
  region: string | null
  country: string | null
  created_at: string
}

export interface YouthWingDirectoryFilters {
  status?: YouthWingStatus | 'all'
  gender?: string
  region?: string
  religion?: string
  minAge?: number
  maxAge?: number
  search?: string
}

export const youthWingService = {
  /** Public registration. Goes through a SECURITY DEFINER RPC: anon has no
   * direct insert or select on the minors' table. Returns the TBM-YW- number. */
  async submit(data: YouthWingRegistration): Promise<string> {
    const { data: regNo, error } = await supabase.rpc('submit_youth_wing_registration', {
      p_full_name: data.fullName,
      p_date_of_birth: data.dateOfBirth,
      p_gender: data.gender,
      p_region: data.region,
      p_country: data.country,
      p_religion: data.religion,
      p_school_name: data.schoolName,
      p_education_level: data.educationLevel,
      p_guardian_name: data.guardianName,
      p_guardian_relationship: data.guardianRelationship,
      p_guardian_phone: data.guardianPhone,
      p_consent: data.consent,
    })
    if (error) throw new Error(error.message)
    return regNo as string
  },

  /** Youth portal sign-in: membership number + date of birth, no auth account. */
  async lookup(membershipNumber: string, dateOfBirth: string): Promise<YouthWingLookup | null> {
    const { data, error } = await supabase.rpc('get_youth_wing_member', {
      p_membership_number: membershipNumber,
      p_date_of_birth: dateOfBirth,
    })
    if (error) throw new Error(error.message)
    return (data as YouthWingLookup[])?.[0] ?? null
  },

  /** Card QR target. Public, deliberately minimal. */
  async verify(membershipNumber: string): Promise<YouthWingVerification | null> {
    const { data, error } = await supabase.rpc('verify_youth_wing_member', {
      p_membership_number: membershipNumber,
    })
    if (error) throw new Error(error.message)
    return (data as YouthWingVerification[])?.[0] ?? null
  },

  /**
   * Admin directory. Reads the youth_wing_directory view, which adds the live
   * age; age filtering therefore happens in the database, not on the client.
   */
  async listDirectory(filters: YouthWingDirectoryFilters = {}): Promise<YouthWingDirectoryRow[]> {
    let query = supabase
      .from('youth_wing_directory')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
    if (filters.gender) query = query.eq('gender', filters.gender)
    if (filters.region) query = query.eq('region', filters.region)
    if (filters.religion) query = query.eq('religion', filters.religion)
    if (typeof filters.minAge === 'number') query = query.gte('age', filters.minAge)
    if (typeof filters.maxAge === 'number') query = query.lte('age', filters.maxAge)
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`
      query = query.or(`full_name.ilike.${term},membership_number.ilike.${term}`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data || []) as YouthWingDirectoryRow[]
  },

  async getByMembershipNumber(membershipNumber: string): Promise<YouthWingDirectoryRow | null> {
    const { data, error } = await supabase
      .from('youth_wing_directory')
      .select('*')
      .eq('membership_number', membershipNumber)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as YouthWingDirectoryRow) ?? null
  },

  /** Activation requires verified guardian consent, never Ghana Card / Voter ID. */
  async approve(id: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('youth_wing_members')
      .update({
        status: 'ACTIVE',
        verified_at: new Date().toISOString(),
        verified_by: auth?.user?.id ?? null,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async reject(id: string, reason: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('youth_wing_members')
      .update({
        status: 'REJECTED',
        rejection_reason: reason,
        verified_at: new Date().toISOString(),
        verified_by: auth?.user?.id ?? null,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  /**
   * Moves everyone who has turned 18 to GRADUATED. They are not auto-enrolled as
   * adults: adult membership is a separate registration at /register.
   * Returns how many records moved.
   */
  async flagGraduates(): Promise<number> {
    const { data, error } = await supabase.rpc('flag_youth_wing_graduates')
    if (error) throw new Error(error.message)
    return (data as number) ?? 0
  },

  /** Youth Wing articles. Never the adult /blog body of content. */
  async getArticles(): Promise<BlogPost[]> {
    return contentService.getBlogPosts('YOUTH')
  },

  async getArticleBySlug(slug: string): Promise<BlogPost | null> {
    return contentService.getBlogPostBySlug(slug, 'YOUTH')
  },
}
