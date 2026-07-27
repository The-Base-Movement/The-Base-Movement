import { supabase } from '@/lib/supabase'
import { contentService } from '@/services/contentService'

/**
 * Impact / charitable-works content.
 * Backed by the public.impact_projects table. Public visitors read only
 * published rows (RLS); admins manage all rows. Images live in the shared
 * `media` storage bucket under the `impact` folder (reused via contentService).
 */

export interface ImpactProject {
  id: string
  title: string
  summary: string
  notes: string
  /** Up to 4 image URLs. First is used as the card cover. */
  images: string[]
  location: string
  datePerformed: string | null
  isPublished: boolean
  sortOrder: number
  createdAt: string | null
}

export type ImpactProjectInput = Omit<ImpactProject, 'id' | 'createdAt'>

const MAX_IMAGES = 4

function fromRow(r: Record<string, unknown>): ImpactProject {
  const imgs = Array.isArray(r.images) ? (r.images as string[]) : []
  return {
    id: String(r.id),
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
    notes: (r.notes as string) ?? '',
    images: imgs.filter(Boolean).slice(0, MAX_IMAGES),
    location: (r.location as string) ?? '',
    datePerformed: (r.date_performed as string) ?? null,
    isPublished: (r.is_published as boolean) ?? false,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: (r.created_at as string) ?? null,
  }
}

function toRow(input: ImpactProjectInput) {
  return {
    title: input.title.trim(),
    summary: input.summary.trim(),
    notes: input.notes.trim(),
    images: input.images.filter(Boolean).slice(0, MAX_IMAGES),
    location: input.location.trim() || null,
    date_performed: input.datePerformed || null,
    is_published: input.isPublished,
    sort_order: input.sortOrder,
  }
}

export const impactContentService = {
  /** Public: published works, ordered by sort_order then newest. */
  async getPublishedProjects(): Promise<ImpactProject[]> {
    const { data, error } = await supabase
      .from('impact_projects')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[impactContentService] getPublishedProjects failed:', error)
      return []
    }
    return (data ?? []).map(fromRow)
  },

  /** Admin: all works including drafts. */
  async getAllProjects(): Promise<ImpactProject[]> {
    const { data, error } = await supabase
      .from('impact_projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[impactContentService] getAllProjects failed:', error)
      return []
    }
    return (data ?? []).map(fromRow)
  },

  async createProject(input: ImpactProjectInput): Promise<{ success: boolean; error?: string }> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('impact_projects')
      .insert({ ...toRow(input), created_by: user?.id ?? null })
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async updateProject(
    id: string,
    input: ImpactProjectInput
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('impact_projects')
      .update({ ...toRow(input), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('impact_projects').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  /** Upload one impact image to the shared media bucket; returns its public URL. */
  async uploadImage(file: File): Promise<string | null> {
    return contentService.uploadImage(file, 'impact')
  },
}
