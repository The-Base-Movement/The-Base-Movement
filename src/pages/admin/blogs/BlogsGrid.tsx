/**
 * blogs/BlogsGrid.tsx
 * ─────────────────────────────────────────────────────────────────
 * Article card grid for the Blogs list view.
 * Handles status tab bar, skeleton loading, empty state, and the
 * per-card context dropdown (edit / view / publish / unpublish / delete).
 *
 * Props:
 *  filteredPosts   — already search+status+category filtered posts to render
 *  posts           — full unfiltered list for tab counts
 *  isLoading       — shows skeleton cards when true
 *  openMenuId / setOpenMenuId / menuAnchor / setMenuAnchor — dropdown state (lifted to parent to survive re-renders)
 *  currentUser     — used to gate publish/unpublish actions by role
 *  statusFilter / setStatusFilter — tab bar selection
 *  onEdit / onView / onPublish / onUnpublish / onDelete — post action handlers
 *  onClearFilters  — resets all filters when empty state button is clicked
 */

import { createPortal } from 'react-dom'
import type { BlogPost, AdminUser } from '@/types/admin'
import { CATEGORY_PLACEHOLDERS, DEFAULT_PLACEHOLDER } from './constants'
import { metaSt } from './styles'

interface BlogsGridProps {
  filteredPosts: BlogPost[]
  posts: BlogPost[]
  isLoading: boolean
  openMenuId: string | null
  setOpenMenuId: React.Dispatch<React.SetStateAction<string | null>>
  menuAnchor: { top: number; right: number } | null
  setMenuAnchor: React.Dispatch<React.SetStateAction<{ top: number; right: number } | null>>
  currentUser: AdminUser | null
  statusFilter: string
  setStatusFilter: (v: string) => void
  onEdit: (post: BlogPost) => void
  onView: (post: BlogPost) => void
  onPublish: (post: BlogPost) => void
  onUnpublish: (post: BlogPost) => void
  onDelete: (post: BlogPost) => void
  onClearFilters: () => void
}

export function BlogsGrid({
  filteredPosts,
  posts,
  isLoading,
  openMenuId,
  setOpenMenuId,
  menuAnchor,
  setMenuAnchor,
  currentUser,
  statusFilter,
  setStatusFilter,
  onEdit,
  onView,
  onPublish,
  onUnpublish,
  onDelete,
  onClearFilters,
}: BlogsGridProps) {
  const tabs = [
    { value: 'all', label: `All (${posts.length})` },
    {
      value: 'Published',
      label: `Published (${posts.filter((p) => p.status === 'Published').length})`,
    },
    {
      value: 'Pending Verification',
      label: `Pending (${posts.filter((p) => p.status === 'Pending Verification').length})`,
    },
    { value: 'Draft', label: `Drafts (${posts.filter((p) => p.status === 'Draft').length})` },
  ]

  return (
    <div style={{ minWidth: 0 }}>
      {/* Status tab bar — desktop */}
      <div
        className="desktop-only"
        style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={
              statusFilter === tab.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
            }
            style={{ fontSize: 11 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status dropdown — mobile */}
      <div className="mobile-only" style={{ marginBottom: 12 }}>
        <select
          name="mobStatusTabFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            width: '100%',
            height: 38,
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            padding: '0 10px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--surface))',
            outline: 'none',
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.value} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {isLoading ? (
          /* Skeleton placeholders */
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="panel" style={{ height: 320 }}>
                <div style={{ height: 160, background: 'hsl(var(--container-low))' }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      height: 13,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 3,
                      width: '80%',
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 3,
                      width: '60%',
                    }}
                  />
                </div>
              </div>
            ))
        ) : filteredPosts.length === 0 ? (
          /* Empty state */
          <div
            className="panel"
            style={{ gridColumn: '1/-1', padding: '60px 20px', textAlign: 'center' }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 48,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.25,
                display: 'block',
                marginBottom: 12,
              }}
            >
              article
            </span>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                marginBottom: 6,
              }}
            >
              No posts found
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 20,
              }}
            >
              Try refining your search or dispatch a new article.
            </div>
            <button className="btn btn-outline btn-sm" onClick={onClearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            /* Build context menu items, filtering hidden ones */
            const menuItems = (
              [
                {
                  icon: 'edit',
                  label: 'Edit post',
                  action: () => onEdit(post),
                  dest: false,
                  hidden: false,
                },
                {
                  icon: 'visibility',
                  label: 'View post',
                  action: () => onView(post),
                  dest: false,
                  hidden: false,
                },
                {
                  icon: 'publish',
                  label: 'Publish post',
                  action: () => onPublish(post),
                  dest: false,
                  hidden:
                    post.status === 'Published' ||
                    !['SUPER_ADMIN', 'FOUNDER', 'ORGANIZER'].includes(currentUser?.role ?? ''),
                },
                {
                  icon: 'unpublished',
                  label: 'Unpublish post',
                  action: () => onUnpublish(post),
                  dest: false,
                  hidden:
                    post.status !== 'Published' ||
                    !['SUPER_ADMIN', 'FOUNDER', 'ORGANIZER'].includes(currentUser?.role ?? ''),
                },
                null,
                {
                  icon: 'delete',
                  label: 'Delete post',
                  action: () => onDelete(post),
                  dest: true,
                  hidden: false,
                },
              ] as ({
                icon: string
                label: string
                action: () => void
                dest: boolean
                hidden: boolean
              } | null)[]
            ).filter((item) => item === null || !item.hidden)

            return (
              <div
                key={post.id}
                className="panel"
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                {/* Cover image */}
                <div
                  style={{
                    height: 160,
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'hsl(var(--container-low))',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={
                      post.imageUrl || CATEGORY_PLACEHOLDERS[post.category] || DEFAULT_PLACEHOLDER
                    }
                    alt={post.title}
                    crossOrigin="anonymous"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Category badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span
                      className="pill"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(4px)',
                        color: 'hsl(var(--on-surface))',
                        fontWeight: 'var(--font-weight-semibold, 600)',
                      }}
                    >
                      {post.category}
                    </span>
                  </div>
                  {/* Status badge */}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span
                      className="pill"
                      style={{
                        backdropFilter: 'blur(4px)',
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 9,
                        background:
                          post.status === 'Published'
                            ? 'rgba(34,197,94,0.9)'
                            : post.status === 'Pending Verification'
                              ? 'rgba(234,179,8,0.9)'
                              : 'rgba(30,30,30,0.75)',
                        color: '#fff',
                      }}
                    >
                      {post.status === 'Pending Verification' ? 'Pending' : post.status}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {/* Title */}
                    <h3
                      style={
                        {
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                          lineHeight: 1.35,
                          margin: 0,
                          flex: 1,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        } as React.CSSProperties
                      }
                    >
                      {post.title}
                    </h3>

                    {/* Context menu trigger */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        style={{
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (openMenuId === post.id) {
                            setOpenMenuId(null)
                            setMenuAnchor(null)
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuAnchor({
                              top: rect.bottom + 4,
                              right: window.innerWidth - rect.right,
                            })
                            setOpenMenuId(post.id)
                          }
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                          more_vert
                        </span>
                      </button>

                      {/* Backdrop to close menu */}
                      {openMenuId === post.id && (
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                          onClick={() => {
                            setOpenMenuId(null)
                            setMenuAnchor(null)
                          }}
                        />
                      )}

                      {/* Dropdown via portal — avoids overflow clipping from card */}
                      {openMenuId === post.id &&
                        menuAnchor &&
                        createPortal(
                          <div
                            style={{
                              position: 'fixed',
                              top: menuAnchor.top,
                              right: menuAnchor.right,
                              zIndex: 9999,
                              background: 'hsl(var(--surface))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 6,
                              minWidth: 168,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              overflow: 'hidden',
                            }}
                          >
                            {menuItems.map((item, idx) =>
                              item === null ? (
                                <div
                                  key={idx}
                                  style={{ height: 1, background: 'hsl(var(--border))' }}
                                />
                              ) : (
                                <button
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 14px',
                                    fontFamily: "'Public Sans', sans-serif",
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 12,
                                    color: item.dest
                                      ? 'hsl(var(--destructive))'
                                      : 'hsl(var(--on-surface))',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                                  }
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    setMenuAnchor(null)
                                    item.action()
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 15 }}
                                  >
                                    {item.icon}
                                  </span>
                                  {item.label}
                                </button>
                              )
                            )}
                          </div>,
                          document.body
                        )}
                    </div>
                  </div>

                  {/* Excerpt */}
                  <p
                    style={
                      {
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        lineHeight: 1.6,
                        margin: '0 0 14px',
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      } as React.CSSProperties
                    }
                  >
                    {post.excerpt}
                  </p>

                  {/* Footer: date + read time */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid hsl(var(--border))',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        ...metaSt,
                        fontSize: 10.5,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        calendar_today
                      </span>
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        ...metaSt,
                        fontSize: 10.5,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        schedule
                      </span>
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
