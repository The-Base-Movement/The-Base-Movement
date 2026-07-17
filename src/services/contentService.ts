import { supabase } from '@/lib/supabase'
import type { BlogPost, MediaAsset, Author, PressRelease, MediaKitAsset } from '@/types/admin'
import { compressForUpload } from '@/lib/imageUtils'
import mediaManifest from '@/data/media-manifest.json'

interface DBAuthor {
  id: string
  name: string
  slug: string
  role?: string
  bio?: string
  image_url?: string | null
  member_id?: string | null
  created_at: string
  deleted_at?: string | null
}

async function resolveAuthorAvatars(authors: DBAuthor[]): Promise<Map<string, string>> {
  const memberIds = [...new Set(authors.map((author) => author.member_id).filter(Boolean))]
  const avatarMap = new Map<string, string>()
  if (!memberIds.length) return avatarMap

  const { data, error } = await supabase
    .from('users')
    .select('id, avatar_url')
    .in('id', memberIds as string[])

  if (error) {
    console.warn('[DATABASE] Failed to fetch author profile avatars:', error)
    return avatarMap
  }

  for (const user of data ?? []) {
    if (user.avatar_url) avatarMap.set(user.id, user.avatar_url)
  }

  return avatarMap
}

function withoutImageUrl<T extends { image_url?: unknown }>(data: T) {
  const fallbackData = { ...data }
  delete fallbackData.image_url
  return fallbackData
}

type BlogPostSnapshot = {
  id: string
  title: string
  slug: string
  status: BlogPost['status']
}

type ContentActivityAction =
  | 'created'
  | 'updated'
  | 'submitted'
  | 'published'
  | 'unpublished'
  | 'trashed'

class ContentService {
  private static instance: ContentService

  private constructor() {}

  private async getActorId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? 'hq-system-admin'
  }

  private async getBlogPostSnapshot(id: string): Promise<BlogPostSnapshot | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, status')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      if (error) console.warn('[DATABASE] Failed to fetch blog post snapshot:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      status: (data.status as BlogPost['status']) || 'Draft',
    }
  }

  private async notifyMediaContentActivity(
    action: ContentActivityAction,
    post: BlogPostSnapshot
  ): Promise<void> {
    const { mediaHubService } = await import('@/services/mediaHubService')
    await mediaHubService
      .createContentActivityAlert({
        action,
        postId: post.id,
        title: post.title,
        status: post.status,
        slug: post.slug,
      })
      .catch((error) => {
        console.warn('[MEDIA HUB] Content alert dispatch failed:', error)
      })
  }

  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService()
    }
    return ContentService.instance
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, authors(name, role, image_url, bio)')
      .is('deleted_at', null)
      .eq('status', 'Published')
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch blog posts:', error)
      return []
    }

    return (data || []).map((p: Record<string, unknown>) => {
      const a = p.authors as {
        name?: string
        role?: string
        image_url?: string
        bio?: string
      } | null
      return {
        id: p.id as string,
        title: p.title as string,
        slug: p.slug as string,
        excerpt: p.excerpt as string,
        content: p.content as string,
        authorId: p.author_id as string,
        authorName: a?.name || (p.author_name as string) || 'Admin',
        authorRole: a?.role || (p.author_role as string | undefined),
        authorImage: a?.image_url || (p.author_image as string | undefined),
        authorBio: a?.bio || (p.author_bio as string | undefined),
        category: p.category as string,
        imageUrl: p.image_url as string | undefined,
        readTime: p.read_time as string,
        isFeatured: p.is_featured as boolean,
        publishedAt: p.published_at as string,
        status: (p.status as 'Draft' | 'Pending Verification' | 'Published') || 'Draft',
        tags: (p.tags as string[]) || [],
        seoTitle: p.seo_title as string | undefined,
        metaDescription: p.meta_description as string | undefined,
      }
    })
  }

  async getPublishedPostCount(): Promise<number> {
    const { count, error } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'Published')

    if (error) return 0
    return count ?? 0
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, authors(name, role, image_url, bio)')
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

    const a = data.authors as {
      name?: string
      role?: string
      image_url?: string
      bio?: string
    } | null
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      authorId: data.author_id,
      authorName: a?.name || data.author_name || 'Admin',
      authorRole: a?.role || data.author_role,
      authorImage: a?.image_url || data.author_image,
      authorBio: a?.bio || data.author_bio,
      category: data.category,
      imageUrl: data.image_url,
      readTime: data.read_time,
      isFeatured: data.is_featured,
      publishedAt: data.published_at,
      status: (data.status as 'Draft' | 'Pending Verification' | 'Published') || 'Published',
      tags: data.tags || [],
      seoTitle: data.seo_title,
      metaDescription: data.meta_description,
    }
  }

  async createBlogPost(post: Omit<BlogPost, 'id'>): Promise<boolean> {
    const insertData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_id: post.authorId,
      category: post.category,
      image_url: post.imageUrl || null,
      read_time: post.readTime,
      is_featured: post.isFeatured,
      published_at: post.publishedAt,
      status: post.status || 'Draft',
      tags: post.tags,
      seo_title: post.seoTitle || null,
      meta_description: post.metaDescription || null,
    }

    let { data: createdRow, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select('id')
      .single()

    if (error?.code === 'PGRST204' && error.message.includes("'image_url'")) {
      if (post.imageUrl) {
        console.error('[DATABASE] blog_posts.image_url is missing; featured image cannot be saved.')
        return false
      }
      ;({ data: createdRow, error } = await supabase
        .from('blog_posts')
        .insert(withoutImageUrl(insertData))
        .select('id')
        .single())
      console.warn('[DATABASE] blog_posts.image_url is missing; featured image was not saved.')
    }

    if (error) {
      console.error(
        '[DATABASE] Blog post creation failed:',
        error.message,
        error.code,
        error.details
      )
      return false
    }
    if (post.status === 'Published') {
      const { discordService } = await import('@/services/discordService')
      discordService.blogPostPublished(
        post.title,
        post.category || '',
        post.authorName || 'Admin',
        post.slug
      )
    }
    await this.notifyMediaContentActivity(
      post.status === 'Published'
        ? 'published'
        : post.status === 'Pending Verification'
          ? 'submitted'
          : 'created',
      {
        id: createdRow?.id ?? post.slug,
        title: post.title,
        slug: post.slug,
        status: post.status || 'Draft',
      }
    )
    return true
  }

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
    const beforeUpdate = await this.getBlogPostSnapshot(id)
    const updateData: Record<string, string | number | boolean | string[] | null | undefined> = {}
    if (post.title) updateData.title = post.title
    if (post.slug) updateData.slug = post.slug
    if (post.excerpt) updateData.excerpt = post.excerpt
    if (post.content) updateData.content = post.content
    if (post.category) updateData.category = post.category
    if (post.imageUrl !== undefined) updateData.image_url = post.imageUrl || null
    if (post.readTime) updateData.read_time = post.readTime
    if (post.isFeatured !== undefined) updateData.is_featured = post.isFeatured
    if (post.publishedAt) updateData.published_at = post.publishedAt
    if (post.status) updateData.status = post.status
    if (post.tags) updateData.tags = post.tags
    if (post.seoTitle !== undefined) updateData.seo_title = post.seoTitle
    if (post.metaDescription !== undefined) updateData.meta_description = post.metaDescription

    let { error } = await supabase.from('blog_posts').update(updateData).eq('id', id)

    if (!error && post.slug && beforeUpdate && beforeUpdate.slug !== post.slug) {
      const { redirectService } = await import('@/services/redirectService')
      await redirectService
        .createRedirectRule({
          sourcePath: `/blog/${beforeUpdate.slug}`,
          destinationPath: `/blog/${post.slug}`,
          statusCode: 301,
          isActive: true,
          preserveQuery: true,
          notes: `Auto-generated on blog post slug update: ${beforeUpdate.title}`,
        })
        .catch((err) => {
          console.error('[REDIRECT] Failed to auto-generate blog post slug redirect:', err)
        })
    }

    if (error?.code === 'PGRST204' && error.message.includes("'image_url'")) {
      if (post.imageUrl) {
        console.error('[DATABASE] blog_posts.image_url is missing; featured image cannot be saved.')
        return false
      }
      ;({ error } = await supabase
        .from('blog_posts')
        .update(withoutImageUrl(updateData))
        .eq('id', id))
      console.warn('[DATABASE] blog_posts.image_url is missing; featured image was not saved.')
    }

    if (error) {
      console.error('[DATABASE] Blog post update failed:', error.message, error.code, error.details)
      return false
    }
    if (post.status === 'Published' && post.title && post.slug) {
      const { discordService } = await import('@/services/discordService')
      discordService.blogPostPublished(
        post.title,
        post.category || '',
        post.authorName || 'Admin',
        post.slug
      )
    }
    const snapshot = await this.getBlogPostSnapshot(id)
    if (snapshot) {
      const action =
        post.status === 'Published'
          ? 'published'
          : post.status === 'Draft' && beforeUpdate?.status === 'Published'
            ? 'unpublished'
            : post.status === 'Pending Verification'
              ? 'submitted'
              : 'updated'
      await this.notifyMediaContentActivity(action, snapshot)
    }
    return true
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const snapshot = await this.getBlogPostSnapshot(id)
    const { error } = await supabase
      .from('blog_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Blog post soft deletion failed:', error)
      return false
    }
    if (snapshot) await this.notifyMediaContentActivity('trashed', snapshot)
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
      status: (p.status as 'Draft' | 'Pending Verification' | 'Published') || 'Published',
      deletedAt: p.deleted_at,
      tags: p.tags || [],
    }))
  }

  async restoreBlogPost(id: string): Promise<boolean> {
    const { error } = await supabase.from('blog_posts').update({ deleted_at: null }).eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to restore blog post:', error)
      return false
    }
    return true
  }

  async permanentlyDeleteBlogPost(id: string): Promise<boolean> {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) {
      console.error('[DATABASE] Permanent blog post deletion failed:', error)
      return false
    }
    return true
  }

  // --- Media Operations ---

  async uploadImage(file: File, path: string): Promise<string | null> {
    try {
      const compressed = await compressForUpload(file)
      const ext = compressed.name.split('.').pop() ?? 'webp'
      const baseName = `${Math.random().toString(36).substring(2)}-${Date.now()}`
      const fileName = `${baseName}.${ext}`
      const filePath = `${path}/${fileName}`

      // Upload the file to the 'media' bucket
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, compressed)

      if (uploadError) {
        console.error('[STORAGE] Upload failed:', uploadError)
        return null
      }

      // Track in media_library table
      await supabase.from('media_library').insert({
        filename: fileName,
        url: `${supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl}`,
        folder: path,
        size_bytes: compressed.size,
        mime_type: compressed.type || 'image/webp',
      })

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('[STORAGE] Unexpected error during upload:', err)
      return null
    }
  }

  async getMediaFiles(path: string): Promise<string[]> {
    // 1. Handle local-only folders
    if (path === 'logos-favicons' || path === 'branding') {
      return this.getLocalAssets(path)
    }

    // 2. Query the media_library table
    const { data, error } = await supabase
      .from('media_library')
      .select('url')
      .eq('folder', path)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch media from library:', error)
      return this.getMediaFilesFromStorage(path)
    }

    // 3. Normalize URLs (ensure full public URL if relative)
    const normalizedUrls = (data || []).map((item) => {
      if (item.url.startsWith('http')) return item.url
      // If relative, it's likely /folder/filename.ext or folder/filename.ext
      const cleanPath = item.url.startsWith('/') ? item.url.substring(1) : item.url
      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(cleanPath)
      return publicUrl
    })

    // 4. Merge local-only assets with dynamic uploads
    if (path === 'priorities') {
      const localPriorities = await this.getLocalAssets('priorities')
      return [...normalizedUrls, ...localPriorities]
    }

    if (path === 'public-assets') {
      const localPublic = await this.getLocalAssets('public-assets')
      return [...normalizedUrls, ...localPublic]
    }

    // 5. If no DB results, fallback to storage direct list
    if (!data || data.length === 0) {
      return this.getMediaFilesFromStorage(path)
    }

    return normalizedUrls
  }

  private async getMediaFilesFromStorage(path: string): Promise<string[]> {
    const { data, error } = await supabase.storage.from('media').list(path)

    if (error) {
      console.error('[STORAGE] Failed to list media files:', error)
      return []
    }

    return (data || []).map((file) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(`${path}/${file.name}`)
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
      const { error: storageError } = await supabase.storage.from('media').remove([storagePath])

      if (storageError) {
        console.warn(
          '[STORAGE] Failed to remove file from storage, proceeding with DB cleanup:',
          storageError
        )
      }

      // 3. Delete from DB
      const { error: dbError } = await supabase.from('media_library').delete().eq('url', url)

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
    switch (category) {
      case 'logos-favicons':
        return mediaManifest.branding || []
      case 'branding':
        // Combine all branding assets for the library view
        return [...(mediaManifest.branding || []), ...(mediaManifest.publicAssets || [])]
      case 'public-assets':
        return mediaManifest.publicAssets || []
      case 'priorities':
        return [
          '/priorities/agro_processing_illustration.webp',
          '/priorities/digital_economy_illustration.webp',
          '/priorities/ghana_network_map.webp',
        ]
      default:
        return []
    }
  }

  // --- Authors Management ---

  async getAuthorRoles(): Promise<string[]> {
    const { data, error } = await supabase
      .from('author_roles')
      .select('name')
      .order('display_order', { ascending: true })

    if (error) {
      console.warn('[DATABASE] Failed to fetch author roles:', error)
      return [
        'Contributor',
        'Field Correspondent',
        'Regional Editor',
        'Senior Correspondent',
        'Strategic Analyst',
        'Digital Mobilizer',
        'Deputy Editor',
        'Chief Editor',
      ]
    }

    return (data || []).map((r: { name: string }) => r.name)
  }

  async getAuthors(): Promise<Author[]> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Failed to fetch authors:', error)
      return []
    }

    const authors = (data as DBAuthor[]) || []
    const avatarMap = await resolveAuthorAvatars(authors)

    return authors.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bio,
      imageUrl: a.image_url || (a.member_id ? avatarMap.get(a.member_id) : undefined),
      memberId: a.member_id ?? null,
      createdAt: a.created_at,
      deletedAt: a.deleted_at,
    }))
  }

  async getAuthorById(id: string): Promise<Author | null> {
    const { data, error } = await supabase.from('authors').select('*').eq('id', id).maybeSingle()

    if (error) {
      console.error('[DATABASE] Failed to fetch author:', error)
      return null
    }

    if (!data) return null

    const avatarMap = await resolveAuthorAvatars([data as DBAuthor])

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      role: data.role,
      bio: data.bio,
      imageUrl: data.image_url || (data.member_id ? avatarMap.get(data.member_id) : undefined),
      memberId: data.member_id ?? null,
      createdAt: data.created_at,
      deletedAt: data.deleted_at,
    }
  }

  async createAuthor(author: Omit<Author, 'id' | 'createdAt'>): Promise<boolean> {
    const { error } = await supabase.from('authors').insert({
      name: author.name,
      slug: author.slug,
      role: author.role,
      bio: author.bio,
      image_url: author.imageUrl,
      member_id: author.memberId ?? null,
    })

    if (error) {
      console.error('[DATABASE] Failed to create author:', error)
      return false
    }

    const adminId = await this.getActorId()
    const { adminService } = await import('@/services/adminService')
    await adminService.logAction('Create Author', 'AUTHORS', 'Success', {
      name: author.name,
      adminId,
    })

    return true
  }

  async updateAuthor(id: string, author: Partial<Author>): Promise<boolean> {
    const updateData: Record<string, unknown> = {}
    if (author.name !== undefined) updateData.name = author.name
    if (author.slug !== undefined) updateData.slug = author.slug
    if (author.role !== undefined) updateData.role = author.role
    if (author.bio !== undefined) updateData.bio = author.bio
    if (author.imageUrl !== undefined) updateData.image_url = author.imageUrl
    if (author.memberId !== undefined) updateData.member_id = author.memberId ?? null

    const { error } = await supabase.from('authors').update(updateData).eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to update author:', error)
      return false
    }

    const adminId = await this.getActorId()
    const { adminService } = await import('@/services/adminService')
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

    const adminId = await this.getActorId()
    const { adminService } = await import('@/services/adminService')
    await adminService.logAction('Trash Author', 'AUTHORS', 'Success', { id, adminId })

    return true
  }

  async getTrashedAuthors(): Promise<Author[]> {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch trashed authors:', error)
      return []
    }

    const authors = (data as DBAuthor[]) || []
    const avatarMap = await resolveAuthorAvatars(authors)

    return authors.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bio,
      imageUrl: a.image_url || (a.member_id ? avatarMap.get(a.member_id) : undefined),
      memberId: a.member_id ?? null,
      createdAt: a.created_at,
      deletedAt: a.deleted_at,
    }))
  }

  async restoreAuthor(id: string): Promise<boolean> {
    const { error } = await supabase.from('authors').update({ deleted_at: null }).eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to restore author:', error)
      return false
    }

    const adminId = await this.getActorId()
    const { adminService } = await import('@/services/adminService')
    await adminService.logAction('Restore Author', 'AUTHORS', 'Success', { id, adminId })

    return true
  }

  async permanentlyDeleteAuthor(id: string): Promise<boolean> {
    const { error } = await supabase.from('authors').delete().eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to permanently delete author:', error)
      return false
    }

    const adminId = await this.getActorId()
    const { adminService } = await import('@/services/adminService')
    await adminService.logAction('Delete Author', 'AUTHORS', 'Success', { id, adminId })

    return true
  }

  // --- Press Release Operations ---

  async getPressReleases(): Promise<PressRelease[]> {
    const { data, error } = await supabase
      .from('press_releases')
      .select('*')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch press releases:', error)
      return []
    }

    return (data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
      category: p.category as string,
      excerpt: p.excerpt as string | undefined,
      content: p.content as string,
      publishedAt: p.published_at as string,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
      authorId: p.author_id as string | undefined,
      imageUrl: p.image_url as string | undefined,
      isOfficial: p.is_official as boolean,
    }))
  }

  async createPressRelease(
    release: Omit<PressRelease, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> {
    const { error } = await supabase.from('press_releases').insert({
      title: release.title,
      slug: release.slug,
      category: release.category,
      excerpt: release.excerpt,
      content: release.content,
      published_at: release.publishedAt,
      author_id: release.authorId,
      image_url: release.imageUrl,
      is_official: release.isOfficial,
    })

    if (error) {
      console.error('[DATABASE] Press release creation failed:', error)
      return false
    }
    return true
  }

  async getMediaFolders(): Promise<{ id: string; label: string }[]> {
    const { data, error } = await supabase
      .from('media_categories')
      .select('name, label')
      .is('deleted_at', null)
      .order('label', { ascending: true })

    if (error || !data || data.length === 0) {
      return [
        { id: 'blog-images', label: 'Blog Posts' },
        { id: 'editor-content', label: 'Editor Media' },
        { id: 'branding', label: 'Branding Assets' },
        { id: 'author-images', label: 'Authors' },
        { id: 'product-images', label: 'Product Images' },
        { id: 'logos-favicons', label: 'Logos & Favicons' },
        { id: 'public-assets', label: 'Public Assets' },
        { id: 'party-officials', label: 'Party Officials' },
        { id: 'priorities', label: 'Strategic Priorities' },
      ]
    }

    const foldersList = data.map((item) => ({
      id: item.name,
      label: item.label,
    }))

    if (!foldersList.some((f) => f.id === 'priorities')) {
      foldersList.push({ id: 'priorities', label: 'Strategic Priorities' })
    }

    return foldersList
  }

  async createMediaCategory(name: string, label: string): Promise<boolean> {
    const { error } = await supabase.from('media_categories').insert({
      name,
      label,
    })

    if (error) {
      console.error('[DATABASE] Failed to create media category:', error)
      return false
    }

    const adminId = await this.getActorId()
    const { adminService } = await import('@/services/adminService')
    await adminService.logAction('Create Media Category', 'SYSTEM', 'Success', {
      name,
      label,
      adminId,
    })

    return true
  }

  // --- Likes Operations ---

  async likePost(postId: string): Promise<void> {
    const { error } = await supabase.from('blog_post_likes').insert({ post_id: postId })
    if (error && error.code !== '23505') {
      console.error('[DATABASE] Failed to like post:', error)
    }
  }

  async unlikePost(postId: string): Promise<void> {
    const { error } = await supabase.from('blog_post_likes').delete().eq('post_id', postId)
    if (error) console.error('[DATABASE] Failed to unlike post:', error)
  }

  async isPostLiked(postId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blog_post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .maybeSingle()
    if (error) return false
    return !!data
  }

  async getLikedPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_post_likes')
      .select('post_id, created_at')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return []

    const postIds = data.map((r: { post_id: string }) => r.post_id)

    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*, authors(name, role, image_url, bio)')
      .in('id', postIds)
      .is('deleted_at', null)

    if (postsError || !posts) return []

    const orderedIds = postIds
    return orderedIds
      .map((id: string) => {
        const p = posts.find((post: Record<string, unknown>) => post.id === id)
        if (!p) return null
        const a = (p as Record<string, unknown>).authors as {
          name?: string
          role?: string
          image_url?: string
          bio?: string
        } | null
        return {
          id: p.id as string,
          title: p.title as string,
          slug: p.slug as string,
          excerpt: p.excerpt as string,
          content: p.content as string,
          authorId: p.author_id as string,
          authorName: a?.name || (p.author_name as string) || 'Admin',
          authorRole: a?.role || (p.author_role as string | undefined),
          authorImage: a?.image_url || (p.author_image as string | undefined),
          authorBio: a?.bio || (p.author_bio as string | undefined),
          category: p.category as string,
          imageUrl: p.image_url as string | undefined,
          readTime: p.read_time as string,
          isFeatured: p.is_featured as boolean,
          publishedAt: p.published_at as string,
          status: ((p.status as string) || 'Published') as
            | 'Draft'
            | 'Pending Verification'
            | 'Published',
          tags: (p.tags as string[]) || [],
          seoTitle: p.seo_title as string | undefined,
          metaDescription: p.meta_description as string | undefined,
        }
      })
      .filter(Boolean) as BlogPost[]
  }

  // --- Media Kit Operations ---

  async getMediaKitAssets(): Promise<MediaKitAsset[]> {
    const { data, error } = await supabase
      .from('media_kit')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch media kit assets:', error)
      return []
    }

    return (data || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      title: a.title as string,
      description: a.description as string | undefined,
      fileUrl: a.file_url as string,
      fileType: a.file_type as 'LOGO' | 'GUIDELINE' | 'PHOTO',
      createdAt: a.created_at as string,
      updatedAt: a.updated_at as string,
      isActive: a.is_active as boolean,
    }))
  }

  async getBlogComments() {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('id, author_name, content, flagged, created_at, post_id, blog_posts(title, slug)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (
      data as unknown as Array<{
        id: string
        author_name: string
        content: string
        flagged: boolean
        created_at: string
        post_id: string
        blog_posts: { title: string; slug: string } | null
      }>
    ).map((r) => ({
      id: r.id,
      author_name: r.author_name,
      content: r.content,
      flagged: r.flagged,
      created_at: r.created_at,
      post_id: r.post_id,
      post_title: r.blog_posts?.title ?? null,
      post_slug: r.blog_posts?.slug ?? null,
    }))
  }

  async getProductReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, author_name, rating, content, created_at, product_id, store_inventory(name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (
      data as unknown as Array<{
        id: string
        author_name: string
        rating: number
        content: string | null
        created_at: string
        product_id: string | null
        store_inventory: { name: string } | null
      }>
    ).map((r) => ({
      id: r.id,
      author_name: r.author_name,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      product_id: r.product_id,
      product_name: r.store_inventory?.name ?? null,
    }))
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase.from('blog_comments').delete().eq('id', id)
    if (error) throw error
  }

  async unflagComment(id: string): Promise<void> {
    const { error } = await supabase.from('blog_comments').update({ flagged: false }).eq('id', id)
    if (error) throw error
  }

  async deleteReview(id: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) throw error
  }

  async sendPushNotification(params: {
    userIds: string[] | 'all'
    title: string
    body: string
    url?: string
  }): Promise<void> {
    await supabase.functions.invoke('send-push-notification', { body: params }).catch(console.error)
  }
}

export const contentService = ContentService.getInstance()
