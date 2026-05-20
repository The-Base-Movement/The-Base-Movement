import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { BlogPost, AdminUser } from '@/types/admin'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import {
  CATEGORY_PLACEHOLDERS,
  DEFAULT_PLACEHOLDER,
  CATEGORIES,
  selectSt,
  labelSt,
  metaSt,
} from './styles'

interface BlogListProps {
  posts: BlogPost[]
  isLoading: boolean
  currentUser: AdminUser | null
  onWritePost: () => void
  onEditPost: (post: BlogPost) => void
  onViewPost: (post: BlogPost) => void
  onPublishPost: (post: BlogPost) => Promise<void>
  onUnpublishPost: (post: BlogPost) => Promise<void>
  onDeletePost: (post: BlogPost) => void
}

export function BlogList({
  posts,
  isLoading,
  currentUser,
  onWritePost,
  onEditPost,
  onViewPost,
  onPublishPost,
  onUnpublishPost,
  onDeletePost,
}: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640)
  const [showMobileFilter, setShowMobileFilter] = useState(false)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="main">
      <div className="top">
        <div>
          <div className="crumbs">
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>
              Admin
            </Link>
            {' · '} Blog intelligence
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              article
            </span>
            Editorial command
          </h2>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              download
            </span>
            Export
          </button>
          <button className="btn btn-primary" onClick={onWritePost}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
            Write article
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI
          label="Total articles"
          value={posts.length}
          description="Across all categories"
        />
        <TacticalKPI
          label="Authorized"
          value={posts.filter((p) => p.status === 'Published').length}
          description="Live in public feed"
          trend={{ direction: 'up', value: 'Live' }}
          variant="green"
        />
        <TacticalKPI
          label="Pending review"
          value={posts.filter((p) => p.status === 'Pending Verification').length}
          description="Awaiting editorial clearance"
          trend={{ direction: 'neutral', value: 'Pending' }}
          variant="gold"
        />
        <TacticalKPI
          label="Drafts"
          value={posts.filter((p) => p.status === 'Draft').length}
          description="Work in progress"
        />
      </div>

      <div className="sidebar-main">
        {/* Sidebar */}
        <aside className="desktop-only panel h-fit sticky top-20">
          <div className="ph">
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
              >
                filter_list
              </span>
              Intelligence filters
            </span>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="input-bbba95" style={labelSt}>
                Search feed
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  aria-label="Keywords…"
                  name="searchQuery"
                  id="input-bbba95"
                  type="text"
                  placeholder="Keywords…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...selectSt, paddingLeft: 34 }}
                />
              </div>
            </div>
            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
              <label htmlFor="select-0a8b07" style={labelSt}>
                Status
              </label>
              <select
                name="statusFilter"
                id="select-0a8b07"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={selectSt}
              >
                <option value="all">All statuses</option>
                <option value="Published">Published</option>
                <option value="Pending Verification">Pending</option>
                <option value="Draft">Drafts</option>
              </select>
            </div>
            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
              <label htmlFor="select-339e1e" style={labelSt}>
                Category
              </label>
              <select
                name="categoryFilter"
                id="select-339e1e"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={selectSt}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Articles grid */}
        <div style={{ minWidth: 0 }}>
          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: `All (${posts.length})` },
              {
                value: 'Published',
                label: `Published (${posts.filter((p) => p.status === 'Published').length})`,
              },
              {
                value: 'Pending Verification',
                label: `Pending (${posts.filter((p) => p.status === 'Pending Verification').length})`,
              },
              {
                value: 'Draft',
                label: `Drafts (${posts.filter((p) => p.status === 'Draft').length})`,
              },
            ].map((tab) => (
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {isLoading ? (
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
                    fontWeight: 800,
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
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    marginBottom: 20,
                  }}
                >
                  Try refining your search or dispatch a new article.
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('')
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="panel"
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
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
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span
                        className="pill"
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(4px)',
                          color: 'hsl(var(--on-surface))',
                          fontWeight: 800,
                        }}
                      >
                        {post.category}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <span
                        className="pill"
                        style={{
                          backdropFilter: 'blur(4px)',
                          fontWeight: 800,
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
                      <h3
                        style={
                          {
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 800,
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
                      {/* Dropdown */}
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
                        {openMenuId === post.id && (
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                            onClick={() => {
                              setOpenMenuId(null)
                              setMenuAnchor(null)
                            }}
                          />
                        )}
                        {openMenuId === post.id &&
                          menuAnchor &&
                          createPortal(
                            <div
                              style={{
                                position: 'fixed',
                                top: menuAnchor.top,
                                right: menuAnchor.right,
                                zIndex: 9999,
                                background: '#fff',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 6,
                                minWidth: 168,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                              }}
                            >
                              {(
                                [
                                  {
                                    icon: 'edit',
                                    label: 'Edit post',
                                    action: () => onEditPost(post),
                                    dest: false,
                                    hidden: false,
                                  },
                                  {
                                    icon: 'visibility',
                                    label: 'View post',
                                    action: () => onViewPost(post),
                                    dest: false,
                                    hidden: false,
                                  },
                                  {
                                    icon: 'publish',
                                    label: 'Publish post',
                                    action: () => onPublishPost(post),
                                    dest: false,
                                    hidden:
                                      post.status === 'Published' ||
                                      !['SUPER_ADMIN', 'FOUNDER', 'ORGANIZER'].includes(
                                        currentUser?.role ?? ''
                                      ),
                                  },
                                  {
                                    icon: 'unpublished',
                                    label: 'Unpublish post',
                                    action: () => onUnpublishPost(post),
                                    dest: false,
                                    hidden:
                                      post.status !== 'Published' ||
                                      !['SUPER_ADMIN', 'FOUNDER', 'ORGANIZER'].includes(
                                        currentUser?.role ?? ''
                                      ),
                                  },
                                  null,
                                  {
                                    icon: 'delete',
                                    label: 'Delete post',
                                    action: () => onDeletePost(post),
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
                              )
                                .filter((item) => item === null || !item.hidden)
                                .map((item, idx) =>
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
                                        fontWeight: 700,
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
                                        (e.currentTarget.style.background =
                                          'hsl(var(--container-low))')
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = 'none')
                                      }
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

                    <p
                      style={
                        {
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 700,
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter FAB + bottom sheet */}
      {isMobile && (
        <>
          <button
            onClick={() => setShowMobileFilter(true)}
            style={{
              position: 'fixed',
              bottom: 88,
              left: 16,
              zIndex: 50,
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'hsl(var(--on-surface))',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
              cursor: 'pointer',
            }}
            aria-label="Open filters"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              filter_list
            </span>
          </button>

          {showMobileFilter &&
            createPortal(
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    zIndex: 60,
                  }}
                  onClick={() => setShowMobileFilter(false)}
                />
                <div
                  style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 70,
                    background: '#fff',
                    borderRadius: '14px 14px 0 0',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 18px',
                      borderBottom: '1px solid hsl(var(--border))',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 14,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Intelligence filters
                    </span>
                    <button
                      onClick={() => setShowMobileFilter(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        close
                      </span>
                    </button>
                  </div>
                  <div
                    style={{
                      padding: '18px 18px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      maxHeight: '70vh',
                      overflowY: 'auto',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="mob-search-blogs"
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 900,
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'hsl(var(--on-surface-muted))',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        Search
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 15,
                            color: 'hsl(var(--on-surface-muted))',
                            pointerEvents: 'none',
                          }}
                        >
                          search
                        </span>
                        <input
                          id="mob-search-blogs"
                          name="mobBlogSearch"
                          placeholder="Keywords…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ ...selectSt, paddingLeft: 34, height: 42 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="mob-status-blogs"
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 900,
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'hsl(var(--on-surface-muted))',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        Status
                      </label>
                      <select
                        id="mob-status-blogs"
                        name="mobStatusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ ...selectSt, height: 42 }}
                      >
                        <option value="all">All statuses</option>
                        <option value="Published">Published</option>
                        <option value="Pending Verification">Pending</option>
                        <option value="Draft">Drafts</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="mob-cat-blogs"
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 900,
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'hsl(var(--on-surface-muted))',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        Category
                      </label>
                      <select
                        id="mob-cat-blogs"
                        name="mobCategoryFilter"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{ ...selectSt, height: 42 }}
                      >
                        <option value="all">All categories</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', height: 44, marginTop: 4 }}
                      onClick={() => setShowMobileFilter(false)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        check
                      </span>
                      Apply filters
                    </button>
                  </div>
                </div>
              </>,
              document.body
            )}
        </>
      )}
    </div>
  )
}
