import { TrashCard } from './TrashCard'
import { contentService } from '@/services/contentService'
import { logisticsService } from '@/services/logisticsService'
import { adminService, type Member } from '@/services/adminService'
import type { BlogPost, InventoryItem, MediaAsset, Author } from '@/types/admin'
import type { DeleteOptions } from '@/hooks/useDeleteModal'
import { DotLoader } from '@/components/states'

type TrashTab = 'blogs' | 'products' | 'media' | 'authors' | 'members'

interface TrashContentProps {
  isLoading: boolean
  filteredItems: (BlogPost | InventoryItem | MediaAsset | Author | Member)[]
  activeTab: TrashTab
  searchQuery: string
  setSearchQuery: (q: string) => void
  formatDaysRemaining: (d: string) => number
  handleRestore: (type: TrashTab, id: string) => void
  openDelete: (opts: DeleteOptions) => void
  selectedIds: Set<string>
  onToggle: (id: string) => void
  allSelected: boolean
  onToggleAll: () => void
  loadTrash: () => Promise<void>
}

export function TrashContent({
  isLoading,
  filteredItems,
  activeTab,
  searchQuery,
  setSearchQuery,
  formatDaysRemaining,
  handleRestore,
  openDelete,
  selectedIds,
  onToggle,
  allSelected,
  onToggleAll,
  loadTrash,
}: TrashContentProps) {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}
      >
        <DotLoader label="Loading…" />
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
              fontWeight: 'var(--font-weight-medium, 500)',
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
              fontWeight: 'var(--font-weight-medium, 500)',
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
            fontWeight: 'var(--font-weight-medium, 500)',
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
                openDelete({
                  itemName: post.title,
                  isPermanent: true,
                  title: 'Delete forever?',
                  description: 'This post will be permanently deleted and cannot be recovered.',
                  onConfirm: async () => {
                    const ok = await contentService.permanentlyDeleteBlogPost(post.id)
                    if (ok) loadTrash()
                    return ok
                  },
                })
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
                openDelete({
                  itemName: product.name,
                  isPermanent: true,
                  title: 'Delete forever?',
                  description: 'This product will be permanently deleted and cannot be recovered.',
                  onConfirm: async () => {
                    const ok = await logisticsService.permanentlyDeleteInventoryItem(product.id)
                    if (ok) loadTrash()
                    return ok
                  },
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
                openDelete({
                  itemName: item.filename,
                  isPermanent: true,
                  title: 'Delete forever?',
                  description:
                    'This media file will be permanently deleted and cannot be recovered.',
                  onConfirm: async () => {
                    const ok = await contentService.permanentlyDeleteMediaFile(item.url)
                    if (ok) loadTrash()
                    return ok
                  },
                })
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
                openDelete({
                  itemName: author.name,
                  isPermanent: true,
                  title: 'Delete forever?',
                  description: 'This author will be permanently deleted and cannot be recovered.',
                  onConfirm: async () => {
                    const ok = await contentService.permanentlyDeleteAuthor(author.id)
                    if (ok) loadTrash()
                    return ok
                  },
                })
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
                openDelete({
                  itemName: member.name,
                  isPermanent: true,
                  title: 'Delete forever?',
                  description: 'This member will be permanently deleted and cannot be recovered.',
                  onConfirm: async () => {
                    const ok = await adminService.permanentlyDeleteMember(member.id)
                    if (ok) loadTrash()
                    return ok
                  },
                })
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
