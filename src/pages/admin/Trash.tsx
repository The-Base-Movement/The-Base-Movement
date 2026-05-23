import { useState, useEffect, useCallback } from 'react'
import { contentService } from '@/services/contentService'
import { logisticsService } from '@/services/logisticsService'
import { adminService, type Member } from '@/services/adminService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { BlogPost, InventoryItem, MediaAsset, Author } from '@/types/admin'
import { TrashContent } from './trash/TrashContent'

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

  const { openDelete, modal: deleteModal } = useDeleteModal()

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
      <AdminPageHeader
        title="Trash"
        icon="delete"
        description="Deleted items are kept for 30 days, then removed forever."
      />

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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                  fontWeight: 'var(--font-weight-semibold, 600)',
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
                  fontWeight: 'var(--font-weight-medium, 500)',
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
              fontWeight: 'var(--font-weight-medium, 500)',
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
                fontWeight: 'var(--font-weight-medium, 500)',
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
                  fontWeight: 'var(--font-weight-semibold, 600)',
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
                  fontWeight: 'var(--font-weight-semibold, 600)',
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
            openDelete={openDelete}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
            allSelected={allSelected}
            onToggleAll={toggleSelectAll}
            loadTrash={loadTrash}
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
          openDelete={openDelete}
          selectedIds={selectedIds}
          onToggle={toggleSelect}
          allSelected={allSelected}
          onToggleAll={toggleSelectAll}
          loadTrash={loadTrash}
        />
      </div>

      {deleteModal}
    </div>
  )
}
