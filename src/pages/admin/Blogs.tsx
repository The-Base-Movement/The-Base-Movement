import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { BlogPost, AdminUser, Author } from '@/types/admin'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { toast } from 'sonner'

// Sub-components
import { BlogList } from './blogs/BlogList'
import { BlogEditor } from './blogs/BlogEditor'
import { BlogViewer } from './blogs/BlogViewer'

export default function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(adminService.getCurrentUser())

  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'view'>(
    () => (sessionStorage.getItem('blogs_currentView') as 'list' | 'edit' | 'view') || 'list'
  )
  const { openDelete, modal: deleteModal } = useDeleteModal()

  const [editingPost, setEditPost] = useState<BlogPost | null>(() => {
    const saved = sessionStorage.getItem('blogs_editingPost')
    return saved ? JSON.parse(saved) : null
  })

  const [viewPost, setViewPost] = useState<BlogPost | null>(() => {
    const saved = sessionStorage.getItem('blogs_viewPost')
    return saved ? JSON.parse(saved) : null
  })

  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>(() => {
    const saved = sessionStorage.getItem('blogs_formData')
    if (saved) return JSON.parse(saved)
    return {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      authorId: 'USR-001',
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
  })

  useEffect(() => {
    const initUser = async () => {
      const user = await adminService.initialize()
      setCurrentUser(user)
    }
    if (!currentUser) initUser()
  }, [currentUser])

  useEffect(() => {
    sessionStorage.setItem('blogs_currentView', currentView)
  }, [currentView])

  useEffect(() => {
    if (editingPost) sessionStorage.setItem('blogs_editingPost', JSON.stringify(editingPost))
    else sessionStorage.removeItem('blogs_editingPost')
  }, [editingPost])

  useEffect(() => {
    if (viewPost) sessionStorage.setItem('blogs_viewPost', JSON.stringify(viewPost))
    else sessionStorage.removeItem('blogs_viewPost')
  }, [viewPost])

  useEffect(() => {
    sessionStorage.setItem('blogs_formData', JSON.stringify(formData))
  }, [formData])

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getBlogPosts()
      setPosts(data)
    } catch (error) {
      console.error('[SYSTEM] Failed to fetch posts:', error)
      toast.error('Could not retrieve blog intelligence from vault.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAuthors = useCallback(async () => {
    try {
      const data = await adminService.getAuthors()
      setAuthors(data)
    } catch (err) {
      console.error('[SYSTEM] Failed to fetch authors:', err)
    }
  }, [])

  useEffect(() => {
    fetchAuthors()
    fetchPosts()
  }, [fetchAuthors, fetchPosts])

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
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        authorId: 'USR-001',
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
      })
    }
    setCurrentView('edit')
  }

  const handleViewPost = (post: BlogPost) => {
    setViewPost(post)
    setCurrentView('view')
  }

  const handleSubmit = async (editorContent: string) => {
    setIsLoading(true)
    try {
      const postData = { ...formData, content: editorContent }
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
          formData.status === 'Published'
            ? 'Intelligence authorized & published'
            : formData.status === 'Pending Verification'
              ? 'Submitted for strategic verification'
              : 'Intelligence saved as draft'
        toast.success(label, {
          description: `"${formData.title}" has been processed successfully.`,
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
        fetchPosts()
      } else {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
        toast.error('Failed to publish post.')
      }
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
      toast.error('Failed to publish post.')
    }
  }

  const handleUnpublishPost = async (post: BlogPost) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'Draft' as const } : p)))
    try {
      const success = await adminService.updateBlogPost(post.id, { status: 'Draft' })
      if (success) {
        toast.success('Post unpublished.')
        fetchPosts()
      } else {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
        toast.error('Failed to unpublish post.')
      }
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)))
      toast.error('Failed to unpublish post.')
    }
  }

  return (
    <>
      {currentView === 'list' && (
        <BlogList
          posts={posts}
          isLoading={isLoading}
          currentUser={currentUser}
          onWritePost={() => handleEditPost()}
          onEditPost={(post) => handleEditPost(post)}
          onViewPost={handleViewPost}
          onPublishPost={handlePublishPost}
          onUnpublishPost={handleUnpublishPost}
          onDeletePost={handleDelete}
        />
      )}

      {currentView === 'edit' && (
        <BlogEditor
          editingPost={editingPost}
          formData={formData}
          setFormData={setFormData}
          authors={authors}
          onBack={() => setCurrentView('list')}
          onSave={handleSubmit}
          isLoading={isLoading}
        />
      )}

      {currentView === 'view' && viewPost && (
        <BlogViewer
          viewPost={viewPost}
          onBack={() => setCurrentView('list')}
          onEdit={(post) => handleEditPost(post)}
          onDelete={(post) => {
            setCurrentView('list')
            handleDelete(post)
          }}
        />
      )}

      {deleteModal}
    </>
  )
}
