import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/types/admin'

class ContentService {
  private static instance: ContentService

  private constructor() {}

  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService()
    }
    return ContentService.instance
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch blog posts:', error)
      return []
    }

    return (data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
      excerpt: p.excerpt as string,
      content: p.content as string,
      authorId: p.author_id as string,
      authorName: (p.author_name as string) || 'Admin',
      authorRole: p.author_role as string | undefined,
      authorImage: p.author_image as string | undefined,
      authorBio: p.author_bio as string | undefined,
      category: p.category as string,
      imageUrl: p.image_url as string | undefined,
      readTime: p.read_time as string,
      isFeatured: p.is_featured as boolean,
      publishedAt: p.published_at as string,
      tags: (p.tags as string[]) || [],
      seoTitle: p.seo_title as string | undefined,
      metaDescription: p.meta_description as string | undefined
    }))
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('[DATABASE] Failed to fetch blog post by slug:', error)
      return null
    }

    if (!data) {
      console.warn(`[DATABASE] No blog post found for slug: "${slug}"`)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      authorId: data.author_id,
      authorName: data.author_name || 'Admin',
      authorRole: data.author_role,
      authorImage: data.author_image,
      authorBio: data.author_bio,
      category: data.category,
      imageUrl: data.image_url,
      readTime: data.read_time,
      isFeatured: data.is_featured,
      publishedAt: data.published_at,
      tags: data.tags || [],
      seoTitle: data.seo_title,
      metaDescription: data.meta_description
    }
  }

  async createBlogPost(post: Omit<BlogPost, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author_id: post.authorId,
        category: post.category,
        avatar_url: post.imageUrl || null,
        read_time: post.readTime,
        is_featured: post.isFeatured,
        published_at: post.publishedAt,
        tags: post.tags,
        seo_title: post.seoTitle || null,
        meta_description: post.metaDescription || null
      })

    if (error) {
      console.error('[DATABASE] Blog post creation failed:', error)
      return false
    }
    return true
  }

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
    const updateData: Record<string, string | number | boolean | string[] | null | undefined> = {}
    if (post.title) updateData.title = post.title
    if (post.slug) updateData.slug = post.slug
    if (post.excerpt) updateData.excerpt = post.excerpt
    if (post.content) updateData.content = post.content
    if (post.category) updateData.category = post.category
    if (post.imageUrl !== undefined) updateData.avatar_url = post.imageUrl
    if (post.readTime) updateData.read_time = post.readTime
    if (post.isFeatured !== undefined) updateData.is_featured = post.isFeatured
    if (post.publishedAt) updateData.published_at = post.publishedAt
    if (post.tags) updateData.tags = post.tags
    if (post.seoTitle !== undefined) updateData.seo_title = post.seoTitle
    if (post.metaDescription !== undefined) updateData.meta_description = post.metaDescription

    const { error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Blog post update failed:', error)
      return false
    }
    return true
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Blog post deletion failed:', error)
      return false
    }
    return true
  }
}

export const contentService = ContentService.getInstance()
