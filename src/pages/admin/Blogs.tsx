import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Editor } from '@tinymce/tinymce-react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { BlogPost, AdminUser, Author } from '@/types/admin'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  'Movement': 'https://images.unsplash.com/photo-1540910419842-dfb322c98b3c?q=80&w=1200&auto=format&fit=crop',
  'Youth': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
  'Economy': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  'Diaspora': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=1200&auto=format&fit=crop',
  'Integrity': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
  'Community': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
  'Impact': 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1200&auto=format&fit=crop'
}
const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop'
const CATEGORIES = ['Movement', 'Youth', 'Economy', 'Diaspora', 'Integrity', 'Community']

const selectSt: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none', cursor: 'pointer',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700, fontSize: 12, borderRadius: 4,
  color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10,
  color: 'hsl(var(--on-surface-muted))', display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
}

const metaSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
}

function statusPill(status: string) {
  if (status === 'Published') return <span className="pill pill-ok">{status}</span>
  if (status === 'Pending Verification') return <span className="pill pill-warn">Pending</span>
  return <span className="pill pill-mute">{status}</span>
}

export default function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  const editorRef = useRef<{ getContent: () => string } | null>(null)

  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'view'>(() =>
    (sessionStorage.getItem('blogs_currentView') as 'list' | 'edit' | 'view') || 'list'
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [editingPost, setEditPost] = useState<BlogPost | null>(() => {
    const saved = sessionStorage.getItem('blogs_editingPost')
    return saved ? JSON.parse(saved) : null
  })
  const [viewPost, setViewPost] = useState<BlogPost | null>(() => {
    const saved = sessionStorage.getItem('blogs_viewPost')
    return saved ? JSON.parse(saved) : null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showMediaPanel, setShowMediaPanel] = useState(true)
  const [mediaSearch, setMediaSearch] = useState('')
  const [showIntelPanel, setShowIntelPanel] = useState(true)

  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>(() => {
    const saved = sessionStorage.getItem('blogs_formData')
    if (saved) return JSON.parse(saved)
    return {
      title: '', slug: '', excerpt: '', content: '',
      authorId: 'USR-001', category: 'Movement', imageUrl: '',
      readTime: '5 min read', isFeatured: false,
      publishedAt: new Date().toISOString(), status: 'Draft',
      tags: [], seoTitle: '', metaDescription: '',
      authorName: '', authorRole: '', authorImage: '', authorBio: ''
    }
  })

  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [activeMediaFolder, setActiveMediaFolder] = useState('blog-images')
  const [isMediaLoading, setIsMediaLoading] = useState(false)

  const mediaFolders = [
    { id: 'blog-images', label: 'Blog Posts' },
    { id: 'editor-content', label: 'Editor Media' },
    { id: 'branding', label: 'Branding Assets' },
    { id: 'author-images', label: 'Authors' },
    { id: 'product-images', label: 'Product Images' },
    { id: 'logos-favicons', label: 'Logos & Favicons' },
    { id: 'public-assets', label: 'Public Assets' },
  ]

  useEffect(() => {
    const initUser = async () => {
      const user = await adminService.initialize()
      setCurrentUser(user)
    }
    if (!currentUser) initUser()
  }, [currentUser])

  useEffect(() => { sessionStorage.setItem('blogs_currentView', currentView) }, [currentView])
  useEffect(() => {
    if (editingPost) sessionStorage.setItem('blogs_editingPost', JSON.stringify(editingPost))
    else sessionStorage.removeItem('blogs_editingPost')
  }, [editingPost])
  useEffect(() => {
    if (viewPost) sessionStorage.setItem('blogs_viewPost', JSON.stringify(viewPost))
    else sessionStorage.removeItem('blogs_viewPost')
  }, [viewPost])
  useEffect(() => { sessionStorage.setItem('blogs_formData', JSON.stringify(formData)) }, [formData])

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

  useEffect(() => { fetchMedia() }, [fetchMedia])
  useEffect(() => { fetchAuthors(); fetchPosts() }, [fetchAuthors, fetchPosts])

  const handleEditPost = (post?: BlogPost) => {
    if (post) {
      setEditPost(post)
      setFormData({
        title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
        authorId: post.authorId, category: post.category, imageUrl: post.imageUrl || '',
        readTime: post.readTime, isFeatured: post.isFeatured, publishedAt: post.publishedAt,
        status: post.status, tags: post.tags,
        seoTitle: post.seoTitle ?? '', metaDescription: post.metaDescription ?? '',
        authorName: post.authorName ?? '', authorRole: post.authorRole ?? '',
        authorImage: post.authorImage ?? '', authorBio: post.authorBio ?? ''
      })
    } else {
      setEditPost(null)
      setFormData({
        title: '', slug: '', excerpt: '', content: '',
        authorId: 'USR-001', category: 'Movement', imageUrl: '',
        readTime: '5 min read', isFeatured: false,
        publishedAt: new Date().toISOString(), status: 'Draft',
        tags: [], seoTitle: '', metaDescription: '',
        authorName: '', authorRole: '', authorImage: '', authorBio: ''
      })
    }
    setCurrentView('edit')
  }

  const handleViewPost = (post: BlogPost) => {
    setViewPost(post)
    setCurrentView('view')
  }

  const handleSubmit = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    try {
      const editorContent = editorRef.current ? editorRef.current.getContent() : formData.content
      const postData = { ...formData, content: editorContent }
      let success = false
      if (editingPost) {
        success = await adminService.updateBlogPost(editingPost.id, postData)
      } else {
        if (!postData.slug) postData.slug = postData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
        success = await adminService.createBlogPost(postData)
      }
      if (success) {
        const label = formData.status === 'Published' ? 'Intelligence Authorized & Published'
          : formData.status === 'Pending Verification' ? 'Submitted for Strategic Verification'
          : 'Intelligence Saved as Draft'
        toast.success(label, { description: `"${formData.title}" has been processed successfully.` })
        setCurrentView('list')
        fetchPosts()
      }
    } catch {
      toast.error('Operational Error', { description: 'Failed to sync intelligence with the field database.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (post: BlogPost) => { setPostToDelete(post) }

  const handleConfirmedDelete = async () => {
    if (!postToDelete) return
    setIsDeleting(true)
    try {
      const success = await contentService.deleteBlogPost(postToDelete.id)
      if (success) {
        toast.success(`"${postToDelete.title}" moved to trash`)
        setPostToDelete(null)
        fetchPosts()
      } else {
        toast.error('Failed to move post to trash')
      }
    } catch {
      toast.error('An error occurred during deletion')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // ── EDIT VIEW ────────────────────────────────────────────────────────────
  if (currentView === 'edit') {
    const seoChecks = [
      { ok: (formData.title?.length || 0) > 10 && (formData.title?.length || 0) <= 64, label: `Title ${formData.title?.length || 0}ch · ${(formData.title?.length || 0) <= 64 ? 'within limit' : 'too long'}` },
      { ok: !!(formData.metaDescription && formData.metaDescription.length > 50), label: `Meta description ${formData.metaDescription ? `set · ${formData.metaDescription.length}ch` : 'missing'}` },
      { ok: !!(formData.imageUrl), label: formData.imageUrl ? 'Featured image set' : 'No featured image' },
      { ok: formData.tags.length > 0, label: formData.tags.length > 0 ? `${formData.tags.length} tag${formData.tags.length > 1 ? 's' : ''} added` : 'No tags set' },
      { ok: !!(formData.excerpt && formData.excerpt.length > 80), label: `Excerpt ${formData.excerpt?.length || 0}ch · ${(formData.excerpt?.length || 0) > 80 ? 'good length' : 'too short'}` },
    ]
    const seoScore = Math.round((seoChecks.filter(c => c.ok).length / seoChecks.length) * 100)
    return (
      <div className="main animate-in fade-in duration-500 !p-0 !max-w-none flex flex-col" style={{ height: 'calc(100vh - 4rem)', overflow: 'hidden', background: 'hsl(var(--background))' }}>
        {/* Top bar */}
        <div className="top !mb-0 px-6 py-3 border-b border-border/40 bg-white shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <button onClick={() => setCurrentView('list')} className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))', background: 'none', border: 'none', cursor: 'pointer' }}>arrow_back</button>
            <div>
              <div className="crumbs" style={{ marginBottom: 2 }}>
                <button onClick={() => setCurrentView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 700, fontSize: 10, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editorial</button>
                {' · '}{editingPost ? 'Refining intelligence' : 'Drafting dispatch'}
              </div>
              <h2 className="!text-sm !font-black !m-0" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {formData.title || 'Untitled Dispatch'}
                <span className="pill" style={{
                  background: formData.status === 'Published' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                  color: formData.status === 'Published' ? '#fff' : 'hsl(var(--on-surface))',
                  fontSize: 10
                }}>{formData.status}</span>
              </h2>
            </div>
          </div>
          <div className="actions !gap-2">
            <button
              className={showMediaPanel ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => setShowMediaPanel(v => !v)}
              title="Toggle media library"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>photo_library</span>
              <span className="desktop-only">Media</span>
            </button>
            <button
              className={showIntelPanel ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => setShowIntelPanel(v => !v)}
              title="Toggle post intelligence"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>tune</span>
              <span className="desktop-only">Intel</span>
            </button>
            <button className="btn btn-primary btn-sm" disabled={isLoading} onClick={handleSubmit}>
              {isLoading ? 'Saving…' : formData.status === 'Published' ? 'Authorize' : 'Save draft'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Left: media library */}
          {showMediaPanel && (
            <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: '#fff' }}>
              {/* Header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>photo_library</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(var(--on-surface-muted))' }}>Library</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', background: 'hsl(var(--border))', padding: '1px 5px', borderRadius: 10 }}>{mediaFiles.length}</span>
                  <button onClick={() => fetchMedia()} title="Refresh library" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'hsl(var(--on-surface-muted))' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
                  </button>
                </div>
              </div>

              {/* Folder Selector */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
                <select 
                  value={activeMediaFolder}
                  onChange={e => setActiveMediaFolder(e.target.value)}
                  style={{ ...selectSt, height: 32, fontSize: 11, background: 'hsl(var(--background))' }}
                >
                  {mediaFolders.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Search + upload */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 6 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                  <input
                    placeholder="Search…"
                    value={mediaSearch}
                    onChange={e => setMediaSearch(e.target.value)}
                    style={{ width: '100%', height: 32, paddingLeft: 28, paddingRight: 8, border: '1px solid hsl(var(--border))', borderRadius: 4, background: 'hsl(var(--background))', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }}
                  />
                </div>
                <label title={`Upload to ${activeMediaFolder}`} style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = await contentService.uploadImage(file, activeMediaFolder)
                    if (url) { toast.success(`Uploaded to ${activeMediaFolder}`); fetchMedia() }
                    e.target.value = ''
                  }} />
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>upload</span>
                </label>
              </div>

              {/* Image grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, alignContent: 'start', position: 'relative' }}>
                {isMediaLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {mediaFiles
                  .filter(url => !mediaSearch || url.toLowerCase().includes(mediaSearch.toLowerCase()))
                  .map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', border: `2px solid ${formData.imageUrl === url ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => { const actions = e.currentTarget.querySelector('.img-actions') as HTMLElement | null; if (actions) actions.style.opacity = '1' }}
                      onMouseLeave={e => { const actions = e.currentTarget.querySelector('.img-actions') as HTMLElement | null; if (actions) actions.style.opacity = '0' }}>
                      <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                      <div className="img-actions" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0, transition: 'opacity 0.15s' }}>
                        <button
                          title="Set as cover image"
                          onClick={() => setFormData({ ...formData, imageUrl: url })}
                          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 3, color: '#fff', cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, width: '80%', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>image</span>
                          Cover
                        </button>
                        <button
                          title="Insert into article"
                          onClick={() => {
                            const editor = editorRef.current as unknown as { insertContent: (html: string) => void } | null
                            editor?.insertContent(`<img src="${url}" alt="" style="max-width:100%;height:auto;" />`)
                          }}
                          style={{ background: 'hsl(var(--primary))', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, width: '80%', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>add_photo_alternate</span>
                          Insert
                        </button>
                      </div>
                    </div>
                  ))}
                {mediaFiles.filter(url => !mediaSearch || url.toLowerCase().includes(mediaSearch.toLowerCase())).length === 0 && (
                  <div style={{ gridColumn: '1/-1', padding: '24px 0', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))', opacity: 0.25, display: 'block', marginBottom: 8 }}>photo_library</span>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                      {mediaSearch ? 'No matches' : 'No assets in this folder'}
                    </span>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Center: article canvas */}
          <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--container-low))', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <div>
                <div className="panel !p-0 overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
                  <div style={{ background: '#fff', padding: '32px 48px', minHeight: 900 }}>
                    {/* Author + category row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid hsl(var(--border))', paddingBottom: 20, marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, overflow: 'hidden', flexShrink: 0 }}>
                          {formData.authorImage ? <img src={formData.authorImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (formData.authorName?.[0] || 'A')}
                        </div>
                        <div>
                          <select
                            value={formData.authorId || authors[0]?.id}
                            onChange={e => {
                              const author = authors.find(a => a.id === e.target.value)
                              if (author) setFormData({ ...formData, authorId: author.id, authorName: author.name, authorRole: author.role || '', authorImage: author.imageUrl || '', authorBio: author.bio || '' })
                            }}
                            style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{formData.authorRole || 'Contributor'}</div>
                        </div>
                      </div>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        style={{ height: 34, padding: '0 10px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', outline: 'none', cursor: 'pointer', color: 'hsl(var(--on-surface))' }}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Title + excerpt */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                      <textarea
                        placeholder="Article Title…"
                        style={{ width: '100%', fontSize: 36, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, outline: 'none', border: 'none', background: 'transparent', resize: 'none', minHeight: 80, color: 'hsl(var(--on-surface))' }}
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') })}
                      />
                      <textarea
                        placeholder="Compelling opening hook or summary…"
                        style={{ width: '100%', fontSize: 17, fontFamily: "'Public Sans', sans-serif", fontWeight: 500, lineHeight: 1.65, outline: 'none', border: 'none', background: 'transparent', resize: 'none', minHeight: 70, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}
                        value={formData.excerpt}
                        onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                      />
                    </div>

                    {formData.imageUrl && (
                      <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', aspectRatio: '16/9', border: '1px solid hsl(var(--border))', marginBottom: 20 }}
                        onMouseEnter={e => { const btn = e.currentTarget.querySelector('button') as HTMLElement | null; if (btn) btn.style.opacity = '1' }}
                        onMouseLeave={e => { const btn = e.currentTarget.querySelector('button') as HTMLElement | null; if (btn) btn.style.opacity = '0' }}>
                        <img src={formData.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <button
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    )}

                    <div style={{ minHeight: 500 }}>
                      <Editor
                        key={editingPost?.id ?? 'new'}
                        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                        onInit={(_, editor) => (editorRef.current = editor)}
                        initialValue={formData.content ?? ''}
                        init={{
                          height: 600, menubar: false,
                          plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'searchreplace', 'visualblocks', 'insertdatetime', 'table', 'wordcount'],
                          toolbar: 'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link image | removeformat',
                          statusbar: false,
                          content_style: 'body { font-family: "Inter", sans-serif; font-size:16px; color:#1f2520; line-height:1.7; background:white; }',
                          branding: false,
                          images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
                            const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type })
                            const url = await contentService.uploadImage(file, 'editor-content')
                            if (!url) throw new Error('Upload failed')
                            return url
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right: post intelligence */}
          {showIntelPanel && <aside style={{ width: 280, flexShrink: 0, borderLeft: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: '#fff', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(var(--on-surface-muted))' }}>Post Intelligence</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* SEO */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(var(--on-surface-muted))' }}>SEO Quality</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: 'hsl(var(--primary))' }}>{seoScore}%</span>
                </div>
                <div style={{ height: 4, background: 'hsl(var(--container-low))', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', background: 'hsl(var(--primary))', width: `${seoScore}%`, transition: 'width 0.7s' }} />
                </div>
                {seoChecks.map((chk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: chk.ok ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))', opacity: chk.ok ? 1 : 0.3 }} />
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: chk.ok ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))', opacity: chk.ok ? 1 : 0.5 }}>{chk.label}</span>
                  </div>
                ))}
              </div>

              {/* Slug */}
              <div>
                <label style={labelSt}>Resource Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 10px', height: 36 }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>/blog/</span>
                  <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface))', flex: 1 }} />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={labelSt}>Tactical Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {formData.tags.map(tag => (
                    <span key={tag} className="pill pill-mute" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {tag}
                      <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, color: 'hsl(var(--on-surface-muted))' }}>×</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Type and press Enter…"
                  style={{ width: '100%', height: 32, padding: '0 10px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim()
                      if (val && !formData.tags.includes(val)) {
                        setFormData({ ...formData, tags: [...formData.tags, val] })
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              {/* Meta description */}
              <div>
                <label style={labelSt}>Strategic Summary</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                  style={{ width: '100%', minHeight: 90, padding: 10, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, lineHeight: 1.6, outline: 'none', resize: 'none', boxSizing: 'border-box', color: 'hsl(var(--on-surface))' }}
                  placeholder="Search engine summary…"
                />
              </div>
            </div>
          </aside>}
        </div>
      </div>
    )
  }

  // ── VIEW PAGE ────────────────────────────────────────────────────────────
  if (currentView === 'view' && viewPost) {
    const metaRowSt: React.CSSProperties = {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))', marginBottom: 0,
    }
    const metaLabelSt: React.CSSProperties = { ...metaSt, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }
    const metaValueSt: React.CSSProperties = { fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }

    return (
      <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
          <div>
            <div className="crumbs">
              <button onClick={() => setCurrentView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 700, fontSize: 10, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editorial</button>
              {' · '} Intelligence Review
            </div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, maxWidth: 600, lineHeight: 1.2 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>visibility</span>
              {viewPost.title}
            </h2>
          </div>
          <div className="actions">
            <button className="btn btn-outline btn-sm" onClick={() => setCurrentView('list')}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => handleEditPost(viewPost)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              Modify dispatch
            </button>
          </div>
        </div>

        <div className="main-sidebar" style={{ alignItems: 'start' }}>

          {/* Article content */}
          <div className="panel" style={{ overflow: 'hidden' }}>
            {viewPost.imageUrl && (
              <div style={{ height: 300, overflow: 'hidden' }}>
                <img src={viewPost.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ padding: '32px 40px' }}>
              {/* Category + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <span className="pill pill-ok" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>{viewPost.category}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...metaSt }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
                  {new Date(viewPost.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...metaSt }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                  {viewPost.readTime}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 30, color: 'hsl(var(--on-surface))', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 18px' }}>
                {viewPost.title}
              </h1>

              {/* Excerpt */}
              {viewPost.excerpt && (
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 15, color: 'hsl(var(--on-surface))', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '4px solid hsl(var(--primary))', paddingLeft: 20, marginBottom: 28, opacity: 0.65 }}>
                  {viewPost.excerpt}
                </div>
              )}

              {/* Author strip */}
              {viewPost.authorName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))', marginBottom: 28 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 4, background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {viewPost.authorImage
                      ? <img src={viewPost.authorImage} alt={viewPost.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff' }}>{viewPost.authorName[0]}</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{viewPost.authorName}</div>
                    <div style={metaSt}>{viewPost.authorRole || 'Contributor'}</div>
                  </div>
                </div>
              )}

              {/* Body content */}
              <div
                className="prose prose-on-surface max-w-none prose-p:text-on-surface/70 prose-p:leading-relaxed prose-p:text-[16px] prose-headings:text-on-surface prose-headings:font-black prose-headings:tracking-tight"
                dangerouslySetInnerHTML={{ __html: viewPost.content }}
              />

              {/* Tags */}
              {viewPost.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 28, paddingTop: 20, borderTop: '1px solid hsl(var(--border))' }}>
                  {viewPost.tags.map(tag => (
                    <span key={tag} className="pill pill-mute" style={{ fontSize: 11 }}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>

            {/* Post intelligence */}
            <div className="panel">
              <div className="ph">
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>article</span>
                  Post Intelligence
                </span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={metaRowSt}>
                  <span style={metaLabelSt}>Status</span>
                  {statusPill(viewPost.status)}
                </div>
                <div style={metaRowSt}>
                  <span style={metaLabelSt}>Category</span>
                  <span style={metaValueSt}>{viewPost.category}</span>
                </div>
                <div style={metaRowSt}>
                  <span style={metaLabelSt}>Read time</span>
                  <span style={metaValueSt}>{viewPost.readTime}</span>
                </div>
                <div style={metaRowSt}>
                  <span style={metaLabelSt}>Published</span>
                  <span style={metaValueSt}>{new Date(viewPost.publishedAt).toLocaleDateString()}</span>
                </div>
                {viewPost.isFeatured && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span className="pill pill-ok" style={{ fontSize: 10, fontWeight: 800 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, marginRight: 3 }}>star</span>
                      Featured
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SEO */}
            {(viewPost.metaDescription || viewPost.seoTitle) && (
              <div className="panel">
                <div className="ph">
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>search</span>
                    SEO Data
                  </span>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {viewPost.seoTitle && (
                    <div>
                      <div style={metaLabelSt}>SEO Title</div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.5 }}>{viewPost.seoTitle}</div>
                    </div>
                  )}
                  {viewPost.metaDescription && (
                    <div>
                      <div style={metaLabelSt}>Meta Description</div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6 }}>{viewPost.metaDescription}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => handleEditPost(viewPost)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                Edit Post
              </button>
              <button className="btn btn-dest btn-sm" style={{ justifyContent: 'center' }} onClick={() => { setCurrentView('list'); handleDelete(viewPost) }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="main animate-in fade-in duration-500">
      <div className="top">
        <div>
          <div className="crumbs">
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '} Blog intelligence
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>article</span>
            Editorial command
          </h2>
          <div className="bl"><div /><div /><div /></div>
        </div>
        <div className="actions">
          <button className="btn btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => handleEditPost()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Dispatch new article
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI label="Total articles" value={posts.length} description="Across all categories" />
        <TacticalKPI label="Authorized" value={posts.filter(p => p.status === 'Published').length} description="Live in public feed" trend={{ direction: 'up', value: 'Live' }} variant="green" />
        <TacticalKPI label="Pending review" value={posts.filter(p => p.status === 'Pending Verification').length} description="Awaiting editorial clearance" trend={{ direction: 'neutral', value: 'Pending' }} variant="gold" />
        <TacticalKPI label="Drafts" value={posts.filter(p => p.status === 'Draft').length} description="Work in progress" />
      </div>

      <div className="sidebar-main">
        {/* Sidebar */}
        <aside className="panel h-fit sticky top-20">
          <div className="ph">
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>filter_list</span>
              Intelligence filters
            </span>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelSt}>Search feed</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                <input
                  type="text" placeholder="Keywords…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...selectSt, paddingLeft: 34 }}
                />
              </div>
            </div>
            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
              <label style={labelSt}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectSt}>
                <option value="all">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Pending Verification">Pending</option>
                <option value="Draft">Drafts</option>
              </select>
            </div>
            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
              <label style={labelSt}>Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectSt}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* Articles grid */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="panel" style={{ height: 320 }}>
                  <div style={{ height: 160, background: 'hsl(var(--container-low))' }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 13, background: 'hsl(var(--container-low))', borderRadius: 3, width: '80%' }} />
                    <div style={{ height: 10, background: 'hsl(var(--container-low))', borderRadius: 3, width: '60%' }} />
                  </div>
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="panel" style={{ gridColumn: '1/-1', padding: '60px 20px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.25, display: 'block', marginBottom: 12 }}>article</span>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>No posts found</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>Try refining your search or dispatch a new article.</div>
                <button className="btn btn-outline btn-sm" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all') }}>Clear filters</button>
              </div>
            ) : filteredPosts.map(post => (
              <div key={post.id} className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: 'hsl(var(--container-low))', flexShrink: 0 }}>
                  <img
                    src={post.imageUrl || CATEGORY_PLACEHOLDERS[post.category] || DEFAULT_PLACEHOLDER}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span className="pill" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', color: 'hsl(var(--on-surface))', fontWeight: 800 }}>{post.category}</span>
                  </div>
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    {statusPill(post.status)}
                  </div>
                </div>

                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', lineHeight: 1.35, margin: 0, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                      {post.title}
                    </h3>
                    {/* Dropdown */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--on-surface-muted))' }}
                        onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === post.id ? null : post.id) }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>more_vert</span>
                      </button>
                      {openMenuId === post.id && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenMenuId(null)} />
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50, background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6, minWidth: 168, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            {([
                              { icon: 'edit', label: 'Edit post', action: () => handleEditPost(post), dest: false },
                              { icon: 'visibility', label: 'View post', action: () => handleViewPost(post), dest: false },
                              null,
                              { icon: 'delete', label: 'Delete post', action: () => handleDelete(post), dest: true },
                            ] as ({ icon: string; label: string; action: () => void; dest: boolean } | null)[]).map((item, idx) =>
                              item === null ? (
                                <div key={idx} style={{ height: 1, background: 'hsl(var(--border))' }} />
                              ) : (
                                <button key={idx}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: item.dest ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                  onClick={() => { setOpenMenuId(null); item.action() }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{item.icon}</span>
                                  {item.label}
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, margin: '0 0 14px', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                    {post.excerpt}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...metaSt, fontSize: 10.5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...metaSt, fontSize: 10.5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmedDelete}
        title="Move to Trash"
        description="This article will be moved to the trash vault. You can restore it within 30 days before it is permanently purged."
        itemName={postToDelete?.title || ''}
        isLoading={isDeleting}
        isPermanent={false}
      />
    </div>
  )
}
