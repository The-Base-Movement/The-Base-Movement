import { supabase } from '@/lib/supabase'

export interface FaqItem {
  id: string
  slug: string
  category: string
  question: string
  answerHtml: string
  sortOrder: number
  isPublished: boolean
}

interface DBFaqItem {
  id: string
  slug: string
  category: string
  question: string
  answer_html: string
  sort_order: number
  is_published: boolean
}

function fromDB(row: DBFaqItem): FaqItem {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    question: row.question,
    answerHtml: row.answer_html,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

class FaqService {
  private static instance: FaqService
  private constructor() {}
  static getInstance() {
    if (!FaqService.instance) FaqService.instance = new FaqService()
    return FaqService.instance
  }

  /** Public read — published items only, in display order. */
  async getPublishedFaqItems(): Promise<FaqItem[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[FAQ] Failed to fetch published FAQ items:', error)
      return []
    }
    return (data || []).map(fromDB)
  }

  /** Admin read — every item, published or not, in display order. */
  async getAllFaqItems(): Promise<FaqItem[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[FAQ] Failed to fetch FAQ items:', error)
      return []
    }
    return (data || []).map(fromDB)
  }

  async createFaqItem(item: Omit<FaqItem, 'id'>): Promise<boolean> {
    const { error } = await supabase.from('faq_items').insert({
      slug: item.slug,
      category: item.category,
      question: item.question,
      answer_html: item.answerHtml,
      sort_order: item.sortOrder,
      is_published: item.isPublished,
    })
    if (error) {
      console.error('[FAQ] Failed to create FAQ item:', error)
      return false
    }
    return true
  }

  async updateFaqItem(id: string, item: Partial<Omit<FaqItem, 'id'>>): Promise<boolean> {
    const updateData: Record<string, string | number | boolean> = {}
    if (item.slug !== undefined) updateData.slug = item.slug
    if (item.category !== undefined) updateData.category = item.category
    if (item.question !== undefined) updateData.question = item.question
    if (item.answerHtml !== undefined) updateData.answer_html = item.answerHtml
    if (item.sortOrder !== undefined) updateData.sort_order = item.sortOrder
    if (item.isPublished !== undefined) updateData.is_published = item.isPublished
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase.from('faq_items').update(updateData).eq('id', id)
    if (error) {
      console.error('[FAQ] Failed to update FAQ item:', error)
      return false
    }
    return true
  }

  async deleteFaqItem(id: string): Promise<boolean> {
    const { error } = await supabase.from('faq_items').delete().eq('id', id)
    if (error) {
      console.error('[FAQ] Failed to delete FAQ item:', error)
      return false
    }
    return true
  }

  /** Swaps sort_order with the adjacent item in the given direction. */
  async reorderFaqItem(items: FaqItem[], id: string, direction: 'up' | 'down'): Promise<boolean> {
    const index = items.findIndex((i) => i.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return false

    const a = items[index]
    const b = items[swapIndex]
    const [resA, resB] = await Promise.all([
      this.updateFaqItem(a.id, { sortOrder: b.sortOrder }),
      this.updateFaqItem(b.id, { sortOrder: a.sortOrder }),
    ])
    return resA && resB
  }
}

export const faqService = FaqService.getInstance()
