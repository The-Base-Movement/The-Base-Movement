import { useState, useEffect, useCallback } from 'react'
import { contentService } from '@/services/contentService'
import { logisticsService } from '@/services/logisticsService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import type { BlogPost, InventoryItem, MediaAsset, Author } from '@/types/admin'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

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
      setBlogs(trashedBlogs || [])
      setProducts(trashedProducts || [])
      setMedia(trashedMedia || [])
      setAuthors(trashedAuthors || [])
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
    let items: (BlogPost | InventoryItem | MediaAsset | Author)[] = []
    if (activeTab === 'blogs') items = blogs
    else if (activeTab === 'products') items = products
    else if (activeTab === 'media') items = media
    else if (activeTab === 'authors') items = authors

    if (!searchQuery) return items
    
    return items.filter(item => {
      const r = item as unknown as Record<string, unknown>
      const name = String(r['title'] ?? r['name'] ?? r['filename'] ?? '')
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="main animate-in fade-in duration-500">
      <div className="top">
        <div>
          <div className="crumbs">Platform · Strategic Oversight</div>
          <h2 style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>delete</span>
            Trash vault
          </h2>
          <div style={{ marginTop: 12 }}><div className="bl"><div /><div /><div /></div></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
            Staging area for decommissioned assets and intelligence records awaiting purge.
          </p>
        </div>
      </div>

      <div className="kpis">
        <TacticalKPI 
          label="Total archived"
          value={blogs.length + products.length + media.length + authors.length}
          description="Awaiting purge"
          variant="black"
        />
        <TacticalKPI 
          label="Retention"
          value="30 Days"
          description="Security protocol"
          variant="red"
        />
        <TacticalKPI 
          label="Active sector"
          value={activeTab === 'blogs' ? 'Editorial' : activeTab === 'products' ? 'Logistics' : activeTab === 'media' ? 'Assets' : 'Personnel'}
          description="Context segment"
          variant="gold"
        />
        <TacticalKPI 
          label="Purge status"
          value="Online"
          description="Decommissioning active"
          variant="green"
        />
      </div>

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80, width: 280, flexShrink: 0 }}>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '12px 18px' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(var(--on-surface-muted))' }}>Vault sectors</span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                onClick={() => setActiveTab('blogs')}
                className={cn("btn w-full", activeTab === 'blogs' ? "btn-primary" : "btn-outline")}
                style={{ justifyContent: 'flex-start', padding: '0 16px', height: 48 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>article</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Blog intelligence</span>
                <span className="pill" style={{ background: 'rgba(0,0,0,0.1)', fontSize: 10 }}>{blogs.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={cn("btn w-full", activeTab === 'products' ? "btn-primary" : "btn-outline")}
                style={{ justifyContent: 'flex-start', padding: '0 16px', height: 48 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Logistics store</span>
                <span className="pill" style={{ background: 'rgba(0,0,0,0.1)', fontSize: 10 }}>{products.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={cn("btn w-full", activeTab === 'media' ? "btn-primary" : "btn-outline")}
                style={{ justifyContent: 'flex-start', padding: '0 16px', height: 48 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>image</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Visual assets</span>
                <span className="pill" style={{ background: 'rgba(0,0,0,0.1)', fontSize: 10 }}>{media.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('authors')}
                className={cn("btn w-full", activeTab === 'authors' ? "btn-primary" : "btn-outline")}
                style={{ justifyContent: 'flex-start', padding: '0 16px', height: 48 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history_edu</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Editorial roster</span>
                <span className="pill" style={{ background: 'rgba(0,0,0,0.1)', fontSize: 10 }}>{authors.length}</span>
              </button>
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '12px 18px' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(var(--on-surface-muted))' }}>Vault scanner</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                <input name="searchQuery" id="input-ddd0f6"
                  type="text"
                  placeholder="Scan keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', height: 38, paddingLeft: 34, paddingRight: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', borderRadius: 4, outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, boxSizing: 'border-box', color: 'hsl(var(--on-surface))' }}
                />
              </div>
              <div style={{ background: 'rgba(206, 17, 38, 0.05)', borderRadius: 4, padding: 14, border: '1px solid rgba(206, 17, 38, 0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}>report_problem</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, color: 'hsl(var(--destructive))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical awareness</span>
                </div>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--destructive))', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                  Permanent deletion occurs at T-0. Records cannot be recovered once purged.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 20 }}>
              <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--destructive))', borderRadius: '50%' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', margin: 0 }}>Syncing vault sectors</p>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Accessing restricted archival blocks...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="panel" style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, borderStyle: 'dashed', background: 'transparent' }}>
              <div style={{ width: 80, height: 80, borderRadius: 4, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid hsl(var(--border))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}>archive</span>
              </div>
              <div style={{ maxWidth: 360 }}>
                <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 24, color: 'hsl(var(--on-surface))', margin: 0 }}>Vault sector clear</h3>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'hsl(var(--on-surface-muted))', marginTop: 8, lineHeight: 1.6 }}>
                  No records currently match your scan parameters. The sector is clear or filters are overly restrictive.
                </p>
              </div>
              <button className="btn btn-outline" onClick={() => setSearchQuery('')}>Reset scanner filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
              {activeTab === 'blogs' && (filteredItems as BlogPost[]).map(post => (
                <TrashCard 
                  key={post.id}
                  title={post.title}
                  subtitle={post.category}
                  type="Blog post"
                  deletedAt={post.deletedAt || new Date().toISOString()}
                  daysLeft={formatDaysRemaining(post.deletedAt || new Date().toISOString())}
                  onRestore={() => handleRestore('blogs', post.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'blogs', id: post.id, name: post.title })}
                  icon="article"
                  accent="red"
                />
              ))}
              {activeTab === 'products' && (filteredItems as InventoryItem[]).map(product => (
                <TrashCard 
                  key={product.id}
                  title={product.name}
                  subtitle={product.category}
                  type="Inventory"
                  deletedAt={product.deletedAt || new Date().toISOString()}
                  daysLeft={formatDaysRemaining(product.deletedAt || new Date().toISOString())}
                  onRestore={() => handleRestore('products', product.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'products', id: product.id, name: product.name })}
                  icon="inventory_2"
                  accent="gold"
                />
              ))}
              {activeTab === 'media' && (filteredItems as MediaAsset[]).map(item => (
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
              {activeTab === 'authors' && (filteredItems as Author[]).map(author => (
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
                  icon="history_edu"
                  accent="red"
                />
              ))}
            </div>
          )}
        </main>
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
  icon?: string;
  image?: string;
  accent?: 'red' | 'gold' | 'green'
}) {
  const isExpiringSoon = daysLeft <= 7;

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', minHeight: 160 }}>
        {/* Visual ID Overlay */}
        <div style={{ width: 140, position: 'relative', overflow: 'hidden', background: 'hsl(var(--container-low))', borderRight: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {image ? (
            <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.1 }}>{icon}</span>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: accent === 'red' ? 'hsl(var(--destructive))' : accent === 'gold' ? 'hsl(var(--accent))' : 'hsl(var(--primary))' }} />
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span className="pill" style={{ background: 'hsl(var(--on-surface))', color: '#fff', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px' }}>
              {type}
            </span>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</p>
                <h4 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 16, color: 'hsl(var(--on-surface))', margin: '4px 0 0', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
              </div>
              
              <div style={{ padding: '8px 12px', borderRadius: 4, background: isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--container-low))', border: `1px solid ${isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`, textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: isExpiringSoon ? '#fff' : 'hsl(var(--on-surface))', lineHeight: 1 }}>{daysLeft}</div>
                <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: isExpiringSoon ? 'rgba(255,255,255,0.8)' : 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Days left</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>history</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>Deleted {new Date(deletedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
            <button 
              onClick={onRestore}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings_backup_restore</span>
              Restore
            </button>
            <button 
              onClick={onDelete}
              className="btn btn-dest btn-sm"
              style={{ width: 40, padding: 0, justifyContent: 'center' }}
              title="Permanent purge"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_forever</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
