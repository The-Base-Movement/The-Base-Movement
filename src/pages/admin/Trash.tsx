import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  FileText, 
  Package, 
  Image as ImageIcon,
  Calendar,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  History,
  Archive,
  AlertCircle,
  LayoutGrid,
  ChevronRight
} from 'lucide-react'
import { contentService } from '@/services/contentService'
import { logisticsService } from '@/services/logisticsService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import type { BlogPost, InventoryItem, MediaAsset, Author } from '@/types/admin'
import { BrandLine } from '@/components/ui/BrandLine'
import { PenTool } from 'lucide-react'

type TrashTab = 'blogs' | 'products' | 'media' | 'authors'

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<TrashTab>('blogs')
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: TrashTab | null;
    id: string | null;
    name: string | null;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: null
  })

  const loadTrash = useCallback(async () => {
    setIsLoading(true)
    try {
      const [trashedBlogs, trashedProducts, trashedMedia, trashedAuthors] = await Promise.all([
        contentService.getTrashedBlogPosts(),
        logisticsService.getTrashedInventory(),
        contentService.getTrashedMedia(),
        contentService.getTrashedAuthors()
      ])
      setBlogs(trashedBlogs)
      setProducts(trashedProducts)
      setMedia(trashedMedia)
      setAuthors(trashedAuthors)
    } catch {
      toast.error('Failed to load trash contents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrash()
  }, [loadTrash])

  const handleRestore = async (type: TrashTab, idOrUrl: string) => {
    try {
      let success = false
      if (type === 'blogs') success = await contentService.restoreBlogPost(idOrUrl)
      if (type === 'products') success = await logisticsService.restoreInventoryItem(idOrUrl)
      if (type === 'media') success = await contentService.restoreMediaFile(idOrUrl)
      if (type === 'authors') success = await contentService.restoreAuthor(idOrUrl)

      if (success) {
        toast.success('Item successfully reintegrated into active operations')
        loadTrash()
      } else {
        toast.error('Restoration protocol failed')
      }
    } catch {
      toast.error('An error occurred during restoration')
    }
  }

  const handlePermanentDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return

    try {
      let success = false
      if (deleteModal.type === 'blogs') success = await contentService.permanentlyDeleteBlogPost(deleteModal.id)
      if (deleteModal.type === 'products') success = await logisticsService.permanentlyDeleteInventoryItem(deleteModal.id)
      if (deleteModal.type === 'media') success = await contentService.permanentlyDeleteMediaFile(deleteModal.id)
      if (deleteModal.type === 'authors') success = await contentService.permanentlyDeleteAuthor(deleteModal.id)

      if (success) {
        toast.success('Record purged permanently')
        setDeleteModal({ isOpen: false, type: null, id: null, name: null })
        loadTrash()
      } else {
        toast.error('Decommissioning sequence failed')
      }
    } catch {
      toast.error('An error occurred during deletion')
    }
  }

  const formatDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt)
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diff = expiryDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const getFilteredItems = () => {
    let items: any[] = []
    if (activeTab === 'blogs') items = blogs
    else if (activeTab === 'products') items = products
    else if (activeTab === 'media') items = media
    else if (activeTab === 'authors') items = authors

    if (!searchQuery) return items
    
    return items.filter(item => {
      const name = item.title || item.name || item.filename || ''
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Trash2 className="w-8 h-8 text-on-surface" />
            Trash vault
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Staging area for decommissioned assets and intelligence records awaiting purge.</p>
        </div>
        
        <div className="bg-stone-50/80 backdrop-blur-sm rounded-sm px-8 py-5 border border-stone-200/60 flex items-center gap-8 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-on-surface/60 uppercase">Retention protocol</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-on-surface">30</span>
              <span className="text-micro font-bold text-on-surface/40">Days</span>
            </div>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div className="flex items-center gap-2 text-xs font-bold text-destructive">
            <ShieldAlert className="w-5 h-5" />
            Purge sequence active
          </div>
        </div>
      </div>

      {/* Main Layout Grid with Sticky Aside */}
      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* Sticky Filter Sidebar */}
        <aside className="w-full lg:w-80 sticky lg:top-32 space-y-6 shrink-0 z-30">
          <div className="glass-card p-6 rounded-sm shadow-xl border border-stone-200/60 space-y-8 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold tracking-tight text-on-surface/40 flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Sector selection
                </h3>
              </div>
              <nav className="flex flex-col gap-1.5">
                <TabButton 
                  active={activeTab === 'blogs'} 
                  onClick={() => setActiveTab('blogs')} 
                  icon={<FileText className="w-4 h-4" />} 
                  label="Blog intelligence" 
                  count={blogs.length}
                />
                <TabButton 
                  active={activeTab === 'products'} 
                  onClick={() => setActiveTab('products')} 
                  icon={<Package className="w-4 h-4" />} 
                  label="Logistics store" 
                  count={products.length}
                />
                <TabButton 
                  active={activeTab === 'media'} 
                  onClick={() => setActiveTab('media')} 
                  icon={<ImageIcon className="w-4 h-4" />} 
                  label="Visual assets" 
                  count={media.length}
                />
                <TabButton 
                  active={activeTab === 'authors'} 
                  onClick={() => setActiveTab('authors')} 
                  icon={<PenTool className="w-4 h-4" />} 
                  label="Editorial roster" 
                  count={authors.length}
                />
              </nav>
            </div>
            
            <div className="pt-8 border-t border-stone-100 space-y-4">
              <h3 className="text-xs font-bold tracking-tight text-on-surface/40 flex items-center gap-2 px-2">
                <Search className="w-3.5 h-3.5" />
                Vault scanner
              </h3>
              <div className="relative group/search">
                <div className="absolute inset-0 bg-stone-100 rounded-sm group-focus-within/search:bg-white group-focus-within/search:ring-2 group-focus-within/search:ring-destructive/10 transition-all duration-300"></div>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20 group-focus-within/search:text-destructive/40 transition-colors z-10" />
                <input 
                  type="text"
                  placeholder="Scan keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="relative w-full h-12 pl-11 pr-4 bg-transparent border-none focus:ring-0 text-sm font-bold text-on-surface placeholder:text-on-surface/20 z-10"
                />
              </div>
            </div>

            {/* Tactical Status */}
            <div className="pt-4 px-2">
              <div className="bg-destructive/5 rounded-sm p-5 border border-destructive/10 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-xs font-bold text-destructive tracking-tight uppercase">Critical awareness</p>
                </div>
                <p className="text-tiny font-bold text-destructive leading-relaxed">
                  Permanent deletion occurs automatically at T-0. Records cannot be recovered once the purge protocol completes.
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Intelligence Card */}
          <div className="glass-card p-6 rounded-sm border border-stone-100 bg-stone-50/50 space-y-4 shadow-sm group">
            <h4 className="text-micro font-bold tracking-tight text-on-surface/40 uppercase">Archival Guide</h4>
            <p className="text-tiny font-medium text-on-surface/60 leading-relaxed">
              Use the vault scanner to locate specific personnel files or media assets slated for removal.
            </p>
            <Button variant="ghost" className="w-full justify-between h-9 px-0 text-micro font-bold tracking-tight text-on-surface hover:bg-transparent group-hover:text-destructive transition-colors">
              Read security protocols <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </aside>

        {/* Main Content Sector */}
        <div className="flex-1 min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-stone-100 rounded-none"></div>
                <div className="absolute inset-0 border-4 border-destructive border-t-transparent rounded-none animate-spin"></div>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs font-bold tracking-tight text-on-surface/20">Syncing vault sectors</p>
                <p className="text-micro font-bold text-on-surface/40">Accessing restricted archival blocks...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass-card rounded-sm p-24 text-center space-y-8 border-dashed border-2 border-stone-200 animate-in zoom-in-95 duration-500 bg-white">
              <div className="w-24 h-24 rounded-sm bg-stone-50 flex items-center justify-center mx-auto border border-stone-100 shadow-inner group-hover:scale-110 transition-transform">
                <Archive className="w-10 h-10 text-stone-200" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-on-surface tracking-tight">Vault sector clear</h3>
                <p className="text-on-surface/40 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                  No records currently match your scan parameters. The sector is clear or filters are overly restrictive.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="h-12 px-10 rounded-sm text-micro font-bold tracking-tight border-stone-200 hover:border-destructive/30 hover:bg-destructive/5 transition-all shadow-sm"
              >
                Reset scanner filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-700">
              {activeTab === 'blogs' && blogs.map(post => (
                <TrashCard 
                  key={post.id}
                  title={post.title}
                  subtitle={post.category}
                  type="Blog post"
                  deletedAt={post.deletedAt || new Date().toISOString()}
                  daysLeft={formatDaysRemaining(post.deletedAt || new Date().toISOString())}
                  onRestore={() => handleRestore('blogs', post.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'blogs', id: post.id, name: post.title })}
                  icon={<FileText className="w-6 h-6" />}
                  accent="red"
                />
              ))}
              {activeTab === 'products' && products.map(product => (
                <TrashCard 
                  key={product.id}
                  title={product.name}
                  subtitle={product.category}
                  type="Inventory"
                  deletedAt={product.deletedAt || new Date().toISOString()}
                  daysLeft={formatDaysRemaining(product.deletedAt || new Date().toISOString())}
                  onRestore={() => handleRestore('products', product.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'products', id: product.id, name: product.name })}
                  icon={<Package className="w-6 h-6" />}
                  accent="gold"
                />
              ))}
              {activeTab === 'media' && media.map(item => (
                <TrashCard 
                  key={item.id}
                  title={item.filename}
                  subtitle={item.folder}
                  type="Media asset"
                  image={item.url}
                  deletedAt={item.deleted_at || new Date().toISOString()}
                  daysLeft={formatDaysRemaining(item.deleted_at || new Date().toISOString())}
                  onRestore={() => handleRestore('media', item.url)}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'media', id: item.url, name: item.filename })}
                  accent="green"
                />
              ))}
              {activeTab === 'authors' && authors.map(author => (
                <TrashCard
                  key={author.id}
                  title={author.name}
                  subtitle={author.role || 'Contributor'}
                  type="Personnel"
                  image={author.imageUrl}
                  deletedAt={author.deletedAt || new Date().toISOString()}
                  daysLeft={formatDaysRemaining(author.deletedAt || new Date().toISOString())}
                  onRestore={() => handleRestore('authors', author.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'authors', id: author.id, name: author.name })}
                  icon={<PenTool className="w-6 h-6" />}
                  accent="red"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handlePermanentDelete}
        title="Final decommissioning"
        description="Attention: This record will be permanently purged from all movement databases. This action is irreversible and follows strict security protocols."
        itemName={deleteModal.name || ''}
        isPermanent={true}
      />
    </div>
  )
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-4 rounded-sm transition-all duration-300 active:scale-95 group relative w-full border",
        active 
          ? "bg-white border-stone-200 text-on-surface shadow-md ring-1 ring-stone-100" 
          : "bg-transparent border-transparent text-on-surface/40 hover:text-on-surface/70 hover:bg-stone-50/50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-500",
        active ? "bg-stone-50 text-destructive shadow-sm scale-110" : "bg-stone-100/50 text-on-surface/20 group-hover:text-on-surface/40"
      )}>
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className={cn("text-tiny font-bold tracking-tight leading-none mb-1", active ? "text-on-surface" : "text-on-surface/60")}>{label}</p>
        <p className={cn("text-micro font-bold tracking-tight", active ? "text-destructive" : "text-on-surface/20")}>{count} Units</p>
      </div>
      {active && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive shadow-lg shadow-destructive/40" />
        </div>
      )}
    </button>
  )
}

function TrashCard({ 
  title, 
  subtitle, 
  type,
  deletedAt, 
  onRestore, 
  onDelete, 
  daysLeft,
  icon,
  image,
  accent = 'red'
}: { 
  title: string; 
  subtitle: string; 
  type: string;
  deletedAt: string; 
  onRestore: () => void; 
  onDelete: () => void;
  daysLeft: number;
  icon?: React.ReactNode;
  image?: string;
  accent?: 'red' | 'gold' | 'green'
}) {
  const isExpiringSoon = daysLeft <= 7;

  return (
    <Card className="rounded-sm border border-stone-200/60 overflow-hidden bg-white hover:shadow-2xl hover:border-stone-400 transition-all duration-500 group relative">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row min-h-[160px]">
          {/* Visual ID Overlay */}
          <div className="w-full sm:w-40 relative overflow-hidden bg-stone-50 border-r border-stone-100 flex items-center justify-center shrink-0">
            {image ? (
              <img src={image} alt="" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"  decoding="async" loading="lazy" />
            ) : (
              <div className="text-on-surface/10 group-hover:text-on-surface/30 transition-colors transform group-hover:scale-125 duration-500">{icon}</div>
            )}
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 transition-all duration-500 group-hover:h-1.5",
              accent === 'red' ? "bg-destructive" : accent === 'gold' ? "bg-accent" : "bg-primary"
            )} />
            <div className="absolute top-4 left-4">
              <span className="text-micro font-bold tracking-tight text-white bg-on-surface/90 px-3 py-1 rounded-none backdrop-blur-sm border border-white/10 uppercase">
                {type}
              </span>
            </div>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-micro font-bold text-on-surface/30 tracking-tight">{subtitle}</p>
                  <h4 className="text-lg font-bold text-on-surface leading-tight tracking-tight">{title}</h4>
                </div>
                
                <div className={cn(
                  "px-4 py-3 rounded-sm flex flex-col items-center justify-center min-w-[80px] border transition-all duration-300",
                  isExpiringSoon 
                    ? "bg-destructive border-destructive text-white shadow-lg shadow-destructive/20" 
                    : "bg-stone-50 border-stone-200 text-on-surface"
                )}>
                  <span className={cn(
                    "text-3xl font-bold tabular-nums leading-none tracking-tighter",
                    isExpiringSoon ? "text-white" : "text-on-surface"
                  )}>{daysLeft}</span>
                  <span className={cn(
                    "text-micro font-bold tracking-tight uppercase mt-1",
                    isExpiringSoon ? "text-white/80" : "text-on-surface/40"
                  )}>Days left</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-micro font-bold text-on-surface/30">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Deleted {new Date(deletedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  ID: {Math.random().toString(36).substring(7).toUpperCase()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-stone-50">
              <Button 
                onClick={onRestore}
                variant="outline" 
                className="flex-1 h-12 rounded-sm border-stone-200 text-micro font-bold tracking-tight hover:bg-stone-50 hover:text-primary hover:border-primary/30 gap-2 transition-all active:scale-95 group/btn"
              >
                <RotateCcw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                Restore record
              </Button>
              <Button 
                onClick={onDelete}
                variant="ghost" 
                className="h-12 w-12 rounded-sm border border-stone-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95"
                title="Permanent purge"
              >
                <AlertCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
