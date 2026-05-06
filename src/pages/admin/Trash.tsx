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
  Clock
} from 'lucide-react'
import { contentService } from '@/services/contentService'
import { logisticsService } from '@/services/logisticsService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import type { BlogPost, InventoryItem, MediaAsset, Author } from '@/types/admin'

import { PenTool } from 'lucide-react'

type TrashTab = 'blogs' | 'products' | 'media' | 'authors'

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<TrashTab>('blogs')
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
        toast.success('Item restored successfully')
        loadTrash()
      } else {
        toast.error('Failed to restore item')
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
        toast.success('Item permanently deleted')
        setDeleteModal({ isOpen: false, type: null, id: null, name: null })
        loadTrash()
      } else {
        toast.error('Failed to delete item')
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
    return days > 0 ? `${days} days` : 'Expiring soon'
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-on-surface" />
            Trash vault
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">
            Items are retained for 30 days before permanent purging.
          </p>
        </div>
      </div>

      {/* Mobile Tab Dropdown */}
      <div className="lg:hidden mb-8">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TrashTab)}
          className="w-full h-12 bg-white border border-border/40 rounded-sm px-4 text-sm font-bold focus:border-on-surface outline-none shadow-sm"
        >
          <option value="blogs">Blog Posts ({blogs.length})</option>
          <option value="products">Inventory Items ({products.length})</option>
          <option value="media">Media Assets ({media.length})</option>
          <option value="authors">Editorial Authors ({authors.length})</option>
        </select>
      </div>

      {/* Tabs (Desktop Only) */}
      <div className="hidden lg:flex items-center gap-2 mb-8 bg-muted/10 p-1.5 rounded-sm w-fit border border-border/40">
        <Button
          variant={activeTab === 'blogs' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('blogs')}
          className={cn(
            "flex items-center gap-2 px-6 h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'blogs' 
              ? "bg-white text-on-surface shadow-sm border-border/40" 
              : "text-on-surface/40 hover:text-on-surface/60"
          )}
        >
          <FileText className="w-4 h-4" />
          Blog Posts ({blogs.length})
        </Button>
        <Button
          variant={activeTab === 'products' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex items-center gap-2 px-6 h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'products' 
              ? "bg-white text-on-surface shadow-sm border-border/40" 
              : "text-on-surface/40 hover:text-on-surface/60"
          )}
        >
          <Package className="w-4 h-4" />
          Products ({products.length})
        </Button>
        <Button
          variant={activeTab === 'media' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('media')}
          className={cn(
            "flex items-center gap-2 px-6 h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'media' 
              ? "bg-white text-on-surface shadow-sm border-border/40" 
              : "text-on-surface/40 hover:text-on-surface/60"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Media Assets ({media.length})
        </Button>
        <Button
          variant={activeTab === 'authors' ? 'outline' : 'ghost'}
          onClick={() => setActiveTab('authors')}
          className={cn(
            "flex items-center gap-2 px-6 h-10 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'authors' 
              ? "bg-white text-on-surface shadow-sm border-border/40" 
              : "text-on-surface/40 hover:text-on-surface/60"
          )}
        >
          <PenTool className="w-4 h-4" />
          Authors ({authors.length})
        </Button>
      </div>

      {/* Retention Notice */}
      <div className="mb-8 p-4 bg-accent/5 border border-accent/20 rounded-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-on-surface">30-Day Retention Policy</h4>
          <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium leading-relaxed">
            All items moved to the trash are automatically purged after 30 days. Restoration is not possible once an item has been permanently deleted from the vault.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-8 h-8 border-2 border-border/40 border-t-on-surface rounded-full animate-spin" />
            <p className="text-muted-foreground/40 text-xs font-bold uppercase tracking-widest">Scanning vault...</p>
          </div>
        ) : (activeTab === 'blogs' && blogs.length === 0) || 
            (activeTab === 'products' && products.length === 0) || 
            (activeTab === 'media' && media.length === 0) ||
            (activeTab === 'authors' && authors.length === 0) ? (
          <div className="bg-white border border-border/40 rounded-sm p-12 text-center">
            <div className="w-20 h-20 rounded-sm bg-muted/10 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">Trash is empty</h3>
            <p className="text-on-surface/60 text-sm mt-2 max-w-sm mx-auto font-medium">
              Excellent! All movement data is either active or has been permanently archived.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeTab === 'blogs' && blogs.map(post => (
              <TrashItemCard 
                key={post.id}
                title={post.title}
                subtitle={post.category}
                deletedAt={post.deletedAt || new Date().toISOString()}
                onRestore={() => handleRestore('blogs', post.id)}
                onDelete={() => setDeleteModal({ isOpen: true, type: 'blogs', id: post.id, name: post.title })}
                daysRemaining={formatDaysRemaining(post.deletedAt || new Date().toISOString())}
                icon={<FileText className="w-5 h-5" />}
              />
            ))}
            {activeTab === 'products' && products.map(product => (
              <TrashItemCard 
                key={product.id}
                title={product.name}
                subtitle={product.category}
                deletedAt={product.deletedAt || new Date().toISOString()}
                onRestore={() => handleRestore('products', product.id)}
                onDelete={() => setDeleteModal({ isOpen: true, type: 'products', id: product.id, name: product.name })}
                daysRemaining={formatDaysRemaining(product.deletedAt || new Date().toISOString())}
                icon={<Package className="w-5 h-5" />}
              />
            ))}
            {activeTab === 'media' && media.map(item => (
              <TrashItemCard 
                key={item.id}
                title={item.filename}
                subtitle={item.folder}
                deletedAt={item.deleted_at || new Date().toISOString()}
                onRestore={() => handleRestore('media', item.url)}
                onDelete={() => setDeleteModal({ isOpen: true, type: 'media', id: item.url, name: item.filename })}
                daysRemaining={formatDaysRemaining(item.deleted_at || new Date().toISOString())}
                image={item.url}
              />
            ))}
            {activeTab === 'authors' && authors.map(author => (
              <TrashItemCard
                key={author.id}
                title={author.name}
                subtitle={author.role || 'Contributor'}
                deletedAt={author.deletedAt || new Date().toISOString()}
                onRestore={() => handleRestore('authors', author.id)}
                onDelete={() => setDeleteModal({ isOpen: true, type: 'authors', id: author.id, name: author.name })}
                daysRemaining={formatDaysRemaining(author.deletedAt || new Date().toISOString())}
                image={author.imageUrl}
                icon={<PenTool className="w-5 h-5" />}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handlePermanentDelete}
        title="Permanent Deletion"
        description="This action cannot be undone. The item will be permanently removed from the movement's database and cloud storage."
        itemName={deleteModal.name || ''}
        isPermanent={true}
      />
    </div>
  )
}

function TrashItemCard({ 
  title, 
  subtitle, 
  deletedAt, 
  onRestore, 
  onDelete, 
  daysRemaining,
  icon,
  image 
}: { 
  title: string; 
  subtitle: string; 
  deletedAt: string; 
  onRestore: () => void; 
  onDelete: () => void;
  daysRemaining: string;
  icon?: React.ReactNode;
  image?: string;
}) {
  return (
    <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group">
      <CardContent className="p-0">
        <div className="flex h-32">
          {/* Visual Preview */}
          <div className="w-32 bg-muted/10 flex items-center justify-center shrink-0 border-r border-border/40 overflow-hidden">
            {image ? (
              <img src={image} alt="" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all"  decoding="async" loading="lazy" />
            ) : (
              <div className="text-muted-foreground/40">{icon}</div>
            )}
          </div>
          
          <div className="flex-1 p-5 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate">{subtitle}</p>
                <div className="flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  <Calendar className="w-2.5 h-2.5" />
                  {daysRemaining} left
                </div>
              </div>
              <h4 className="font-bold text-on-surface truncate leading-tight">{title}</h4>
              <p className="text-[10px] text-muted-foreground/40 mt-1 flex items-center gap-1">
                <Trash className="w-3 h-3" />
                Deleted {new Date(deletedAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <Button 
                onClick={onRestore}
                variant="outline" 
                size="sm" 
                className="flex-1 h-9 rounded-sm border-border/40 text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Item
              </Button>
              <Button 
                onClick={onDelete}
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-sm border border-border/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
