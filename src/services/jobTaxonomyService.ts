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

// The taxonomy is small (7/35/175) — load once and cache; writes invalidate it.
let cache: JobTaxonomy | null = null
let inflight: Promise<JobTaxonomy> | null = null

/** Next append position: max(sort_order)+1 within an optional parent scope. */
async function nextSortOrder(
  table: 'job_industries' | 'job_sub_categories' | 'job_roles',
  parentCol?: string,
  parentId?: number
): Promise<number> {
  let q = supabase
    .from(table)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  if (parentCol && parentId != null) q = q.eq(parentCol, parentId)
  const { data, error } = await q
  if (error) throw error
  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 1
}

/** Derive a short uppercase code from a sub-category name (fallback when none given). */
function deriveCode(name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return slug || 'SUBCAT'
}

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

  /** Drop the in-memory cache so the next getTaxonomy() refetches (call after writes). */
  invalidate(): void {
    cache = null
    inflight = null
  },

  /** Force a fresh taxonomy load, bypassing the cache. */
  async refresh(): Promise<JobTaxonomy> {
    this.invalidate()
    return this.getTaxonomy()
  },

  // ---- Admin CRUD (RLS-gated to is_admin()). Each write invalidates the cache. ----

  async createIndustry(name: string): Promise<void> {
    const sort_order = await nextSortOrder('job_industries')
    const { error } = await supabase
      .from('job_industries')
      .insert({ name: name.trim(), sort_order })
    if (error) throw error
    this.invalidate()
  },

  async updateIndustry(id: number, name: string): Promise<void> {
    const { error } = await supabase
      .from('job_industries')
      .update({ name: name.trim() })
      .eq('id', id)
    if (error) throw error
    this.invalidate()
  },

  async deleteIndustry(id: number): Promise<void> {
    const { error } = await supabase.from('job_industries').delete().eq('id', id)
    if (error) throw error
    this.invalidate()
  },

  async createSubCategory(industryId: number, name: string, code?: string): Promise<void> {
    const sort_order = await nextSortOrder('job_sub_categories', 'industry_id', industryId)
    const { error } = await supabase.from('job_sub_categories').insert({
      industry_id: industryId,
      name: name.trim(),
      code: (code?.trim() || deriveCode(name)).slice(0, 20),
      sort_order,
    })
    if (error) throw error
    this.invalidate()
  },

  async updateSubCategory(id: number, patch: { name?: string; code?: string }): Promise<void> {
    const update: Record<string, string> = {}
    if (patch.name !== undefined) update.name = patch.name.trim()
    if (patch.code !== undefined) update.code = patch.code.trim().slice(0, 20)
    const { error } = await supabase.from('job_sub_categories').update(update).eq('id', id)
    if (error) throw error
    this.invalidate()
  },

  async deleteSubCategory(id: number): Promise<void> {
    const { error } = await supabase.from('job_sub_categories').delete().eq('id', id)
    if (error) throw error
    this.invalidate()
  },

  async createRole(subCategoryId: number, name: string, level: string): Promise<void> {
    const sort_order = await nextSortOrder('job_roles', 'sub_category_id', subCategoryId)
    const { error } = await supabase.from('job_roles').insert({
      sub_category_id: subCategoryId,
      name: name.trim(),
      level: level.trim() || 'Mid',
      sort_order,
    })
    if (error) throw error
    this.invalidate()
  },

  async updateRole(id: number, patch: { name?: string; level?: string }): Promise<void> {
    const update: Record<string, string> = {}
    if (patch.name !== undefined) update.name = patch.name.trim()
    if (patch.level !== undefined) update.level = patch.level.trim()
    const { error } = await supabase.from('job_roles').update(update).eq('id', id)
    if (error) throw error
    this.invalidate()
  },

  async deleteRole(id: number): Promise<void> {
    const { error } = await supabase.from('job_roles').delete().eq('id', id)
    if (error) throw error
    this.invalidate()
  },

  /**
   * Member-usage counts per taxonomy id, aggregated on the database side efficiently via RPC
   * (so it correctly sees all members and is pagination-proof). Used to warn before deleting
   * an in-use entry — the DB also hard-blocks such deletes via FK.
   */
  async getUsageCounts(): Promise<{
    industries: Record<number, number>
    subCategories: Record<number, number>
    roles: Record<number, number>
  }> {
    const { data, error } = await supabase.rpc('get_job_taxonomy_usage')
    if (error) throw error

    const industries: Record<number, number> = {}
    const subCategories: Record<number, number> = {}
    const roles: Record<number, number> = {}

    for (const r of (data as Array<{
      entry_type: string
      entry_id: number
      usage_count: string | number
    }>) ?? []) {
      const count = Number(r.usage_count)
      if (r.entry_type === 'industry') {
        industries[r.entry_id] = count
      } else if (r.entry_type === 'sub_category') {
        subCategories[r.entry_id] = count
      } else if (r.entry_type === 'role') {
        roles[r.entry_id] = count
      }
    }
    return { industries, subCategories, roles }
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
