import { supabase } from '@/lib/supabase'
import type { BlogPost, MediaAsset, Author } from '@/types/admin'
import { adminService } from '@/services/adminService'
import mediaManifest from '@/data/media-manifest.json'

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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
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
        author_name: post.authorName,
        author_role: post.authorRole,
        author_image: post.authorImage,
        author_bio: post.authorBio,
        category: post.category,
        image_url: post.imageUrl || null,
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
    if (post.imageUrl !== undefined) updateData.image_url = post.imageUrl
    if (post.authorName !== undefined) updateData.author_name = post.authorName
    if (post.authorRole !== undefined) updateData.author_role = post.authorRole
    if (post.authorImage !== undefined) updateData.author_image = post.authorImage
    if (post.authorBio !== undefined) updateData.author_bio = post.authorBio
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
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Blog post soft deletion failed:', error)
      return false
    }
    return true
  }

  async getTrashedBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch trashed posts:', error)
      return []
    }

    return (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      authorId: p.author_id,
      authorName: p.author_name || 'Admin',
      category: p.category,
      imageUrl: p.image_url,
      readTime: p.read_time,
      isFeatured: p.is_featured,
      publishedAt: p.published_at,
      deletedAt: p.deleted_at,
      tags: p.tags || []
    }))
  }

  async restoreBlogPost(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to restore blog post:', error)
      return false
    }
    return true
  }

  async permanentlyDeleteBlogPost(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Permanent blog post deletion failed:', error)
      return false
    }
    return true
  }

  // --- Media Operations ---

  async uploadImage(file: File, path: string): Promise<string | null> {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      // Upload the file to the 'media' bucket
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) {
        console.error('[STORAGE] Upload failed:', uploadError)
        return null
      }

      // Track in media_library table
      await supabase.from('media_library').insert({
        filename: file.name,
        url: `${supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl}`,
        folder: path,
        size_bytes: file.size,
        mime_type: file.type
      })

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('[STORAGE] Unexpected error during upload:', err)
      return null
    }
  }

  async getMediaFiles(path: string): Promise<string[]> {
    // We now query the media_library table instead of just listing storage
    // to support soft deletes and metadata.
    const { data, error } = await supabase
      .from('media_library')
      .select('url')
      .eq('folder', path)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch media from library:', error)
      // Fallback to storage list if database fails
      return this.getMediaFilesFromStorage(path)
    }

    return (data || []).map(item => item.url)
  }

  private async getMediaFilesFromStorage(path: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from('media')
      .list(path)

    if (error) {
      console.error('[STORAGE] Failed to list media files:', error)
      return []
    }

    return (data || []).map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(`${path}/${file.name}`)
      return publicUrl
    })
  }

  async deleteMediaFile(url: string): Promise<boolean> {
    const { error } = await supabase
      .from('media_library')
      .update({ deleted_at: new Date().toISOString() })
      .eq('url', url)

    if (error) {
      console.error('[DATABASE] Media soft deletion failed:', error)
      return false
    }
    return true
  }

  async getTrashedMedia(): Promise<MediaAsset[]> {
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch trashed media:', error)
      return []
    }

    return data || []
  }

  async restoreMediaFile(url: string): Promise<boolean> {
    const { error } = await supabase
      .from('media_library')
      .update({ deleted_at: null })
      .eq('url', url)

    if (error) {
      console.error('[DATABASE] Failed to restore media file:', error)
      return false
    }
    return true
  }

  async permanentlyDeleteMediaFile(url: string): Promise<boolean> {
    // This is more complex because it involves storage deletion
    try {
      // 1. Get path from URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      // Assuming URL format: .../media/folder/filename
      const mediaIdx = pathParts.indexOf('media')
      const storagePath = pathParts.slice(mediaIdx + 1).join('/')

      // 2. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([storagePath])

      if (storageError) {
        console.warn('[STORAGE] Failed to remove file from storage, proceeding with DB cleanup:', storageError)
      }

      // 3. Delete from DB
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('url', url)

      if (dbError) {
        console.error('[DATABASE] Permanent media deletion failed:', dbError)
        return false
      }

      return true
    } catch (err) {
      console.error('[SERVICE] Unexpected error in permanent deletion:', err)
      return false
    }
  }

  async getLocalAssets(category: string): Promise<string[]> {
    const files = mediaManifest.files || []
    
    switch (category) {
      case 'logos-favicons':
        return files.filter(f => f.includes('logo') || f.includes('favicon'))
      case 'public-assets':
        return files.filter(f => !f.includes('logos') && !f.includes('favicon') && !f.includes('blog-images') && !f.includes('author-images'))
      default:
        return []
    }
  }

  // --- Authors Management ---

  async getAuthors(): Promise<Author[]> {
    interface DBAuthor {
      id: string
      name: string
      slug: string
      role?: string
      bio?: string
      image_url?: string
      created_at: string
      deleted_at?: string | null
    }

    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Failed to fetch authors:', error)
      return []
    }

    return (data as DBAuthor[] || []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bio,
      imageUrl: a.image_url,
      createdAt: a.created_at,
      deletedAt: a.deleted_at
    }))
  }

  async getAuthorById(id: string): Promise<Author | null> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[DATABASE] Failed to fetch author:', error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      role: data.role,
      bio: data.bio,
      imageUrl: data.image_url,
      createdAt: data.created_at,
      deletedAt: data.deleted_at
    }
  }

  async createAuthor(author: Omit<Author, 'id' | 'createdAt'>): Promise<boolean> {
    const { error } = await supabase
      .from('authors')
      .insert({
        name: author.name,
        slug: author.slug,
        role: author.role,
        bio: author.bio,
        image_url: author.imageUrl
      })

    if (error) {
      console.error('[DATABASE] Failed to create author:', error)
      return false
    }
    
    const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
    await adminService.logAction('Create Author', 'AUTHORS', 'Success', { name: author.name, adminId })
    
    return true
  }

  async updateAuthor(id: string, author: Partial<Author>): Promise<boolean> {
    const updateData: Record<string, string> = {}
    if (author.name !== undefined) updateData.name = author.name
    if (author.slug !== undefined) updateData.slug = author.slug
    if (author.role !== undefined) updateData.role = author.role
    if (author.bio !== undefined) updateData.bio = author.bio
    if (author.imageUrl !== undefined) updateData.image_url = author.imageUrl

    const { error } = await supabase
      .from('authors')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to update author:', error)
      return false
    }
    
    const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
    await adminService.logAction('Update Author', 'AUTHORS', 'Success', { id, adminId })
    
    return true
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('authors')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to soft-delete author:', error)
      return false
    }
    
    const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
    await adminService.logAction('Trash Author', 'AUTHORS', 'Success', { id, adminId })
    
    return true
  }

  async getTrashedAuthors(): Promise<Author[]> {
    interface DBAuthor {
      id: string
      name: string
      slug: string
      role?: string
      bio?: string
      image_url?: string
      created_at: string
      deleted_at?: string | null
    }

    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch trashed authors:', error)
      return []
    }

    return (data as DBAuthor[] || []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bio,
      imageUrl: a.image_url,
      createdAt: a.created_at,
      deletedAt: a.deleted_at
    }))
  }

  async restoreAuthor(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('authors')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to restore author:', error)
      return false
    }
    
    const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
    await adminService.logAction('Restore Author', 'AUTHORS', 'Success', { id, adminId })
    
    return true
  }

  async permanentlyDeleteAuthor(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('authors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to permanently delete author:', error)
      return false
    }
    
    const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
    await adminService.logAction('Delete Author', 'AUTHORS', 'Success', { id, adminId })
    
    return true
  }
}

export const contentService = ContentService.getInstance()
