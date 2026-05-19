import { useState, useEffect, useCallback } from 'react'
import { contentService } from '@/services/contentService'
import { logisticsService } from '@/services/logisticsService'
import { adminService, type Member } from '@/services/adminService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import type { BlogPost, InventoryItem, MediaAsset, Author } from '@/types/admin'

type TrashTab = 'blogs' | 'products' | 'media' | 'authors' | 'members'

const TABS: { value: TrashTab; label: string; icon: string }[] = [
  { value: 'blogs', label: 'Blog posts', icon: 'article' },
  { value: 'products', label: 'Products', icon: 'inventory_2' },
  { value: 'media', label: 'Media', icon: 'image' },
  { value: 'authors', label: 'Authors', icon: 'history_edu' },
  { value: 'members', label: 'Members', icon: 'person_remove' },
]

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<TrashTab>('blogs')
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkRestoring, setIsBulkRestoring] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: TrashTab | null
    id: string | null
    name: string | null
  }>({ isOpen: false, type: null, id: null, name: null })

  const loadTrash = useCallback(async () => {
    setIsLoading(true)
    try {
      const [trashedBlogs, trashedProducts, trashedMedia, trashedAuthors, trashedMembers] =
        await Promise.all([
          contentService.getTrashedBlogPosts(),
          logisticsService.getTrashedInventory(),
          contentService.getTrashedMedia(),
          contentService.getTrashedAuthors(),
          adminService.getTrashedMembers(),
        ])
      setBlogs(trashedBlogs || [])
      setProducts(trashedProducts || [])
      setMedia(trashedMedia || [])
      setAuthors(trashedAuthors || [])
      setMembers(trashedMembers || [])
    } catch {
      toast.error('Failed to load trash.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrash()
  }, [loadTrash])

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set())
  }, [activeTab])

  const handleRestore = async (type: TrashTab, idOrUrl: string) => {
    try {
      let success = false
      if (type === 'blogs') success = await contentService.restoreBlogPost(idOrUrl)
      if (type === 'products') success = await logisticsService.restoreInventoryItem(idOrUrl)
      if (type === 'media') success = await contentService.restoreMediaFile(idOrUrl)
      if (type === 'authors') success = await contentService.restoreAuthor(idOrUrl)
      if (type === 'members') success = await adminService.restoreMember(idOrUrl)
      if (success) {
        toast.success('Item restored.')
        loadTrash()
      } else toast.error('Restore failed. Try again.')
    } catch {
      toast.error('Restore failed. Try again.')
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return
    setIsBulkRestoring(true)
    let successCount = 0
    for (const id of Array.from(selectedIds)) {
      let success = false
      try {
        if (activeTab === 'blogs') success = await contentService.restoreBlogPost(id)
        if (activeTab === 'products') success = await logisticsService.restoreInventoryItem(id)
        if (activeTab === 'media') success = await contentService.restoreMediaFile(id)
        if (activeTab === 'authors') success = await contentService.restoreAuthor(id)
        if (activeTab === 'members') success = await adminService.restoreMember(id)
      } catch {
        /* continue */
      }
      if (success) successCount++
    }
    setIsBulkRestoring(false)
    setSelectedIds(new Set())
    toast.success(`${successCount} of ${selectedIds.size} items restored.`)
    loadTrash()
  }

  const handlePermanentDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return
    try {
      let success = false
      if (deleteModal.type === 'blogs')
        success = await contentService.permanentlyDeleteBlogPost(deleteModal.id)
      if (deleteModal.type === 'products')
        success = await logisticsService.permanentlyDeleteInventoryItem(deleteModal.id)
      if (deleteModal.type === 'media')
        success = await contentService.permanentlyDeleteMediaFile(deleteModal.id)
      if (deleteModal.type === 'authors')
        success = await contentService.permanentlyDeleteAuthor(deleteModal.id)
      if (deleteModal.type === 'members')
        success = await adminService.permanentlyDeleteMember(deleteModal.id)
      if (success) {
        toast.success('Deleted permanently.')
        setDeleteModal({ isOpen: false, type: null, id: null, name: null })
        loadTrash()
      } else {
        toast.error('Delete failed. Try again.')
      }
    } catch {
      toast.error('Delete failed. Try again.')
    }
  }

  const formatDaysRemaining = (deletedAt: string) => {
    const expiryDate = new Date(new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    return Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const countFor = (tab: TrashTab) =>
    tab === 'blogs'
      ? blogs.length
      : tab === 'products'
        ? products.length
        : tab === 'media'
          ? media.length
          : tab === 'authors'
            ? authors.length
            : members.length

  const getFilteredItems = () => {
    const items: (BlogPost | InventoryItem | MediaAsset | Author | Member)[] =
      activeTab === 'blogs'
        ? blogs
        : activeTab === 'products'
          ? products
          : activeTab === 'media'
            ? media
            : activeTab === 'authors'
              ? authors
              : members
    if (!searchQuery) return items
    return items.filter((item) => {
      const r = item as unknown as Record<string, unknown>
      return String(r['title'] ?? r['name'] ?? r['filename'] ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    })
  }

  const filteredItems = getFilteredItems()
  const total = blogs.length + products.length + media.length + authors.length + members.length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const allFilteredIds = filteredItems.map(
    (item) => (item as unknown as Record<string, unknown>)['id'] as string
  )
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
  }

  return (
    <div className="main">
      <div className="top" style={{ marginBottom: 18 }}>
        <div>
          <div className="crumbs">Platform · Trash</div>
          <h2 style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              delete
            </span>
            Trash
          </h2>
          <div style={{ marginTop: 12 }}>
            <div className="bl">
              <div />
              <div />
              <div />
            </div>
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 8,
            }}
          >
            Deleted items are kept for 30 days, then removed forever.
          </p>
        </div>
      </div>

      {/* KPI row — horizontally scrollable */}
      <div
        className="thin-scroll"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          marginBottom: 20,
          paddingBottom: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
          {[
            {
              label: 'Total in trash',
              value: isLoading ? '—' : total.toString(),
              icon: 'delete',
              bar: 'hsl(var(--on-surface))',
            },
            {
              label: 'Kept for',
              value: '30 days',
              icon: 'schedule',
              bar: 'hsl(var(--destructive))',
            },
            {
              label: 'Viewing',
              value: isLoading ? '—' : (TABS.find((t) => t.value === activeTab)?.label ?? ''),
              icon: 'folder_open',
              bar: 'hsl(var(--accent))',
            },
            { label: 'Status', value: 'Ready', icon: 'check_circle', bar: 'hsl(var(--primary))' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="panel"
              style={{
                width: 200,
                flexShrink: 0,
                padding: '14px 16px 14px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: kpi.bar,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0,
                  }}
                >
                  {kpi.label}
                </p>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                >
                  {kpi.icon}
                </span>
              </div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal tab strip */}
      <div
        className="mobile-only thin-scroll"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          marginBottom: 16,
          paddingBottom: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn('btn btn-sm', activeTab === tab.value ? 'btn-primary' : 'btn-outline')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {tab.icon}
              </span>
              {tab.label}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background:
                    activeTab === tab.value ? 'rgba(255,255,255,0.2)' : 'hsl(var(--container-low))',
                  color: activeTab === tab.value ? '#fff' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {countFor(tab.value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: search bar */}
      <div className="mobile-only" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            aria-label="Search deleted items"
            name="searchQuery"
            id="input-trash-search-mobile"
            type="text"
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 34,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              background: '#fff',
              borderRadius: 4,
              outline: 'none',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              boxSizing: 'border-box',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            background: 'hsla(var(--primary), 0.06)',
            border: '1px solid hsla(var(--primary), 0.18)',
            borderRadius: 6,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              check_box
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-outline btn-sm">
              Clear
            </button>
            <button
              onClick={handleBulkRestore}
              disabled={isBulkRestoring}
              className="btn btn-primary btn-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                settings_backup_restore
              </span>
              {isBulkRestoring ? 'Restoring…' : `Restore ${selectedIds.size}`}
            </button>
          </div>
        </div>
      )}

      {/* Desktop: sidebar-main layout */}
      <div className="sidebar-main desktop-only" style={{ alignItems: 'start' }}>
        <aside
          style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 260, flexShrink: 0 }}
        >
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '12px 18px' }}>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Filter by
              </span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'btn w-full',
                    activeTab === tab.value ? 'btn-primary' : 'btn-outline'
                  )}
                  style={{ justifyContent: 'flex-start', padding: '0 16px', height: 44 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                    {tab.icon}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{tab.label}</span>
                  <span className="pill" style={{ background: 'rgba(0,0,0,0.1)', fontSize: 10 }}>
                    {countFor(tab.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '12px 18px' }}>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Search
              </span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  aria-label="Search deleted items"
                  name="searchQuery"
                  id="input-ddd0f6"
                  type="text"
                  placeholder="Search deleted items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    paddingLeft: 34,
                    paddingRight: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    borderRadius: 4,
                    outline: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    boxSizing: 'border-box',
                    color: 'hsl(var(--on-surface))',
                  }}
                />
              </div>
              <div
                style={{
                  background: 'hsla(var(--destructive), 0.05)',
                  borderRadius: 4,
                  padding: 12,
                  border: '1px solid hsla(var(--destructive), 0.12)',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 15,
                    color: 'hsl(var(--destructive))',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  info
                </span>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    color: 'hsl(var(--destructive))',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Items are permanently deleted after 30 days and cannot be recovered.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <TrashContent
            isLoading={isLoading}
            filteredItems={filteredItems}
            activeTab={activeTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            formatDaysRemaining={formatDaysRemaining}
            handleRestore={handleRestore}
            setDeleteModal={setDeleteModal}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            allSelected={allSelected}
            onToggleAll={toggleSelectAll}
          />
        </main>
      </div>

      {/* Mobile: content only */}
      <div className="mobile-only">
        <TrashContent
          isLoading={isLoading}
          filteredItems={filteredItems}
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          formatDaysRemaining={formatDaysRemaining}
          handleRestore={handleRestore}
          setDeleteModal={setDeleteModal}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          allSelected={allSelected}
          onToggleAll={toggleSelectAll}
        />
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handlePermanentDelete}
        title="Delete forever?"
        description="This item will be permanently deleted and cannot be recovered."
        itemName={deleteModal.name || ''}
        isPermanent={true}
      />
    </div>
  )
}

function TrashContent({
  isLoading,
  filteredItems,
  activeTab,
  searchQuery,
  setSearchQuery,
  formatDaysRemaining,
  handleRestore,
  setDeleteModal,
  selectedIds,
  onToggle,
  allSelected,
  onToggleAll,
}: {
  isLoading: boolean
  filteredItems: (BlogPost | InventoryItem | MediaAsset | Author | Member)[]
  activeTab: TrashTab
  searchQuery: string
  setSearchQuery: (q: string) => void
  formatDaysRemaining: (d: string) => number
  handleRestore: (type: TrashTab, id: string) => void
  setDeleteModal: (m: { isOpen: boolean; type: TrashTab; id: string; name: string }) => void
  selectedIds: Set<string>
  onToggle: (id: string) => void
  allSelected: boolean
  onToggleAll: () => void
}) {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
          gap: 16,
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 36,
            height: 36,
            border: '3px solid hsl(var(--border))',
            borderTopColor: 'hsl(var(--destructive))',
            borderRadius: '50%',
          }}
        />
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          Loading…
        </p>
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div
        className="panel"
        style={{
          padding: '64px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          borderStyle: 'dashed',
          background: 'transparent',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: 'hsl(var(--border))' }}
        >
          delete
        </span>
        <div>
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: 'hsl(var(--on-surface))',
              margin: '0 0 6px',
            }}
          >
            Nothing here
          </h3>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            {searchQuery
              ? 'No deleted items match your search.'
              : 'No deleted items in this category.'}
          </p>
        </div>
        {searchQuery && (
          <button className="btn btn-outline btn-sm" onClick={() => setSearchQuery('')}>
            Clear search
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Select all row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <input
          id="select-all-trash"
          name="selectAllTrash"
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          style={{
            width: 15,
            height: 15,
            accentColor: 'hsl(var(--primary))',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <label
          htmlFor="select-all-trash"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'hsl(var(--on-surface-muted))',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Select all ({filteredItems.length})
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 16,
        }}
      >
        {activeTab === 'blogs' &&
          (filteredItems as BlogPost[]).map((post) => (
            <TrashCard
              key={post.id}
              title={post.title}
              subtitle={post.category}
              type="Blog post"
              deletedAt={post.deletedAt || new Date().toISOString()}
              daysLeft={formatDaysRemaining(post.deletedAt || new Date().toISOString())}
              onRestore={() => handleRestore('blogs', post.id)}
              onDelete={() =>
                setDeleteModal({ isOpen: true, type: 'blogs', id: post.id, name: post.title })
              }
              icon="article"
              accent="red"
              isSelected={selectedIds.has(post.id)}
              onToggle={() => onToggle(post.id)}
            />
          ))}
        {activeTab === 'products' &&
          (filteredItems as InventoryItem[]).map((product) => (
            <TrashCard
              key={product.id}
              title={product.name}
              subtitle={product.category}
              type="Product"
              deletedAt={product.deletedAt || new Date().toISOString()}
              daysLeft={formatDaysRemaining(product.deletedAt || new Date().toISOString())}
              onRestore={() => handleRestore('products', product.id)}
              onDelete={() =>
                setDeleteModal({
                  isOpen: true,
                  type: 'products',
                  id: product.id,
                  name: product.name,
                })
              }
              icon="inventory_2"
              accent="gold"
              isSelected={selectedIds.has(product.id)}
              onToggle={() => onToggle(product.id)}
            />
          ))}
        {activeTab === 'media' &&
          (filteredItems as MediaAsset[]).map((item) => (
            <TrashCard
              key={item.id}
              title={item.filename}
              subtitle={item.folder}
              type="Media"
              image={item.url}
              deletedAt={item.deleted_at || new Date().toISOString()}
              daysLeft={formatDaysRemaining(item.deleted_at || new Date().toISOString())}
              onRestore={() => handleRestore('media', item.url)}
              onDelete={() =>
                setDeleteModal({ isOpen: true, type: 'media', id: item.url, name: item.filename })
              }
              accent="green"
              isSelected={selectedIds.has(item.id)}
              onToggle={() => onToggle(item.id)}
            />
          ))}
        {activeTab === 'authors' &&
          (filteredItems as Author[]).map((author) => (
            <TrashCard
              key={author.id}
              title={author.name}
              subtitle={author.role || 'Contributor'}
              type="Author"
              image={author.imageUrl}
              deletedAt={author.deletedAt || new Date().toISOString()}
              daysLeft={formatDaysRemaining(author.deletedAt || new Date().toISOString())}
              onRestore={() => handleRestore('authors', author.id)}
              onDelete={() =>
                setDeleteModal({ isOpen: true, type: 'authors', id: author.id, name: author.name })
              }
              icon="history_edu"
              accent="red"
              isSelected={selectedIds.has(author.id)}
              onToggle={() => onToggle(author.id)}
            />
          ))}
        {activeTab === 'members' &&
          (filteredItems as Member[]).map((member) => (
            <TrashCard
              key={member.id}
              title={member.name}
              subtitle={member.id}
              type="Member"
              image={member.avatarUrl}
              deletedAt={member.deletedAt || new Date().toISOString()}
              daysLeft={formatDaysRemaining(member.deletedAt || new Date().toISOString())}
              onRestore={() => handleRestore('members', member.id)}
              onDelete={() =>
                setDeleteModal({ isOpen: true, type: 'members', id: member.id, name: member.name })
              }
              icon="person_remove"
              accent="red"
              isSelected={selectedIds.has(member.id)}
              onToggle={() => onToggle(member.id)}
            />
          ))}
      </div>
    </>
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
  accent = 'red',
  isSelected,
  onToggle,
}: {
  title: string
  subtitle: string
  type: string
  deletedAt: string
  onRestore: () => void
  onDelete: () => void
  daysLeft: number
  icon?: string
  image?: string
  accent?: 'red' | 'gold' | 'green'
  isSelected: boolean
  onToggle: () => void
}) {
  const isExpiringSoon = daysLeft <= 7
  const accentColor =
    accent === 'red'
      ? 'hsl(var(--destructive))'
      : accent === 'gold'
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'

  return (
    <div
      className="panel"
      style={{
        padding: 0,
        overflow: 'hidden',
        outline: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
        transition: 'outline 0.15s',
      }}
    >
      {/* Desktop layout */}
      <div className="desktop-only" style={{ display: 'flex', minHeight: 140 }}>
        <div
          style={{
            width: 120,
            position: 'relative',
            overflow: 'hidden',
            background: 'hsl(var(--container-low))',
            borderRight: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}
            >
              {icon}
            </span>
          )}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: accentColor,
            }}
          />
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <input
              type="checkbox"
              aria-label={`Select ${title}`}
              checked={isSelected}
              onChange={onToggle}
              style={{
                width: 15,
                height: 15,
                accentColor: 'hsl(var(--primary))',
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <span
              className="pill"
              style={{
                background: 'hsl(var(--on-surface))',
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 7px',
              }}
            >
              {type}
            </span>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '0 0 3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </p>
                <h4
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </h4>
              </div>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: isExpiringSoon
                    ? 'hsl(var(--destructive))'
                    : 'hsl(var(--container-low))',
                  border: `1px solid ${isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`,
                  textAlign: 'center',
                  flexShrink: 0,
                  minWidth: 56,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: isExpiringSoon ? '#fff' : 'hsl(var(--on-surface))',
                    lineHeight: 1,
                  }}
                >
                  {daysLeft}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: isExpiringSoon
                      ? 'rgba(255,255,255,0.8)'
                      : 'hsl(var(--on-surface-muted))',
                    marginTop: 2,
                  }}
                >
                  days left
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                history
              </span>
              <span
                style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}
              >
                Deleted {new Date(deletedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid hsl(var(--border))',
            }}
          >
            <button
              onClick={onRestore}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                settings_backup_restore
              </span>
              Restore
            </button>
            <button
              onClick={onDelete}
              className="btn btn-dest btn-sm"
              style={{ width: 36, padding: 0, justifyContent: 'center' }}
              title="Delete forever"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                delete_forever
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="mobile-only" style={{ padding: 14 }}>
        <div style={{ height: 3, background: accentColor, borderRadius: 99, marginBottom: 12 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
            <input
              type="checkbox"
              aria-label={`Select ${title}`}
              checked={isSelected}
              onChange={onToggle}
              style={{
                width: 15,
                height: 15,
                accentColor: 'hsl(var(--primary))',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  className="pill"
                  style={{
                    background: 'hsl(var(--on-surface))',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 7px',
                  }}
                >
                  {type}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'hsl(var(--on-surface-muted))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </span>
              </div>
              <h4
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h4>
            </div>
          </div>
          <div
            style={{
              padding: '5px 9px',
              borderRadius: 4,
              background: isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--container-low))',
              border: `1px solid ${isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: isExpiringSoon ? '#fff' : 'hsl(var(--on-surface))',
                lineHeight: 1,
              }}
            >
              {daysLeft}
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: isExpiringSoon ? 'rgba(255,255,255,0.8)' : 'hsl(var(--on-surface-muted))',
                marginTop: 2,
              }}
            >
              days left
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
          >
            history
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>
            Deleted {new Date(deletedAt).toLocaleDateString()}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <button
            onClick={onRestore}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              settings_backup_restore
            </span>
            Restore
          </button>
          <button
            onClick={onDelete}
            className="btn btn-dest btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            title="Delete forever"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              delete_forever
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
