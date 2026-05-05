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
import { Button } from '@/components/ui/Button'
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
import type { BlogPost } from '@/types/admin'
import { useToast } from '@/hooks/use-toast'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { toast as sonnerToast } from 'sonner'

export default function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
      tags: [],
      seoTitle: '',
      metaDescription: '',
      authorName: '',
      authorRole: '',
      authorImage: '',
      authorBio: ''
    }
  })

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

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

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
        tags: post.tags,
        seoTitle: post.seoTitle || '',
        metaDescription: post.metaDescription || '',
        authorName: post.authorName || '',
        authorRole: post.authorRole || '',
        authorImage: post.authorImage || '',
        authorBio: post.authorBio || ''
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
        toast({
          title: editingPost ? "Post Updated" : "Post Published",
          description: `The post "${formData.title}" has been saved successfully.`,
        })
        setCurrentView('list')
        fetchPosts()
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save the blog post.",
        variant: "destructive",
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

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (currentView === 'edit') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-500 normal-case">
            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-stone-900 text-sm font-medium normal-case" onClick={() => setCurrentView('list')}>
              Blog posts
            </Button>
            <span className="text-sm text-stone-400">/</span>
            <span className="text-sm font-semibold text-stone-900 normal-case">{editingPost ? 'Edit post' : 'Create new post'}</span>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight normal-case">
            {editingPost ? 'Edit post' : 'Create new post'}
          </h2>
          <p className="text-stone-500 text-sm mt-1 font-medium">
            Fill in the details below to configure and publish your post.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-xl border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <h3 className="font-bold text-stone-900 text-xs normal-case">Post details</h3>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Article title</Label>
                  <Input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. The future of industry" 
                    className="rounded-lg border-stone-200 h-11 text-sm placeholder:text-stone-400"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Slug</Label>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="the-future-of-industry" 
                    className="rounded-lg border-stone-200 h-11 text-sm placeholder:text-stone-400"
                  />
                  <p className="text-xs font-medium text-stone-500">The URL-friendly name for this post. Leave blank to auto-generate from the title.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Excerpt</Label>
                  <Textarea 
                    required
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    placeholder="A brief 1-2 sentence summary for article cards..." 
                    className="rounded-lg border-stone-200 min-h-[100px] text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <h3 className="font-bold text-stone-900 text-xs normal-case">Content</h3>
              </div>
              <CardContent className="p-0 border-0">
                <div className="p-8">
                  <div className="rounded-lg border border-stone-200 overflow-hidden shadow-inner bg-stone-50/30">
                    <Editor
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={formData.content}
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
            
            <Card className="rounded-xl border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <h3 className="font-bold text-stone-900 text-sm normal-case">Publishing</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <Label className="text-sm font-bold text-stone-800">Featured post</Label>
                    <p className="text-xs font-medium text-stone-500 leading-tight">Pin this post to the top of the insights feed.</p>
                  </div>
                  <Switch 
                    checked={formData.isFeatured}
                    onCheckedChange={(val) => setFormData({...formData, isFeatured: val})}
                  />
                </div>

                <div className="space-y-3 pt-6 border-t border-stone-100">
                  <Label className="text-sm font-bold text-stone-800">Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(val) => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger className="rounded-lg border-stone-200 h-11 text-sm font-medium">
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

                <div className="space-y-3 pt-6 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-stone-800">Featured image URL</Label>
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
                        className="text-[10px] font-bold text-[var(--brand-green)] hover:text-emerald-700 cursor-pointer flex items-center gap-1.5 transition-colors tracking-wide"
                      >
                        <Upload className="w-3 h-3" />
                        Upload image
                      </Label>
                    </div>
                  </div>
                  <Input 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg" 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                  <p className="text-xs font-medium text-stone-500">Provide a direct URL or upload a file.</p>
                </div>

                <div className="space-y-3 pt-6 border-t border-stone-100">
                  <Label className="text-sm font-bold text-stone-800">Est. read time</Label>
                  <Input 
                    value={formData.readTime}
                    onChange={(e) => setFormData({...formData, readTime: e.target.value})}
                    placeholder="5 min read" 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                  <p className="text-xs font-medium text-stone-500">Suggested format: "5 min read"</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <h3 className="font-bold text-stone-900 text-sm normal-case">Author information</h3>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Author name</Label>
                  <Input 
                    value={formData.authorName}
                    onChange={(e) => setFormData({...formData, authorName: e.target.value})}
                    placeholder="e.g. John Doe" 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Author role</Label>
                  <Input 
                    value={formData.authorRole}
                    onChange={(e) => setFormData({...formData, authorRole: e.target.value})}
                    placeholder="e.g. Communications Director" 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-stone-800">Author image URL</Label>
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
                        className="text-[10px] font-bold text-[var(--brand-green)] hover:text-emerald-700 cursor-pointer flex items-center gap-1.5 transition-colors tracking-wide"
                      >
                        <Upload className="w-3 h-3" />
                        Upload photo
                      </Label>
                    </div>
                  </div>
                  <Input 
                    value={formData.authorImage}
                    onChange={(e) => setFormData({...formData, authorImage: e.target.value})}
                    placeholder="https://..." 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Author bio</Label>
                  <Textarea 
                    value={formData.authorBio}
                    onChange={(e) => setFormData({...formData, authorBio: e.target.value})}
                    placeholder="Short professional bio..." 
                    className="rounded-lg border-stone-200 min-h-[80px] text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <h3 className="font-bold text-stone-900 text-sm normal-case">SEO settings</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Meta title</Label>
                  <Input 
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                    placeholder="Title for search engines..." 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Keywords</Label>
                  <Input 
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                    placeholder="ghana, industry, jobs" 
                    className="rounded-lg border-stone-200 h-11 text-sm"
                  />
                  <p className="text-xs font-medium text-stone-500">Comma separated tags.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-stone-800">Meta description</Label>
                  <Textarea 
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                    placeholder="Brief description for search result snippets..." 
                    className="rounded-lg border-stone-200 min-h-[80px] text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-sm font-bold transition-all shadow-md active:scale-[0.98] normal-case"
              >
                {isLoading ? 'Saving...' : editingPost ? 'Update post' : 'Publish post'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setCurrentView('list')}
                className="w-full h-11 rounded-lg text-xs font-bold text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors normal-case"
              >
                Discard changes
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
          <div className="flex items-center gap-2 text-stone-500 normal-case">
            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-stone-900 text-sm font-medium normal-case" onClick={() => setCurrentView('list')}>
              Blog posts
            </Button>
            <span className="text-sm text-stone-400">/</span>
            <span className="text-sm font-semibold text-stone-900 normal-case">View post</span>
          </div>
          <Button 
            onClick={() => handleEditPost(viewPost)}
            className="h-10 px-6 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-2 rounded-lg"
          >
            <Edit2 className="w-3 h-3" /> Edit post
          </Button>
        </div>
        
        <Card className="rounded-xl border-stone-200 bg-white overflow-hidden max-w-4xl mx-auto shadow-sm">
          {viewPost.imageUrl && (
            <div className="w-full h-[400px] relative">
              <img src={viewPost.imageUrl} alt={viewPost.title} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
            </div>
          )}
          <CardContent className="p-10 md:p-16">
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-none px-3 py-1 text-xs font-semibold rounded-full">
                {viewPost.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-stone-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">{new Date(viewPost.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--brand-black)] tracking-tight leading-tight mb-6">
              {viewPost.title}
            </h1>
            
            <div className="text-lg text-stone-500 font-medium leading-relaxed mb-10 border-l-4 border-stone-200 pl-6 italic">
              {viewPost.excerpt}
            </div>

            <div 
              className="prose prose-stone max-w-none prose-p:text-stone-600 prose-p:leading-relaxed prose-headings:text-[var(--brand-black)] prose-headings:font-bold"
              dangerouslySetInnerHTML={{ __html: viewPost.content }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-stone-900" />
            Blog posts
          </h1>
          <p className="text-stone-500 text-sm mt-1">Draft and publish strategic articles for the movement feed.</p>
        </div>
        <Button 
          onClick={() => handleEditPost()}
          className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all"
        >
          <Plus className="w-3.5 h-3.5 mr-2" /> Create new post
        </Button>
      </div>


      {/* Control Bar */}
      <Card className="rounded-xl border-stone-200 bg-white p-2 shadow-sm mb-10">
        <div className="flex flex-wrap items-center gap-8 px-2 py-1">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search posts by title or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-stone-50 border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-stone-200 transition-all placeholder:text-stone-400"
            />
          </div>
          <div className="flex items-center gap-3 pr-2">
            <Select defaultValue="all">
              <SelectTrigger className="h-10 w-[160px] bg-white border-stone-200 text-sm font-semibold rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Movement">Movement</SelectItem>
                <SelectItem value="Youth">Youth</SelectItem>
                <SelectItem value="Economy">Economy</SelectItem>
                <SelectItem value="Diaspora">Diaspora</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="rounded-xl border-stone-200 animate-pulse bg-white">
              <div className="h-48 bg-stone-100" />
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-stone-100 w-3/4 rounded" />
                <div className="h-4 bg-stone-100 w-1/2 rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-stone-100 rounded-2xl">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-stone-200" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">No posts found</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-xs mx-auto">Try refining your search or create a new blog post to get started.</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="mt-6 rounded-lg border-stone-200 font-bold text-xs px-6"
            >
              Clear search
            </Button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="rounded-xl border-stone-200 group hover:border-stone-300 hover:shadow-md transition-all overflow-hidden bg-white flex flex-col">
              <div className="aspect-video relative overflow-hidden bg-stone-100">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"  decoding="async" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <FileText className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-stone-800 text-[10px] font-bold tracking-wider rounded-full border-none shadow-sm px-3">
                    {post.category}
                  </Badge>
                </div>
                {post.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <div className="w-7 h-7 bg-[var(--brand-green)] rounded-full flex items-center justify-center text-white shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-white" />
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="text-lg font-bold text-stone-900 leading-tight group-hover:text-[var(--brand-green)] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 hover:bg-stone-100 rounded-full">
                        <MoreVertical className="w-4 h-4 text-stone-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-stone-200 shadow-xl p-2 w-48">
                      <DropdownMenuItem onClick={() => handleEditPost(post)} className="rounded-lg text-sm font-medium gap-3 py-2.5">
                        <Edit2 className="w-4 h-4 text-stone-400" /> Edit post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewPost(post)} className="rounded-lg text-sm font-medium gap-3 py-2.5">
                        <Eye className="w-4 h-4 text-stone-400" /> View post
                      </DropdownMenuItem>
                      <div className="h-px bg-stone-100 my-1" />
                      <DropdownMenuItem disabled={isDeleting} onClick={() => handleDelete(post)} className="rounded-lg text-sm font-medium gap-3 py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="w-4 h-4" /> Delete post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-stone-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-5 border-t border-stone-100 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold">{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">{post.readTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
