import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Star,
  Calendar,
  Clock,
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
} from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Editor } from '@tinymce/tinymce-react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { BlogPost, AdminUser, Author } from '@/types/admin'
import { BrandLine } from '@/components/ui/BrandLine'
import { useToast } from '@/hooks/use-toast'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { toast as sonnerToast } from 'sonner'
import { cn } from '@/lib/utils'

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

export default function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  
  const canPublish = currentUser?.role === 'SUPER_ADMIN' ||
                    currentUser?.role === 'CHIEF_EDITOR' ||
                    currentUser?.role === 'SENIOR_EDITOR'

  const editorRef = useRef<{ getContent: () => string } | null>(null)

  // Persist view state
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'view'>(() => {
    return (sessionStorage.getItem('blogs_currentView') as 'list' | 'edit' | 'view') || 'list'
  })
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
  const { toast } = useToast()

  // Persist form state so drafts aren't lost on reload
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>(() => {
    const saved = sessionStorage.getItem('blogs_formData')
    if (saved) return JSON.parse(saved)
    return {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      authorId: 'USR-001',
      category: '',
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
      authorBio: ''
    }
  })

  // Initialize current user
  useEffect(() => {
    const initUser = async () => {
      const user = await adminService.initialize()
      setCurrentUser(user)
    }
    if (!currentUser) initUser()
  }, [currentUser])

  // Sync state to sessionStorage
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

  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const fetchMedia = useCallback(async () => {
    try {
      const files = await contentService.getMediaFiles('blog-images')
      setMediaFiles(files)
    } catch (err) {
      console.error('[MEDIA] Failed to fetch library:', err)
    }
  }, [])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getBlogPosts()
      setPosts(data)
    } catch (error) {
      console.error('[SYSTEM] Failed to fetch posts:', error)
      toast({
        title: "FETCH ERROR",
        description: "Could not retrieve blog intelligence from vault.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

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
  }, [fetchAuthors])



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
        authorBio: post.authorBio ?? ''
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
        authorBio: ''
      })
    }
    setCurrentView('edit')
  }

  const handleViewPost = (post: BlogPost) => {
    setViewPost(post)
    setCurrentView('view')
  }

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Deep Link Handling for Global Search
  useEffect(() => {
    if (posts.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const editId = params.get('edit')
      if (editId) {
        const post = posts.find(p => p.id === editId)
        if (post) {
          // Defer to avoid synchronous setState warning in effect
          setTimeout(() => {
            handleEditPost(post)
            // Clean up URL to avoid re-opening on reload
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [posts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const editorContent = editorRef.current ? editorRef.current.getContent() : formData.content
      const postData = { ...formData, content: editorContent }

      let success = false
      if (editingPost) {
        success = await adminService.updateBlogPost(editingPost.id, postData)
      } else {
        if (!postData.slug) {
          postData.slug = postData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
        }
        success = await adminService.createBlogPost(postData)
      }

      if (success) {
        const actionLabel = formData.status === 'Published' 
          ? "Intelligence Authorized & Published" 
          : formData.status === 'Pending Verification'
          ? "Submitted for Strategic Verification"
          : "Intelligence Saved as Draft"
          
        sonnerToast.success(actionLabel, {
          description: `"${formData.title}" has been processed successfully.`,
        })
        setCurrentView('list')
        fetchPosts()
      }
    } catch {
      sonnerToast.error("Operational Error", {
        description: "Failed to sync intelligence with the field database."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (post: BlogPost) => {
    setPostToDelete(post)
  }

  const handleConfirmedDelete = async () => {
    if (!postToDelete) return

    setIsDeleting(true)
    try {
      const success = await contentService.deleteBlogPost(postToDelete.id)
      if (success) {
        sonnerToast.success(`"${postToDelete.title}" moved to trash`)
        setPostToDelete(null)
        fetchPosts()
        
        // Log action
        adminService.logAction('TRASH_BLOG', `BLOG/${postToDelete.title}`, 'Success')
      } else {
        sonnerToast.error("Failed to move post to trash")
      }
    } catch {
      sonnerToast.error("An error occurred during deletion")
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

  if (currentView === 'edit') {
    // SEO score calculation
    const seoChecks = [
      { ok: (formData.title?.length || 0) > 10 && (formData.title?.length || 0) <= 64, label: `Title ${formData.title?.length || 0}ch · ${(formData.title?.length || 0) <= 64 ? 'within limit' : 'too long'}` },
      { ok: !!(formData.metaDescription && formData.metaDescription.length > 50), label: `Meta description ${formData.metaDescription ? `set · ${formData.metaDescription.length}ch` : 'missing'}` },
      { ok: !!(formData.imageUrl), label: formData.imageUrl ? 'Featured image set' : 'No featured image' },
      { ok: formData.tags.length > 0, label: formData.tags.length > 0 ? `${formData.tags.length} tag${formData.tags.length > 1 ? 's' : ''} added` : 'No tags set' },
      { ok: !!(formData.excerpt && formData.excerpt.length > 80), label: `Excerpt ${formData.excerpt?.length || 0}ch · ${(formData.excerpt?.length || 0) > 80 ? 'good length' : 'too short'}` },
    ]
    const seoScore = Math.round((seoChecks.filter(c => c.ok).length / seoChecks.length) * 100)

    const MEDIA_IMAGES = [
      CATEGORY_PLACEHOLDERS['Movement'], CATEGORY_PLACEHOLDERS['Youth'],
      CATEGORY_PLACEHOLDERS['Economy'], CATEGORY_PLACEHOLDERS['Diaspora'],
      CATEGORY_PLACEHOLDERS['Integrity'], CATEGORY_PLACEHOLDERS['Community'],
      CATEGORY_PLACEHOLDERS['Impact'], DEFAULT_PLACEHOLDER,
    ]

    return (
      <div className="-mx-[28px] -mt-[24px] -mb-[60px] bg-[#f6fbf4] flex flex-col animate-in fade-in duration-500" style={{ height: 'calc(100vh - 3.5rem)', overflow: 'hidden' }}>

        {/* ── Top action bar ── */}
        <div className="bg-white border-b border-border/40 px-6 py-[10px] flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={() => setCurrentView('list')} className="text-[10.5px] font-extrabold text-muted-foreground/60 hover:text-on-surface uppercase tracking-[.06em]">
              Blog posts
            </button>
            <span className="text-muted-foreground/30 text-sm">/</span>
            <span className="text-[10.5px] font-extrabold text-on-surface uppercase tracking-[.06em]">
              {editingPost ? 'Edit post' : 'New post'}
            </span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[10px] tracking-[.06em] uppercase px-2 py-0.5 rounded-full border ml-2"
              style={{ color: formData.status === 'Published' ? 'hsl(var(--primary))' : 'hsl(var(--accent))', background: formData.status === 'Published' ? 'rgba(0,107,63,.08)' : 'rgba(218,165,32,.12)', borderColor: formData.status === 'Published' ? 'rgba(0,107,63,.3)' : 'rgba(218,165,32,.3)' }}>
              <span className="w-[5px] h-[5px] rounded-full bg-current block" />
              {formData.status}
            </span>
            <span className="text-[11px] text-muted-foreground/50 font-bold ml-1">· Auto-saved</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 px-3 text-[11px] font-bold rounded-sm gap-1.5 border-border/40">
              <Eye className="w-3 h-3" /> Preview
            </Button>
            {!canPublish && (
              <Button variant="outline" size="sm" className="h-8 px-4 text-[11px] font-bold rounded-sm border-border/40"
                onClick={() => setFormData({...formData, status: 'Pending Verification'})}
              >
                Request review
              </Button>
            )}
            <Button variant="primary" size="sm" className="h-8 px-4 text-[11px] font-bold rounded-sm shadow-sm"
              disabled={isLoading}
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            >
              {isLoading ? 'Saving…' : formData.status === 'Published' ? 'Publish' : 'Save draft'}
            </Button>
          </div>
        </div>

        {/* ── 3-panel body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Media library (220px) */}
          <aside className="w-[220px] shrink-0 bg-white border-r border-border/40 flex flex-col overflow-hidden">
            <div className="px-4 py-[14px] pb-2 shrink-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50">Updates · Composer</div>
              <h3 className="font-extrabold text-[14px] text-on-surface tracking-[-0.005em] mt-0.5">Media library</h3>
            </div>
            <div className="flex px-3 gap-0.5 border-b border-border/40 shrink-0">
              {['Images', 'Video', 'Docs'].map((tab, i) => (
                <button key={tab} className={cn(
                  "px-[10px] py-2 font-extrabold text-[11px] border-b-2 transition-colors",
                  i === 0 ? "border-destructive text-on-surface" : "border-transparent text-muted-foreground/60 hover:text-on-surface"
                )}>{tab}</button>
              ))}
            </div>
            <div className="px-3 py-3 shrink-0">
              <input className="w-full px-3 py-2 text-[12px] rounded-[6px] border border-border/40 bg-muted/5 outline-none focus:border-primary/50" placeholder="Search media…" />
            </div>
            <div className="px-3 pb-3 shrink-0">
              <label className="block border-2 border-dashed border-border/60 rounded-[6px] text-center py-3 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await contentService.uploadImage(file, 'blog-images')
                  if (url) {
                    setFormData({...formData, imageUrl: url})
                    fetchMedia() // Refresh the library
                  }
                }} />
                <b className="font-extrabold text-[11.5px] text-on-surface block">Drop to upload</b>
                <span className="text-[11px] text-muted-foreground/60">JPG, PNG · up to 50 MB</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 pb-3 overflow-y-auto flex-1">
              {[...mediaFiles, ...MEDIA_IMAGES].map((url, i) => (
                <button key={i} type="button" onClick={() => setFormData({...formData, imageUrl: url})}
                  className={cn(
                    "aspect-square rounded-[4px] overflow-hidden relative group border-2 transition-all",
                    formData.imageUrl === url ? "border-primary" : "border-transparent hover:border-primary/40"
                  )}>
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  {formData.imageUrl === url && (
                    <span className="absolute bottom-1 left-1 text-[8.5px] font-extrabold uppercase tracking-[.05em] px-1.5 py-0.5 rounded-[2px] text-white" style={{ background: 'rgba(0,0,0,.6)' }}>In use</span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* CENTER: Composer */}
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Formatting toolbar */}
            <div className="bg-white border-b border-border/40 px-6 py-2 flex items-center gap-3 flex-wrap shrink-0">
              <Select value={formData.category || 'Movement'} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="h-[30px] px-[10px] border border-border/40 rounded-[4px] text-[11.5px] font-extrabold bg-white min-w-[120px] gap-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Movement','Youth','Economy','Diaspora','Integrity','Community'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Select value={formData.status} onValueChange={(val: 'Draft' | 'Pending Verification' | 'Published') => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-[30px] px-[10px] border border-border/40 rounded-[4px] text-[11.5px] font-extrabold bg-white gap-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Pending Verification">Pending</SelectItem>
                    <SelectItem value="Published" disabled={!canPublish}>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Document canvas */}
            <div className="flex-1 overflow-y-auto p-8" style={{ background: '#f1f5ee' }}>
              <form onSubmit={handleSubmit} id="blog-compose-form">
                <div className="max-w-[740px] mx-auto bg-white border border-border/40 rounded-[6px] px-[56px] py-[48px] pb-[64px] relative" style={{ minHeight: 920 }}>
                  {/* Brand line */}
                  <div className="absolute top-0 left-[56px] w-24 h-1 flex overflow-hidden rounded-b-[2px]">
                    <span className="flex-1" style={{ background: 'hsl(var(--brand-red))' }} />
                    <span className="flex-1" style={{ background: 'hsl(var(--brand-gold))' }} />
                    <span className="flex-1" style={{ background: 'hsl(var(--brand-green))' }} />
                  </div>

                  {/* Breadcrumb in doc */}
                  <div className="font-extrabold text-[10.5px] uppercase tracking-[.08em] mt-6 mb-3" style={{ color: 'hsl(var(--primary))' }}>
                    Updates · {formData.category || 'General'}
                  </div>

                  {/* Title */}
                  <input
                    required
                    value={formData.title ?? ''}
                    onChange={(e) => setFormData({...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'')})}
                    placeholder="Article title…"
                    className="w-full font-extrabold text-[40px] tracking-[-0.025em] leading-[1.1] outline-none border-0 bg-transparent text-on-surface placeholder:text-muted-foreground/30 mb-3"
                    style={{ fontFamily: "'Public Sans', sans-serif" }}
                  />

                  {/* Subtitle / excerpt */}
                  <textarea
                    required
                    value={formData.excerpt ?? ''}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    placeholder="Subtitle or opening hook…"
                    rows={2}
                    className="w-full text-[18px] leading-[1.5] resize-none outline-none border-0 bg-transparent mb-6 placeholder:text-muted-foreground/30"
                    style={{ fontFamily: "'Lora', 'Georgia', serif", color: 'hsl(var(--on-surface-muted))' }}
                  />

                  {/* Author byline */}
                  <div className="flex items-center gap-[10px] my-[22px] py-[14px] border-y border-border/40">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-extrabold text-sm shrink-0 overflow-hidden">
                      {formData.authorImage ? (
                        <img src={formData.authorImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (formData.authorName?.[0] || currentUser?.name?.[0] || 'A').toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <Select 
                        value={formData.authorId || (authors[0]?.id)} 
                        onValueChange={(val) => {
                          const author = authors.find(a => a.id === val)
                          if (author) {
                            setFormData({
                              ...formData, 
                              authorId: author.id,
                              authorName: author.name,
                              authorRole: author.role || '',
                              authorImage: author.imageUrl || '',
                              authorBio: author.bio || ''
                            })
                          }
                        }}
                      >
                        <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 text-left w-auto">
                          <div className="flex flex-col">
                            <b className="font-extrabold text-[12.5px] block leading-tight">
                              {formData.authorName || (authors.length > 0 ? 'Select Author' : (currentUser?.name || 'Author'))}
                            </b>
                            <span className="text-[11px] text-muted-foreground/60 font-bold leading-tight">
                              {formData.authorRole || (authors.find(a => a.id === formData.authorId)?.role) || (currentUser?.role?.toLowerCase().replace(/_/g,' ')) || 'Editor'}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {authors.map(author => (
                            <SelectItem key={author.id} value={author.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                  {author.imageUrl ? <img src={author.imageUrl} alt="" className="w-full h-full object-cover" /> : author.name[0]}
                                </div>
                                <span>{author.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="ml-auto text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50">
                      {formData.status === 'Published' ? `Pub ${new Date(formData.publishedAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}` : 'Draft'} · {formData.readTime}
                    </span>
                  </div>

                  {/* TinyMCE content editor */}
                  <Editor
                    key={editingPost?.id ?? 'new'}
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                    onInit={(_, editor) => (editorRef.current = editor)}
                    initialValue={formData.content ?? ''}
                    init={{
                      height: 520,
                      menubar: false,
                      plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'searchreplace', 'visualblocks', 'insertdatetime', 'table', 'wordcount'],
                      toolbar: 'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | link image | removeformat',
                      statusbar: false,
                      content_style: 'body { font-family: "Lora", Georgia, serif; font-size:16.5px; color:#1f2520; line-height:1.7; background:white; border:none; outline:none; }',
                      skin: 'oxide',
                      content_css: 'default',
                      branding: false,
                      images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
                        const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type })
                        const { contentService } = await import('@/services/contentService')
                        const url = await contentService.uploadImage(file, 'editor-content')
                        if (!url) throw new Error('Upload failed')
                        return url
                      },
                    }}
                  />

                  {/* Add block prompt */}
                  <div className="mt-4 px-4 py-[10px] flex items-center gap-2 text-[11.5px] font-extrabold text-muted-foreground/40 border border-dashed border-border/40 rounded-[4px]">
                    <span>+ Add block</span>
                    <span className="ml-1">· Press</span>
                    <kbd className="bg-muted/10 px-[5px] py-[1px] rounded-[3px] text-[10px] font-extrabold border border-border/40">/</kbd>
                    <span>for commands, or drag from the library</span>
                  </div>
                </div>
              </form>
            </div>
          </main>

          {/* RIGHT: Inspector (320px) */}
          <aside className="w-[320px] shrink-0 bg-white border-l border-border/40 flex flex-col overflow-y-auto">

            {/* Post settings */}
            <div className="px-[18px] py-4 border-b border-border/40">
              <h4 className="text-[10.5px] font-extrabold uppercase tracking-[.07em] text-muted-foreground/50 mb-3">Post settings</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50 block mb-1">URL slug</span>
                  <Input value={formData.slug ?? ''} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g,'-')})}
                    placeholder="article-url-slug" className="rounded-sm border-border/40 h-9 text-[12px]" />
                </div>
                <div>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50 block mb-1">Visibility</span>
                  <div className="grid grid-cols-2 gap-[5px]">
                    {['Public','Members'].map(v => (
                      <button key={v} type="button" className={cn("py-[9px] font-extrabold text-[11px] rounded-[4px] border transition-all",
                        v === 'Public' ? "bg-[#181d19] text-white border-[#181d19]" : "bg-white text-on-surface border-border/40 hover:border-on-surface/30"
                      )}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50 block mb-1">Featured</span>
                  <div className="grid grid-cols-2 gap-[5px]">
                    {[{label:'Off',val:false},{label:'On homepage',val:true}].map(opt => (
                      <button key={opt.label} type="button"
                        onClick={() => setFormData({...formData, isFeatured: opt.val})}
                        className={cn("py-[9px] font-extrabold text-[11px] rounded-[4px] border transition-all",
                          formData.isFeatured === opt.val ? "bg-[#181d19] text-white border-[#181d19]" : "bg-white text-on-surface border-border/40 hover:border-on-surface/30"
                        )}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50 block mb-1">Tags</span>
                  <div className="flex flex-wrap gap-[5px] mt-1">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-extrabold" style={{ background: 'rgba(218,165,32,.1)', borderColor: 'rgba(218,165,32,.3)', border: '1px solid', color: '#7d5d12' }}>
                        {tag}
                        <button type="button" onClick={() => setFormData({...formData, tags: formData.tags.filter(t => t !== tag)})} className="text-muted-foreground/60 font-extrabold hover:text-on-surface">×</button>
                      </span>
                    ))}
                    <input
                      placeholder="+ Add tag"
                      className="text-[10.5px] font-extrabold outline-none bg-transparent border-0 text-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          const val = (e.target as HTMLInputElement).value.trim()
                          if (val && !formData.tags.includes(val)) setFormData({...formData, tags: [...formData.tags, val]});
                          (e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEO inspector */}
            <div className="px-[18px] py-4 border-b border-border/40">
              <h4 className="text-[10.5px] font-extrabold uppercase tracking-[.07em] text-muted-foreground/50 mb-3">SEO · Readability</h4>
              <div className="flex justify-between items-baseline mb-[6px]">
                <b className="font-extrabold text-[20px] tracking-[-0.02em]" style={{ color: 'hsl(var(--primary))' }}>
                  {seoScore}<span className="text-[13px] text-muted-foreground/50 ml-0.5 font-bold">/100</span>
                </b>
                <span className="text-[10px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50">
                  {seoScore >= 80 ? 'Good' : seoScore >= 50 ? 'Fair' : 'Needs work'}
                </span>
              </div>
              <div className="h-[6px] bg-border/40 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${seoScore}%`, background: 'linear-gradient(to right, hsl(var(--brand-red)), hsl(var(--brand-gold)) 60%, hsl(var(--brand-green)))' }} />
              </div>
              <div className="space-y-0.5">
                {seoChecks.map((chk, i) => (
                  <div key={i} className="flex items-center gap-2 py-[6px] text-[11.5px] font-bold" style={{ color: 'hsl(var(--on-surface))' }}>
                    {chk.ok
                      ? <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                      : <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--accent))' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path fill="currentColor" d="M11 10h2v5h-2zM11 16h2v2h-2z"/></svg>
                    }
                    {chk.label}
                  </div>
                ))}
              </div>
              <div className="space-y-3 mt-4">
                <div>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50 block mb-1">Meta description</span>
                  <Textarea value={formData.metaDescription ?? ''} onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                    placeholder="Brief description for search snippets…" className="rounded-sm border-border/40 min-h-[72px] text-[12px] resize-none" />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="px-[18px] py-4 border-b border-border/40">
              <h4 className="text-[10.5px] font-extrabold uppercase tracking-[.07em] text-muted-foreground/50 mb-3">Schedule</h4>
              <div className="grid grid-cols-2 gap-[5px] mb-3">
                {['Publish now','Schedule'].map((opt, i) => (
                  <button key={opt} type="button" className={cn("py-[9px] font-extrabold text-[11px] rounded-[4px] border transition-all",
                    i === 0 ? "bg-[#181d19] text-white border-[#181d19]" : "bg-white text-on-surface border-border/40"
                  )}>{opt}</button>
                ))}
              </div>
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[.06em] text-muted-foreground/50 block mb-1">Est. read time</span>
                <Input value={formData.readTime ?? ''} onChange={(e) => setFormData({...formData, readTime: e.target.value})}
                  placeholder="5 min read" className="rounded-sm border-border/40 h-9 text-[12px]" />
              </div>
            </div>

            {/* Author */}
            <div className="px-[18px] py-4 border-b border-border/40">
              <h4 className="text-[10.5px] font-extrabold uppercase tracking-[.07em] text-muted-foreground/50 mb-3">Author</h4>
              <div className="space-y-2">
                <Input value={formData.authorName ?? ''} onChange={(e) => setFormData({...formData, authorName: e.target.value})} placeholder="Author name" className="rounded-sm border-border/40 h-9 text-[12px]" />
                <Input value={formData.authorRole ?? ''} onChange={(e) => setFormData({...formData, authorRole: e.target.value})} placeholder="Role / title" className="rounded-sm border-border/40 h-9 text-[12px]" />
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="px-[18px] py-[14px] bg-muted/5 mt-auto flex gap-2">
              <Button type="button" variant="default" onClick={() => setCurrentView('list')} className="flex-1 h-[38px] text-[12px] rounded-sm border-border/40">
                Discard
              </Button>
              <Button form="blog-compose-form" type="submit" variant="primary" disabled={isLoading} className="flex-1 h-[38px] text-[12px] rounded-sm shadow-sm">
                {isLoading ? 'Saving…' : 'Send to review'}
              </Button>
            </div>
          </aside>

        </div>
      </div>
    )
  }

  if (currentView === 'view' && viewPost) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground/40 normal-case mb-2">
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-on-surface text-sm font-medium normal-case" onClick={() => setCurrentView('list')}>
                Blog posts
              </Button>
              <span className="text-sm text-muted-foreground/20">/</span>
              <span className="text-sm font-semibold text-on-surface normal-case">View post</span>
            </div>
            <BrandLine />
          </div>
          <Button 
            onClick={() => handleEditPost(viewPost)}
            variant="active-tab"
            className="h-12 px-10 text-micro font-bold tracking-tight flex items-center gap-2 rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Edit post
          </Button>
        </div>
        
        <Card className="rounded-sm border-border/40 bg-white overflow-hidden max-w-4xl mx-auto shadow-sm">
          {viewPost.imageUrl && (
            <div className="w-full h-[400px] relative">
              <img src={viewPost.imageUrl} alt={viewPost.title} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
            </div>
          )}
          <CardContent className="p-10 md:p-16">
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="secondary" className="bg-muted/5 text-on-surface/60 border-none px-3 py-1 text-xs font-semibold rounded-full">
                {viewPost.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-muted-foreground/40">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold">{new Date(viewPost.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight mb-6">
              {viewPost.title}
            </h1>
            
            <div className="text-lg text-muted-foreground/40 font-medium leading-relaxed mb-10 border-l-4 border-border/40 pl-6 italic">
              {viewPost.excerpt}
            </div>

            <div 
              className="prose prose-on-surface max-w-none prose-p:text-on-surface/60 prose-p:leading-relaxed prose-headings:text-on-surface prose-headings:font-bold"
              dangerouslySetInnerHTML={{ __html: viewPost.content }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <FileText className="w-8 h-8 text-on-surface" />
            Blog posts
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Draft and publish strategic articles for the movement feed.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => handleEditPost()}
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Create new post
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters */}
        <aside className="lg:sticky lg:top-24 self-start space-y-8 order-2 lg:order-1">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
            <div className="p-4 border-b border-border/10 bg-muted/5">
              <h3 className="font-bold text-on-surface text-xs normal-case">Intelligence filters</h3>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="field-label">Search feed</Label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 group-focus-within:text-on-surface transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Keywords..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-stone-200 rounded-sm text-xs font-bold focus:border-on-surface outline-none transition-all placeholder:text-stone-300"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-50">
                <Label className="field-label">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full bg-white border-stone-200 text-xs font-bold rounded-sm focus:ring-0 focus:border-on-surface">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Pending Verification">Pending</SelectItem>
                    <SelectItem value="Draft">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-50">
                <Label className="field-label">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 w-full bg-white border-stone-200 text-xs font-bold rounded-sm focus:ring-0 focus:border-on-surface">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Movement">Movement</SelectItem>
                    <SelectItem value="Youth">Youth</SelectItem>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Diaspora">Diaspora</SelectItem>
                    <SelectItem value="Integrity">Integrity</SelectItem>
                    <SelectItem value="Community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Telemetry Card */}
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-on-surface text-white p-6">
             <p className="text-micro font-bold text-white/40 uppercase tracking-[.06em] mb-4">Content telemetry</p>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-xs font-bold">Total Articles</span>
                   <span className="text-xl font-bold font-meta">{posts.length}</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-xs font-bold">Authorized</span>
                   <span className="text-xl font-bold font-meta text-primary">{posts.filter(p => p.status === 'Published').length}</span>
                </div>
             </div>
          </Card>
        </aside>

        {/* Articles Grid */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="rounded-sm border-border/40 animate-pulse bg-white">
                  <div className="h-48 bg-muted/5" />
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-muted/5 w-3/4 rounded" />
                    <div className="h-4 bg-muted/5 w-1/2 rounded" />
                  </CardContent>
                </Card>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-border/40 rounded-sm">
                <div className="w-16 h-16 bg-muted/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">No posts found</h3>
                <p className="text-sm text-muted-foreground/40 mt-1 max-w-xs mx-auto">Try refining your search or create a new blog post to get started.</p>
                <Button 
                  variant="default" 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 rounded-sm border-border/40 font-bold text-micro tracking-tight px-10 h-12 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="rounded-sm border-border/40 group hover:border-border/60 hover:shadow-md transition-all overflow-hidden bg-white flex flex-col">
                  <div className="aspect-video relative overflow-hidden bg-muted/5">
                    <img 
                      src={post.imageUrl || CATEGORY_PLACEHOLDERS[post.category] || DEFAULT_PLACEHOLDER} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"  
                      decoding="async" 
                      loading="lazy" 
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 backdrop-blur-sm text-on-surface/80 text-micro font-bold tracking-tight rounded-full border-none shadow-sm px-3">
                        {post.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-12">
                      <Badge className={cn(
                        "backdrop-blur-sm text-micro font-bold tracking-tight rounded-full border-none shadow-sm px-3",
                        post.status === 'Published' ? "bg-brand-green text-white" : 
                        post.status === 'Pending Verification' ? "bg-brand-gold text-on-surface" :
                        "bg-amber-500/80 text-white"
                      )}>
                        {post.status}
                      </Badge>
                    </div>
                    {post.isFeatured && (
                      <div className="absolute top-4 right-4">
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                          <Star className="w-3.5 h-3.5 fill-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h3 className="text-lg font-bold text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 hover:bg-muted/5 rounded-full">
                            <MoreVertical className="w-4 h-4 text-muted-foreground/40" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-sm border-border/40 shadow-xl p-2 w-48">
                          <DropdownMenuItem onClick={() => handleEditPost(post)} className="rounded-sm text-sm font-medium gap-3 py-2.5">
                            <Edit2 className="w-4 h-4 text-muted-foreground/40" /> Edit post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPost(post)} className="rounded-sm text-sm font-medium gap-3 py-2.5">
                            <Eye className="w-4 h-4 text-muted-foreground/40" /> View post
                          </DropdownMenuItem>
                          <div className="h-px bg-border/40 my-1" />
                          <DropdownMenuItem disabled={isDeleting} onClick={() => handleDelete(post)} className="rounded-sm text-sm font-medium gap-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="w-4 h-4" /> Delete post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-muted-foreground/40 text-sm line-clamp-2 mb-6 font-medium leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-5 border-t border-border/40 mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground/40">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-tiny font-semibold">{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-tiny font-semibold">{post.readTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
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
