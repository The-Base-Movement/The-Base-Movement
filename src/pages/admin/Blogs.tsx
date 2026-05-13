import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Download,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/neon-button'
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
import { Editor } from '@tinymce/tinymce-react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { BlogPost, AdminUser, Author } from '@/types/admin'
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
      <div className="main animate-in fade-in duration-500 !p-0 !max-w-none flex flex-col" style={{ height: 'calc(100vh - 4rem)', overflow: 'hidden', background: 'hsl(var(--background))' }}>
        <div className="top !mb-0 px-6 py-3 border-b border-border/40 bg-white shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setCurrentView('list')} className="material-symbols-outlined text-muted-foreground/60 hover:text-on-surface transition-colors">arrow_back</button>
            <div className="flex flex-col">
              <div className="crumbs !mb-0">
                <button onClick={() => setCurrentView('list')} className="hover:underline">Editorial</button>
                {' · '}
                {editingPost ? 'Refining intelligence' : 'Drafting dispatch'}
              </div>
              <h2 className="!text-sm !font-black !m-0 flex items-center gap-2">
                {formData.title || 'Untitled Dispatch'}
                <span className="pill" style={{ 
                  background: formData.status === 'Published' ? 'hsl(var(--brand-green))' : 'hsl(var(--brand-gold))',
                  color: formData.status === 'Published' ? '#fff' : 'hsl(var(--on-surface))',
                  fontSize: 10
                }}>
                  {formData.status}
                </span>
              </h2>
            </div>
          </div>
          <div className="actions !gap-2">
            <Button variant="outline" className="h-9 px-4 text-[11px] font-bold rounded-sm border-border/40 hidden md:flex">
              <Eye className="w-3.5 h-3.5 mr-2" /> Preview
            </Button>
            <Button variant="primary" className="h-9 px-6 text-[11px] font-bold rounded-sm shadow-sm"
              disabled={isLoading}
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            >
              {isLoading ? 'Saving...' : formData.status === 'Published' ? 'Authorize' : 'Save draft'}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-border/40 flex-col bg-white">
            <div className="p-4 border-b border-border/40 bg-muted/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Tactical Assets</h3>
            </div>
            <div className="p-3 border-b border-border/40">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-sm py-4 cursor-pointer hover:bg-muted/5 transition-colors">
                <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await contentService.uploadImage(file, 'blog-images')
                  if (url) {
                    setFormData({...formData, imageUrl: url})
                    fetchMedia()
                  }
                }} />
                <span className="material-symbols-outlined text-muted-foreground/30">upload_file</span>
                <span className="text-[10px] font-bold mt-1">Upload Assets</span>
              </label>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
              {[...mediaFiles, ...MEDIA_IMAGES].map((url, i) => (
                <button key={i} onClick={() => setFormData({...formData, imageUrl: url})}
                  className={cn(
                    "aspect-square rounded-sm border-2 transition-all overflow-hidden",
                    formData.imageUrl === url ? "border-primary" : "border-transparent hover:border-border/60"
                  )}>
                  <img src={url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 min-w-0 flex flex-col bg-muted/5 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
              <div className="max-w-[800px] mx-auto">
                <div className="panel !p-0 overflow-hidden shadow-2xl shadow-on-surface/5">
                  <div className="bg-white px-8 md:px-16 py-12 md:py-20 min-h-[900px]">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black overflow-hidden shadow-inner">
                            {formData.authorImage ? <img src={formData.authorImage} className="w-full h-full object-cover" alt="" /> : (formData.authorName?.[0] || 'A')}
                          </div>
                          <div className="flex flex-col">
                            <Select value={formData.authorId || authors[0]?.id} onValueChange={(val) => {
                              const author = authors.find(a => a.id === val)
                              if (author) setFormData({...formData, authorId: author.id, authorName: author.name, authorRole: author.role || '', authorImage: author.imageUrl || '', authorBio: author.bio || ''})
                            }}>
                              <SelectTrigger className="h-auto p-0 border-0 bg-transparent font-black text-sm shadow-none focus:ring-0">
                                <SelectValue placeholder="Select Author" />
                              </SelectTrigger>
                              <SelectContent>
                                {authors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <span className="text-[11px] font-bold text-muted-foreground/50 tracking-tight">{formData.authorRole || 'Contributor'}</span>
                          </div>
                        </div>
                        <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                          <SelectTrigger className="w-[140px] h-9 bg-muted/5 border-border/40 text-xs font-black rounded-sm uppercase tracking-wider">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['Movement','Youth','Economy','Diaspora','Integrity','Community'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <textarea
                          placeholder="Article Title..."
                          className="w-full text-3xl md:text-5xl font-black tracking-tight leading-[1.1] outline-none border-0 bg-transparent placeholder:text-muted-foreground/20 resize-none min-h-[100px]"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'')})}
                        />
                        <textarea
                          placeholder="Compelling opening hook or summary..."
                          className="w-full text-lg md:text-xl font-medium leading-relaxed outline-none border-0 bg-transparent placeholder:text-muted-foreground/20 italic text-muted-foreground/60 resize-none min-h-[80px]"
                          value={formData.excerpt}
                          onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                        />
                      </div>

                      {formData.imageUrl && (
                        <div className="relative group rounded-sm overflow-hidden aspect-video border border-border/40 mb-4">
                          <img src={formData.imageUrl} className="w-full h-full object-cover" alt="" />
                          <button onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute top-4 right-4 w-10 h-10 bg-on-surface/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="min-h-[500px]">
                        <Editor
                          key={editingPost?.id ?? 'new'}
                          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                          onInit={(_, editor) => (editorRef.current = editor)}
                          initialValue={formData.content ?? ''}
                          init={{
                            height: 600,
                            menubar: false,
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
            </div>
          </main>

          <aside className="hidden xl:flex w-[300px] shrink-0 border-l border-border/40 flex-col bg-white overflow-y-auto">
            <div className="p-4 border-b border-border/40 bg-muted/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Post Intelligence</h3>
            </div>
            <div className="p-5 space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">SEO Quality</span>
                  <span className="text-xl font-black font-meta text-primary">{seoScore}%</span>
                </div>
                <div className="h-1 bg-muted/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-700" style={{ width: `${seoScore}%` }} />
                </div>
                <div className="mt-3 space-y-1.5">
                  {seoChecks.map((chk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold">
                      <span className={cn("w-1.5 h-1.5 rounded-full", chk.ok ? "bg-brand-green" : "bg-muted-foreground/20")} />
                      <span className={chk.ok ? "text-on-surface" : "text-muted-foreground/40"}>{chk.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-2">Resource Slug</label>
                <div className="flex items-center gap-2 bg-muted/5 border border-border/40 rounded-sm p-2">
                  <span className="text-muted-foreground/30 text-[10px]">/blog/</span>
                  <input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="bg-transparent border-0 outline-none text-[11px] font-bold w-full" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-2">Tactical Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="pill bg-muted/10 text-muted-foreground/60 !py-0.5">
                      {tag}
                      <button onClick={() => setFormData({...formData, tags: formData.tags.filter(t => t !== tag)})} className="ml-1 hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
                <input 
                  placeholder="Type and press Enter..." 
                  className="w-full h-8 px-3 bg-muted/5 border border-border/40 rounded-sm text-[11px] font-bold outline-none focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim()
                      if (val && !formData.tags.includes(val)) {
                        setFormData({...formData, tags: [...formData.tags, val]})
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-2">Strategic Summary</label>
                <textarea 
                  value={formData.metaDescription} 
                  onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                  className="w-full min-h-[100px] p-3 bg-muted/5 border border-border/40 rounded-sm text-[11px] font-medium leading-relaxed outline-none focus:border-primary/50 resize-none"
                  placeholder="Search engine summary..."
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  if (currentView === 'view' && viewPost) {
    return (
      <div className="main animate-in fade-in duration-500">
        <div className="top">
          <div>
            <div className="crumbs">
              <button onClick={() => setCurrentView('list')} className="hover:underline">Editorial</button>
              {' · '}
              Intelligence Review
            </div>
            <h2 className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">visibility</span>
              {viewPost.title}
            </h2>
          </div>
          <div className="actions">
            <Button onClick={() => handleEditPost(viewPost)} variant="primary" className="h-10 px-6 font-bold rounded-sm shadow-sm">
              <Edit2 className="w-4 h-4 mr-2" /> Modify dispatch
            </Button>
          </div>
        </div>

        <div className="panel max-w-4xl mx-auto overflow-hidden">
          {viewPost.imageUrl && (
            <div className="w-full h-[400px]">
              <img src={viewPost.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 md:p-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="pill bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px]">{viewPost.category}</span>
              <div className="flex items-center gap-2 text-muted-foreground/40 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(viewPost.publishedAt).toLocaleDateString()}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-tight mb-8">
              {viewPost.title}
            </h1>

            <div className="text-xl text-muted-foreground/60 leading-relaxed mb-12 border-l-4 border-primary/20 pl-8 font-medium italic">
              {viewPost.excerpt}
            </div>

            <div 
              className="prose prose-on-surface max-w-none 
                prose-p:text-on-surface/70 prose-p:leading-relaxed prose-p:text-[17px]
                prose-headings:text-on-surface prose-headings:font-black prose-headings:tracking-tight"
              dangerouslySetInnerHTML={{ __html: viewPost.content }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="top">
        <div>
          <div className="crumbs">
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '}
            Blog intelligence
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--on-surface))' }}>article</span>
            Editorial command
          </h2>
        </div>
        <div className="actions">
          <Button variant="outline" className="h-10 px-4 text-[12px] font-bold tracking-tight rounded-sm border-border/40 gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button 
            onClick={() => handleEditPost()}
            variant="primary"
            className="h-10 px-6 text-[12px] font-bold tracking-tight rounded-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Dispatch new article
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="kpis">
        <div className="kpi">
          <div className="l">Total articles</div>
          <div className="v">{posts.length}</div>
          <div className="d">Across all categories</div>
        </div>
        <div className="kpi" style={{ '--ac': 'hsl(var(--brand-green))' } as React.CSSProperties}>
          <div className="l" style={{ color: 'hsl(var(--brand-green))' }}>Authorized</div>
          <div className="v">{posts.filter(p => p.status === 'Published').length}</div>
          <div className="d">Live in public feed</div>
        </div>
        <div className="kpi" style={{ '--ac': 'hsl(var(--brand-gold))' } as React.CSSProperties}>
          <div className="l" style={{ color: 'hsl(var(--brand-gold))' }}>Pending review</div>
          <div className="v">{posts.filter(p => p.status === 'Pending Verification').length}</div>
          <div className="d">Awaiting editorial clearance</div>
        </div>
        <div className="kpi" style={{ '--ac': 'hsl(var(--on-surface-muted))' } as React.CSSProperties}>
          <div className="l">Drafts</div>
          <div className="v">{posts.filter(p => p.status === 'Draft').length}</div>
          <div className="d">Work in progress</div>
        </div>
      </div>

      <div className="sidebar-main">
        {/* Sidebar Filters */}
        <aside className="panel h-fit sticky top-20">
          <div className="ph">
            <h3 className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Intelligence filters
            </h3>
          </div>
          <div className="p-5 flex flex-col gap-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Search feed</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-border/40 rounded-sm text-xs font-bold outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-border/40">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full bg-white border-border/40 text-xs font-bold rounded-sm focus:ring-primary/20">
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

            <div className="space-y-2.5 pt-4 border-t border-border/40">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 w-full bg-white border-border/40 text-xs font-bold rounded-sm focus:ring-primary/20">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {['Movement','Youth','Economy','Diaspora','Integrity','Community'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Articles Grid */}
        <div className="min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="panel animate-pulse h-[320px]">
                  <div className="h-[160px] bg-muted/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted/5 w-4/5" />
                    <div className="h-3 bg-muted/5 w-2/3" />
                  </div>
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="panel col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-muted/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">No posts found</h3>
                <p className="text-sm text-muted-foreground/40 mt-1 max-w-xs mx-auto">Try refining your search or create a new blog post to get started.</p>
                <Button 
                  variant="default" 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 rounded-sm border-border/40 font-bold text-micro tracking-tight px-10 h-10 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="panel group flex flex-col overflow-hidden hover:shadow-xl hover:shadow-on-surface/5 transition-all duration-300">
                  <div className="h-[160px] relative overflow-hidden bg-muted/5">
                    <img 
                      src={post.imageUrl || CATEGORY_PLACEHOLDERS[post.category] || DEFAULT_PLACEHOLDER} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="pill bg-white/90 text-on-surface font-black backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={cn(
                        "pill shadow-sm font-black text-[9px]",
                        post.status === 'Published' ? "bg-brand-green text-white" : 
                        post.status === 'Pending Verification' ? "bg-brand-gold text-on-surface" :
                        "bg-amber-500 text-white"
                      )}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-sm font-black text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/5 shrink-0 transition-colors">
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="p-2 w-48">
                          <DropdownMenuItem onClick={() => handleEditPost(post)} className="gap-3 py-2.5">
                            <Edit2 className="w-4 h-4" /> Edit post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPost(post)} className="gap-3 py-2.5">
                            <Eye className="w-4 h-4" /> View post
                          </DropdownMenuItem>
                          <div className="h-px bg-border/40 my-1" />
                          <DropdownMenuItem disabled={isDeleting} onClick={() => handleDelete(post)} className="gap-3 py-2.5 text-destructive">
                            <Trash2 className="w-4 h-4" /> Delete post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-[12px] text-muted-foreground/60 line-clamp-2 mb-4 font-medium leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
                      <div className="flex items-center gap-1.5 text-muted-foreground/40">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
