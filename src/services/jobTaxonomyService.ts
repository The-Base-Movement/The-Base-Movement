import { supabase } from '@/lib/supabase'

export interface JobIndustry {
  id: number
  name: string
}

export interface JobSubCategory {
  id: number
  industry_id: number
  code: string
  name: string
}

export interface JobRole {
  id: number
  sub_category_id: number
  name: string
  level: string
}

export interface JobTaxonomy {
  industries: JobIndustry[]
  subCategories: JobSubCategory[]
  roles: JobRole[]
}

/** A member's job selection (standard role or a custom "Other" entry). */
export interface JobSelection {
  industryId: number | null
  subCategoryId: number | null
  roleId: number | null
  isOther: boolean
  customTitle: string
}

export const emptyJobSelection: JobSelection = {
  industryId: null,
  subCategoryId: null,
  roleId: null,
  isOther: false,
  customTitle: '',
}

/** True once the user has made a valid, complete job selection. */
export function isJobSelectionComplete(s: JobSelection): boolean {
  if (!s.industryId || !s.subCategoryId) return false
  if (s.isOther) return s.customTitle.trim().length > 0
  return !!s.roleId
}

/** One row per member with a saved job (from the role-gated analytics RPC). */
export interface JobAnalyticsRow {
  industry_id: number | null
  industry_name: string | null
  sub_category_id: number | null
  sub_category_name: string | null
  role_id: number | null
  role_name: string | null
  level: string | null
  custom_title: string | null
  is_custom: boolean
}

// The taxonomy is small (7/35/175) and immutable at runtime — load once and cache.
let cache: JobTaxonomy | null = null
let inflight: Promise<JobTaxonomy> | null = null

export const jobTaxonomyService = {
  async getTaxonomy(): Promise<JobTaxonomy> {
    if (cache) return cache
    if (inflight) return inflight
    inflight = (async () => {
      const [ind, sub, rol] = await Promise.all([
        supabase.from('job_industries').select('id, name').order('sort_order'),
        supabase
          .from('job_sub_categories')
          .select('id, industry_id, code, name')
          .order('sort_order'),
        supabase.from('job_roles').select('id, sub_category_id, name, level').order('sort_order'),
      ])
      if (ind.error) throw ind.error
      if (sub.error) throw sub.error
      if (rol.error) throw rol.error
      cache = {
        industries: (ind.data ?? []) as JobIndustry[],
        subCategories: (sub.data ?? []) as JobSubCategory[],
        roles: (rol.data ?? []) as JobRole[],
      }
      return cache
    })()
    try {
      return await inflight
    } finally {
      inflight = null
    }
  },

  /** Member job rows for the analytics dashboard (role-gated server-side). */
  async getAnalyticsRows(): Promise<JobAnalyticsRow[]> {
    const { data, error } = await supabase.rpc('get_job_analytics_rows')
    if (error) throw error
    return (data ?? []) as JobAnalyticsRow[]
  },

  /** Resolve saved DB ids back into a JobSelection for prefilling edit forms. */
  toSelection(saved: {
    job_industry_id?: number | null
    job_sub_category_id?: number | null
    job_role_id?: number | null
    job_custom_title?: string | null
  }): JobSelection {
    const isOther = !saved.job_role_id && !!saved.job_custom_title
    return {
      industryId: saved.job_industry_id ?? null,
      subCategoryId: saved.job_sub_category_id ?? null,
      roleId: saved.job_role_id ?? null,
      isOther,
      customTitle: saved.job_custom_title ?? '',
    }
  },
}
