import { useState, useEffect, useCallback } from 'react'
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
  Upload
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Editor } from '@tinymce/tinymce-react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { BlogPost, AdminUser } from '@/types/admin'
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
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  
  const canPublish = currentUser?.role === 'SUPER_ADMIN' || 
                    currentUser?.role === 'CHIEF_EDITOR' || 
                    currentUser?.role === 'SENIOR_EDITOR'
  
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
      let success = false
      if (editingPost) {
        success = await adminService.updateBlogPost(editingPost.id, formData)
      } else {
        // Simple slug generation if empty
        const postData = { ...formData }
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
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-on-surface/40 normal-case">
            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-on-surface text-sm font-medium normal-case" onClick={() => setCurrentView('list')}>
              Blog posts
            </Button>
            <span className="text-sm text-on-surface/20">/</span>
            <span className="text-sm font-semibold text-on-surface normal-case">{editingPost ? 'Edit post' : 'Create new post'}</span>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight normal-case">
            {editingPost ? 'Edit post' : 'Create new post'}
          </h2>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1 font-medium">
            Fill in the details below to configure and publish your post.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-sm border-border/40 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-muted/5">
                <h3 className="font-bold text-on-surface text-xs normal-case">Post details</h3>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Article title</Label>
                  <Input 
                    required
                    id="title"
                    value={formData.title ?? ''}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter article title..." 
                    className="rounded-sm border-border/40 h-11 text-sm font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="slug" className="text-sm font-bold text-on-surface/80">Article URL Slug</Label>
                  <Input 
                    id="slug"
                    value={formData.slug ?? ''}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                    placeholder="article-url-slug" 
                    className="rounded-sm border-border/40 h-11 text-sm font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="excerpt" className="text-sm font-bold text-on-surface/80">Excerpt (Brief Summary)</Label>
                  <Textarea 
                    id="excerpt"
                    required
                    value={formData.excerpt ?? ''}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    placeholder="Provide a strategic summary for the movement feed..." 
                    className="rounded-sm border-border/40 min-h-[100px] text-sm font-medium leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border-border/40 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-muted/5">
                <h3 className="font-bold text-on-surface text-xs normal-case">Content</h3>
              </div>
              <CardContent className="p-0 border-0">
                <div className="p-8">
                  <div className="rounded-sm border border-border/40 overflow-hidden shadow-inner bg-muted/5">
                    <Editor
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={formData.content ?? ''}
                      onEditorChange={(content) => setFormData({...formData, content})}
                      init={{
                        height: 750,
                        menubar: false,
                        toolbar_sticky: true,
                        toolbar_sticky_offset: 100,
                        plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                        content_style: 'body { font-family: "Public Sans", sans-serif; font-size:16px; color: #1c1917; line-height: 1.75; padding: 3rem; background: white; }',
                        skin: 'oxide',
                        content_css: 'default',
                        border_width: 0,
                        images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
                          const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
                          const url = await contentService.uploadImage(file, 'editor-content');
                          if (!url) throw new Error('Upload failed');
                          return url;
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-8 sticky top-6">
            
            <Card className="rounded-sm border-border/40 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-muted/5">
                <h3 className="font-bold text-on-surface text-sm normal-case">Publishing</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <Label className="text-sm font-bold text-on-surface/80">Featured post</Label>
                    <p className="text-xs font-medium text-muted-foreground/40 leading-tight">Pin this post to the top of the insights feed.</p>
                  </div>
                  <Switch 
                    checked={formData.isFeatured}
                    onCheckedChange={(val) => setFormData({...formData, isFeatured: val})}
                  />
                </div>

                <div className="space-y-3 pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-on-surface/80">Publication Status</Label>
                    {!canPublish && (
                      <Badge variant="outline" className="text-micro font-bold text-amber-600 border-amber-200 bg-amber-50 rounded-sm">
                        Authorization Required
                      </Badge>
                    )}
                  </div>
                  <Select 
                    value={formData.status}
                    onValueChange={(val: 'Draft' | 'Pending Verification' | 'Published') => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger className="rounded-sm border-border/40 h-11 text-sm font-medium">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Save as Draft</SelectItem>
                      <SelectItem value="Pending Verification">Request Verification</SelectItem>
                      <SelectItem value="Published" disabled={!canPublish}>Authorize & Publish</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-micro font-medium text-muted-foreground/40 leading-tight">
                    {canPublish 
                      ? "Control the visibility of this intelligence across the movement's platforms."
                      : "Submit this intelligence for review. Senior Editorial personnel will verify before deployment."}
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-border/40">
                  <Label className="text-sm font-bold text-on-surface/80">Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(val) => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger className="rounded-sm border-border/40 h-11 text-sm font-medium">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Movement">Movement</SelectItem>
                      <SelectItem value="Youth">Youth</SelectItem>
                      <SelectItem value="Economy">Economy</SelectItem>
                      <SelectItem value="Diaspora">Diaspora</SelectItem>
                      <SelectItem value="Integrity">Integrity</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-on-surface/80">Featured image URL</Label>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="blog-image-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await contentService.uploadImage(file, 'blog-images')
                          if (url) {
                            setFormData({...formData, imageUrl: url})
                          }
                        }}
                      />
                      <Label 
                        htmlFor="blog-image-upload" 
                        className="text-micro font-bold text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1.5 transition-colors tracking-wide"
                      >
                        <Upload className="w-3 h-3" />
                        Upload image
                      </Label>
                    </div>
                  </div>
                  <Input 
                    value={formData.imageUrl ?? ''}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg" 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                  <p className="text-xs font-medium text-muted-foreground/40">Provide a direct URL or upload a file.</p>
                </div>

                <div className="space-y-3 pt-6 border-t border-border/40">
                  <Label className="text-sm font-bold text-on-surface/80">Est. read time</Label>
                  <Input 
                    value={formData.readTime ?? ''}
                    onChange={(e) => setFormData({...formData, readTime: e.target.value})}
                    placeholder="5 min read" 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                  <p className="text-xs font-medium text-muted-foreground/40">Suggested format: "5 min read"</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border-border/40 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-muted/5">
                <h3 className="font-bold text-on-surface text-sm normal-case">Author information</h3>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Author name</Label>
                  <Input 
                    value={formData.authorName ?? ''}
                    onChange={(e) => setFormData({...formData, authorName: e.target.value})}
                    placeholder="e.g. John Doe" 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Author role</Label>
                  <Input 
                    value={formData.authorRole ?? ''}
                    onChange={(e) => setFormData({...formData, authorRole: e.target.value})}
                    placeholder="e.g. Communications Director" 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-on-surface/80">Author image URL</Label>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="author-image-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await contentService.uploadImage(file, 'author-images')
                          if (url) {
                            setFormData({...formData, authorImage: url})
                          }
                        }}
                      />
                      <Label 
                        htmlFor="author-image-upload" 
                        className="text-micro font-bold text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1.5 transition-colors tracking-wide"
                      >
                        <Upload className="w-3 h-3" />
                        Upload photo
                      </Label>
                    </div>
                  </div>
                  <Input 
                    value={formData.authorImage ?? ''}
                    onChange={(e) => setFormData({...formData, authorImage: e.target.value})}
                    placeholder="https://..." 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Author bio</Label>
                  <Textarea 
                    value={formData.authorBio ?? ''}
                    onChange={(e) => setFormData({...formData, authorBio: e.target.value})}
                    placeholder="Short professional bio..." 
                    className="rounded-sm border-border/40 min-h-[80px] text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border-border/40 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-muted/5">
                <h3 className="font-bold text-on-surface text-sm normal-case">SEO settings</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Meta title</Label>
                  <Input 
                    value={formData.seoTitle ?? ''}
                    onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                    placeholder="Title for search engines..." 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Keywords</Label>
                  <Input 
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                    placeholder="ghana, industry, jobs" 
                    className="rounded-sm border-border/40 h-11 text-sm"
                  />
                  <p className="text-xs font-medium text-muted-foreground/40">Comma separated tags.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-on-surface/80">Meta description</Label>
                  <Textarea 
                    value={formData.metaDescription ?? ''}
                    onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                    placeholder="Brief description for search result snippets..." 
                    className="rounded-sm border-border/40 min-h-[80px] text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                variant="primary"
                className="w-full h-14 rounded-sm text-tiny font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95"
              >
                {isLoading ? 'Processing...' : (
                  formData.status === 'Published' 
                    ? 'Authorize & Publish' 
                    : formData.status === 'Pending Verification'
                    ? 'Submit for Verification'
                    : 'Save as draft'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentView('list')}
                className="w-full h-12 rounded-sm text-micro font-bold tracking-tight text-muted-foreground/80 hover:text-red-500 border-border/40 hover:bg-red-50 transition-all shadow-sm active:scale-95"
              >
                Abort & Discard
              </Button>
            </div>
            
          </div>
        </form>
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
            variant="primary"
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
                <Label className="text-micro font-bold text-stone-500 uppercase tracking-widest">Search feed</Label>
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
                <Label className="text-micro font-bold text-stone-500 uppercase tracking-widest">Status</Label>
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
                <Label className="text-micro font-bold text-stone-500 uppercase tracking-widest">Category</Label>
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
             <p className="text-micro font-bold text-white/40 uppercase tracking-widest mb-4">Content telemetry</p>
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
                  variant="outline" 
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
