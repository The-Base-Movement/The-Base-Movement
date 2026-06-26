/**
 * admin/Blogs.tsx
 * ─────────────────────────────────────────────────────────────────
 * Orchestrator for the Editorial Command admin page.
 * Owns all state, data-fetching, and event handlers.
 * Delegates all rendering to sub-components in ./blogs/.
 *
 * Views:
 *  list  — BlogsHeader + BlogsKPIs + BlogsFilters + BlogsGrid + MobileFilterSheet
 *  edit  — BlogEditorView (3-pane editor)
 *  view  — BlogViewPage (read-only preview)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { BlogPost, AdminUser, Author } from '@/types/admin'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { toast } from 'sonner'

import { BlogsHeader } from './blogs/BlogsHeader'
import { BlogsKPIs } from './blogs/BlogsKPIs'
import { BlogsFilters } from './blogs/BlogsFilters'
import { BlogsGrid } from './blogs/BlogsGrid'
import { MobileFilterSheet } from './blogs/MobileFilterSheet'
import { BlogEditorView } from './blogs/BlogEditorView'
import { BlogViewPage } from './blogs/BlogViewPage'
import { SortToggle } from '@/components/ui/SortToggle'

type FormData = Omit<BlogPost, 'id'>

const EMPTY_FORM: FormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  authorId: '',
  category: 'Movement',
  imageUrl: '',
  readTime: '5 min read',
  isFeatured: false,
  publishedAt: new Date().toISOString(),
  status: 'Draft',
  tags: [],
  seoTitle: '',
  metaDescription: '',
  authorName: '',
  authorRole: '',
  authorImage: '',
  authorBio: '',
}

const withAuthorSnapshot = (form: FormData, author?: Author): FormData => {
  if (!author || form.authorId) return form
  return {
    ...form,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role || '',
    authorImage: author.imageUrl || '',
    authorBio: author.bio || '',
  }
}

export default function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  const editorRef = useRef<{ getContent: () => string } | null>(null)

  // View state persisted in sessionStorage
  const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'view'>(() =>
    isBrowser
      ? (sessionStorage.getItem('blogs_currentView') as 'list' | 'edit' | 'view') || 'list'
      : 'list'
  )
  const [editingPost, setEditPost] = useState<BlogPost | null>(() => {
    const saved = isBrowser ? sessionStorage.getItem('blogs_editingPost') : null
    return saved ? JSON.parse(saved) : null
  })
  const [viewPost, setViewPost] = useState<BlogPost | null>(() => {
    const saved = isBrowser ? sessionStorage.getItem('blogs_viewPost') : null
    return saved ? JSON.parse(saved) : null
  })
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = isBrowser ? sessionStorage.getItem('blogs_formData') : null
    return saved ? JSON.parse(saved) : EMPTY_FORM
  })

  // List view state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null)
  const [isMobile, setIsMobile] = useState(() => (isBrowser ? window.innerWidth <= 640 : false))
  const [showMobileFilter, setShowMobileFilter] = useState(false)

  // Editor and media state
  const [showMediaPanel, setShowMediaPanel] = useState(true)
  const [showIntelPanel, setShowIntelPanel] = useState(true)
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [activeMediaFolder, setActiveMediaFolder] = useState('blog-images')
  const [isMediaLoading, setIsMediaLoading] = useState(false)
  const [mediaFolders, setMediaFolders] = useState<{ id: string; label: string }[]>([])
  const [mediaSearch, setMediaSearch] = useState('')

  const { openDelete, modal: deleteModal } = useDeleteModal()
  const { setCurrentLabel } = usePageLabel()

  // Sync page header breadcrumb label
  useEffect(() => {
    if (currentView === 'edit') {
      setCurrentLabel(editingPost ? formData.title || 'Untitled Article' : 'New Article')
    } else if (currentView === 'view') {
      setCurrentLabel(viewPost?.title || '')
    } else {
      setCurrentLabel('')
    }
  }, [currentView, editingPost, formData.title, viewPost, setCurrentLabel])

  // Sync state to sessionStorage
  useEffect(() => {
    if (isBrowser) sessionStorage.setItem('blogs_currentView', currentView)
  }, [currentView, isBrowser])
  useEffect(() => {
    if (isBrowser) {
      if (editingPost) sessionStorage.setItem('blogs_editingPost', JSON.stringify(editingPost))
      else sessionStorage.removeItem('blogs_editingPost')
    }
  }, [editingPost, isBrowser])
  useEffect(() => {
    if (isBrowser) {
      if (viewPost) sessionStorage.setItem('blogs_viewPost', JSON.stringify(viewPost))
      else sessionStorage.removeItem('blogs_viewPost')
    }
  }, [viewPost, isBrowser])
  useEffect(() => {
    if (isBrowser) sessionStorage.setItem('blogs_formData', JSON.stringify(formData))
  }, [formData, isBrowser])

  // Data fetching functions
  // Fetches the list of media library files for the active folder
  const fetchMedia = useCallback(async () => {
    setIsMediaLoading(true)
    try {
      const files = await contentService.getMediaFiles(activeMediaFolder)
      setMediaFiles(files)
    } catch (err) {
      console.error('[MEDIA] Failed to fetch library:', err)
    } finally {
      setIsMediaLoading(false)
    }
  }, [activeMediaFolder])

  // Fetches all editorial blog posts from the database
  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getBlogPosts()
      setPosts(data)
    } catch {
      toast.error('Could not retrieve blog intelligence from vault.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetches all registered personnel/authors
  const fetchAuthors = useCallback(async () => {
    try {
      const data = await adminService.getAuthors()
      setAuthors(data)
    } catch (err) {
      console.error('[SYSTEM] Failed to fetch authors:', err)
    }
  }, [])

  useEffect(() => {
    const initUser = async () => {
      const user = await adminService.initialize()
      setCurrentUser(user)
    }
    if (!currentUser) initUser()
  }, [currentUser])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMedia()
    }, 0)
    return () => clearTimeout(t)
  }, [fetchMedia])
  useEffect(() => {
    const t = setTimeout(() => {
      contentService.getMediaFolders().then(setMediaFolders)
    }, 0)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      fetchAuthors()
      fetchPosts()
    }, 0)
    return () => clearTimeout(t)
  }, [fetchAuthors, fetchPosts])
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Event handlers
  // Sets up the form data for editing a blog post or creating a new one
  const handleEditPost = (post?: BlogPost) => {
    if (post) {
      setEditPost(post)
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        authorId: post.authorId,
        category: post.category,
        imageUrl: post.imageUrl || '',
        readTime: post.readTime,
        isFeatured: post.isFeatured,
        publishedAt: post.publishedAt,
        status: post.status,
        tags: post.tags,
        seoTitle: post.seoTitle ?? '',
        metaDescription: post.metaDescription ?? '',
        authorName: post.authorName ?? '',
        authorRole: post.authorRole ?? '',
        authorImage: post.authorImage ?? '',
        authorBio: post.authorBio ?? '',
      })
    } else {
      setEditPost(null)
      setFormData({ ...EMPTY_FORM, publishedAt: new Date().toISOString() })
    }
    setCurrentView('edit')
  }

  // Routes to the read-only preview screen for a post
  const handleViewPost = (post: BlogPost) => {
    setViewPost(post)
    setCurrentView('view')
  }

  // Handles creating or updating a post in the database
  const handleSubmit = async () => {
    const effectiveFormData =
      currentView === 'edit' && !editingPost ? withAuthorSnapshot(formData, authors[0]) : formData

    if (!effectiveFormData.authorId) {
      toast.error('Author required', {
        description: 'Select an author before saving or publishing.',
      })
      return
    }
    setIsLoading(true)
    try {
      const editorContent = editorRef.current ? editorRef.current.getContent() : formData.content
      const postData = { ...effectiveFormData, content: editorContent }
      let success = false
      if (editingPost) {
        success = await adminService.updateBlogPost(editingPost.id, postData)
      } else {
        if (!postData.slug)
          postData.slug = postData.title
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '')
        success = await adminService.createBlogPost(postData)
      }
      if (success) {
        const label =
          effectiveFormData.status === 'Published'
            ? 'Intelligence authorized & published'
            : effectiveFormData.status === 'Pending Verification'
              ? 'Submitted for strategic verification'
              : 'Intelligence saved as draft'
        toast.success(label, {
          description: `"${effectiveFormData.title}" has been processed successfully.`,
        })
        setCurrentView('list')
        fetchPosts()
      }
    } catch {
      toast.error('Operational Error', {
        description: 'Failed to sync intelligence with the field database.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Moves an editorial post to the trash vault
  const handleDelete = (post: BlogPost) => {
    openDelete({
      itemName: post.title,
      title: 'Move to Trash',
      description:
        'This article will be moved to the trash vault. You can restore it within 30 days before it is permanently purged.',
      isPermanent: false,
      successMessage: `"${post.title}" moved to trash`,
      errorMessage: 'Failed to move post to trash',
      onConfirm: async () => {
        const success = await contentService.deleteBlogPost(post.id)
        if (success) fetchPosts()
        return success
      },
    })
  }

  // Updates a post status to published and optionally triggers push notifications
  const handlePublishPost = async (post: BlogPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, status: 'Published' as const } : p))
    )
    try {
      const success = await adminService.updateBlogPost(post.id, {
        status: 'Published',
        publishedAt: new Date().toISOString(),
      })
      if (success) {
        toast.success('Post published.')
        contentService.sendPushNotification({
          userIds: 'all',
          title: 'New article published',
          body: post.title.slice(0, 100),
          url: `/dashboard/blog/${post.id}`,
        })
      } else {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
        toast.error('Failed to publish post.')
      }
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
      toast.error('Failed to publish post.')
    }
  }

  // Reverts a post status to draft
  const handleUnpublishPost = async (post: BlogPost) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'Draft' as const } : p)))
    try {
      const success = await adminService.updateBlogPost(post.id, { status: 'Draft' })
      if (success) {
        toast.success('Post unpublished.')
      } else {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
        toast.error('Failed to unpublish post.')
      }
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
      toast.error('Failed to unpublish post.')
    }
  }

  // Uploads a new image file to the current media folder
  const handleUpload = async (file: File) => {
    const url = await contentService.uploadImage(file, activeMediaFolder)
    if (url) {
      toast.success(`Uploaded to ${activeMediaFolder}`)
      fetchMedia()
    }
  }

  const openFeaturedImageLibrary = () => {
    setActiveMediaFolder('editor-content')
    setShowMediaPanel(true)
  }

  const filteredPosts = useMemo(() => {
    const list = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
    return list.sort((a, b) => {
      const titleA = a.title || ''
      const titleB = b.title || ''
      return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
    })
  }, [posts, searchQuery, categoryFilter, statusFilter, sortOrder])

  const editorFormData = useMemo(
    () =>
      currentView === 'edit' && !editingPost ? withAuthorSnapshot(formData, authors[0]) : formData,
    [authors, currentView, editingPost, formData]
  )

  // View routing
  if (currentView === 'edit') {
    return (
      <BlogEditorView
        editingPost={editingPost}
        formData={editorFormData}
        setFormData={setFormData}
        authors={authors}
        isLoading={isLoading}
        showMediaPanel={showMediaPanel}
        setShowMediaPanel={setShowMediaPanel}
        showIntelPanel={showIntelPanel}
        setShowIntelPanel={setShowIntelPanel}
        editorRef={editorRef}
        mediaFiles={mediaFiles}
        mediaFolders={mediaFolders}
        activeMediaFolder={activeMediaFolder}
        setActiveMediaFolder={setActiveMediaFolder}
        mediaSearch={mediaSearch}
        setMediaSearch={setMediaSearch}
        isMediaLoading={isMediaLoading}
        onRefreshMedia={fetchMedia}
        onUpload={handleUpload}
        onOpenFeaturedImageLibrary={openFeaturedImageLibrary}
        onBack={() => setCurrentView('list')}
        onSubmit={handleSubmit}
      />
    )
  }

  if (currentView === 'view' && viewPost) {
    return (
      <BlogViewPage
        viewPost={viewPost}
        currentUser={currentUser}
        onBack={() => setCurrentView('list')}
        onEdit={handleEditPost}
        onDelete={handleDelete}
      />
    )
  }

  // List view layout
  return (
    <div className="main">
      <BlogsHeader onWrite={() => handleEditPost()} />
      <BlogsKPIs posts={posts} />

      {/* Mobile search & Sort — shown above the grid on small screens */}
      <div
        className="mobile-only"
        style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            aria-label="Search posts"
            name="mobBlogSearch"
            id="input-mob-blog-search"
            type="text"
            placeholder="Search posts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 36,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--card))',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <SortToggle value={sortOrder} onChange={setSortOrder} />
      </div>

      <div className="sidebar-main">
        <BlogsFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
        <BlogsGrid
          filteredPosts={filteredPosts}
          posts={posts}
          isLoading={isLoading}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          menuAnchor={menuAnchor}
          setMenuAnchor={setMenuAnchor}
          currentUser={currentUser}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onEdit={handleEditPost}
          onView={handleViewPost}
          onPublish={handlePublishPost}
          onUnpublish={handleUnpublishPost}
          onDelete={handleDelete}
          onClearFilters={() => {
            setSearchQuery('')
            setCategoryFilter('all')
            setStatusFilter('all')
          }}
        />
      </div>

      <MobileFilterSheet
        isMobile={isMobile}
        show={showMobileFilter}
        onClose={() => setShowMobileFilter(false)}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      {isMobile &&
        createPortal(
          <button
            onClick={() => setShowMobileFilter(true)}
            style={{
              position: 'fixed',
              bottom: 88,
              left: 16,
              zIndex: 50,
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'hsl(var(--container-low))',
              color: 'hsl(var(--on-surface))',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
              cursor: 'pointer',
            }}
            aria-label="Open filters"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              filter_list
            </span>
          </button>,
          document.body
        )}

      {deleteModal}
    </div>
  )
}
