import { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye,
  Globe,
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
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
import { adminService } from '@/services/adminService'
import type { BlogPost } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'

export default function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [_isDeleting, setIsDeleting] = useState(false)
  const [editingPost, setEditPost] = useState<BlogPost | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // Form State
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>({
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
    metaDescription: ''
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
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
  }

  const handleOpenDialog = (post?: BlogPost) => {
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
        metaDescription: post.metaDescription || ''
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
        metaDescription: ''
      })
    }
    setIsDialogOpen(true)
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
          title: editingPost ? "INTEL UPDATED" : "INTEL PUBLISHED",
          description: `Policy brief "${formData.title}" has been synchronized.`,
        })
        setIsDialogOpen(false)
        fetchPosts()
      }
    } catch (error) {
      toast({
        title: "TRANSMISSION FAILED",
        description: "Failed to persist blog data to the movement vault.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Are you sure you want to expunge "${post.title}" from the records?`)) return

    setIsDeleting(true)
    try {
      const success = await adminService.deleteBlogPost(post.id, post.slug)
      if (success) {
        toast({
          title: "RECORD EXPUNGED",
          description: "The article has been permanently removed from the public eye.",
        })
        fetchPosts()
      }
    } catch (error) {
      toast({
        title: "DELETION FAILED",
        description: "The intelligence remains in the vault due to a system error.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter leading-none">Insights Management</h1>
          <p className="text-stone-500 text-sm mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--brand-green)] rounded-full animate-pulse" />
            Propagating movement ideology through analysis.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="h-12 px-6 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Brief
        </Button>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-stone-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search movement insights..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-stone-50 border-none text-[10px] font-bold uppercase tracking-tight placeholder:text-stone-400 focus:ring-1 focus:ring-[var(--brand-gold)] transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="h-10 w-[140px] bg-stone-50 border-none text-[10px] font-black uppercase tracking-widest">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              <SelectItem value="Movement">Movement</SelectItem>
              <SelectItem value="Youth">Youth</SelectItem>
              <SelectItem value="Economy">Economy</SelectItem>
              <SelectItem value="Diaspora">Diaspora</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-[var(--brand-red)] hover:bg-rose-50">
            Audit Archive
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="rounded-none border-stone-100 animate-pulse">
              <div className="h-48 bg-stone-100" />
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-stone-100 w-3/4" />
                <div className="h-4 bg-stone-100 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border border-dashed border-stone-200">
            <FileText className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">No Intelligence Found</h3>
            <p className="text-xs text-stone-400 mt-1">Refine your search or deploy a new policy brief.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="rounded-none border-stone-200 group hover:border-[var(--brand-gold)] transition-all overflow-hidden bg-white">
              <div className="aspect-video relative overflow-hidden bg-stone-100">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <FileText className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-[var(--brand-black)] text-white text-[8px] font-black uppercase tracking-widest rounded-none border-none">
                    {post.category}
                  </Badge>
                </div>
                {post.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-[var(--brand-gold)] flex items-center justify-center text-white">
                      <Plus className="w-3 h-3 rotate-45" />
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black font-meta text-[var(--brand-black)] uppercase tracking-tight leading-tight group-hover:text-[var(--brand-green)] transition-colors">
                    {post.title}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none font-meta">
                      <DropdownMenuItem onClick={() => handleOpenDialog(post)} className="text-[10px] font-bold uppercase tracking-widest gap-2">
                        <Edit2 className="w-3 h-3" /> Edit Intelligence
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest gap-2">
                        <Eye className="w-3 h-3" /> Preview Brief
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(post)} className="text-[10px] font-bold uppercase tracking-widest gap-2 text-[var(--brand-red)]">
                        <Trash2 className="w-3 h-3" /> Expunge Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-stone-500 text-xs line-clamp-2 mb-6 font-medium leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span className="text-[9px] font-bold text-stone-400 uppercase">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span className="text-[9px] font-bold text-stone-400 uppercase">{post.readTime}</span>
                    </div>
                  </div>
                  <div className="flex -space-x-1">
                    {post.tags.slice(0, 2).map(tag => (
                      <div key={tag} className="w-4 h-4 rounded-full bg-stone-100 border border-white flex items-center justify-center">
                        <Tag className="w-2 h-2 text-stone-400" />
                      </div>
                    ))}
                    {post.tags.length > 2 && (
                      <div className="text-[8px] font-bold text-stone-400 ml-2">+{post.tags.length - 2}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Deployment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border-stone-200 p-0 font-meta">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-8 bg-[var(--brand-black)] text-white border-b border-white/10">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {editingPost ? 'Edit Movement Intelligence' : 'Draft New Policy Brief'}
              </DialogTitle>
              <DialogDescription className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">
                Establish the narrative. All communications must align with the national agenda.
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-10 bg-white">
              {/* Core Intel */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                  <FileText className="w-4 h-4 text-[var(--brand-green)]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Core Intelligence</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Article Title</Label>
                    <Input 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., THE INDUSTRIALIZATION OF THE NORTH" 
                      className="rounded-none border-stone-200 h-12 text-sm font-bold placeholder:text-stone-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Resource Identifier (Slug)</Label>
                    <Input 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="the-industrialization-of-the-north" 
                      className="rounded-none border-stone-200 h-12 text-sm font-bold placeholder:text-stone-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Sector/Category</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(val) => setFormData({...formData, category: val})}
                    >
                      <SelectTrigger className="rounded-none border-stone-200 h-12 text-xs font-bold uppercase tracking-tight">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="font-meta">
                        <SelectItem value="Movement">Movement</SelectItem>
                        <SelectItem value="Youth">Youth</SelectItem>
                        <SelectItem value="Economy">Economy</SelectItem>
                        <SelectItem value="Diaspora">Diaspora</SelectItem>
                        <SelectItem value="Integrity">Integrity</SelectItem>
                        <SelectItem value="Community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Featured Image URL</Label>
                    <Input 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/..." 
                      className="rounded-none border-stone-200 h-12 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Est. Read Time</Label>
                    <Input 
                      value={formData.readTime}
                      onChange={(e) => setFormData({...formData, readTime: e.target.value})}
                      placeholder="5 min read" 
                      className="rounded-none border-stone-200 h-12 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Strategic Excerpt</Label>
                  <Textarea 
                    required
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    placeholder="Brief summary for list cards..." 
                    className="rounded-none border-stone-200 min-h-[100px] text-xs font-medium leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Main Content (Markdown/HTML)</Label>
                  <Textarea 
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="The full analysis..." 
                    className="rounded-none border-stone-200 min-h-[300px] text-xs font-medium leading-relaxed"
                  />
                </div>
              </div>

              {/* SEO & Optimization */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Globe className="w-4 h-4 text-[var(--brand-gold)]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">SEO & Transmission Optimization</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">SEO Meta Title</Label>
                    <Input 
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                      placeholder="Title for search engines..." 
                      className="rounded-none border-stone-200 h-12 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Keywords/Tags (Comma Separated)</Label>
                    <Input 
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                      placeholder="ghana, industry, jobs, movement" 
                      className="rounded-none border-stone-200 h-12 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">SEO Meta Description</Label>
                  <Textarea 
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                    placeholder="Brief description for search result snippets..." 
                    className="rounded-none border-stone-200 min-h-[80px] text-xs font-medium leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={formData.isFeatured}
                      onCheckedChange={(val) => setFormData({...formData, isFeatured: val})}
                    />
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-900">Featured Intelligence</Label>
                      <p className="text-[8px] font-bold text-stone-400 uppercase tracking-tight">Pin this brief to the top of the insights feed.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-[var(--brand-gold)]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--brand-gold)]">High Visibility</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 bg-stone-50 border-t border-stone-100 sm:justify-between flex-row items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-stone-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Ready for propagation</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 sm:flex-none h-12 px-8 rounded-none border-stone-200 text-[10px] font-black uppercase tracking-widest hover:bg-stone-100"
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 sm:flex-none h-12 px-8 rounded-none bg-[var(--brand-green)] text-white hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest"
                >
                  {isLoading ? 'SYNCHRONIZING...' : editingPost ? 'Update Vault' : 'Deploy Intelligence'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
