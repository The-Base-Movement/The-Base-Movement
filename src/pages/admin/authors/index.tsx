import { useState, useEffect, useMemo } from 'react'
import { SortToggle } from '@/components/ui/SortToggle'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { adminService, type Author } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { usePerformance } from '@/context/PerformanceContext'

// Sub-components
import { AuthorForm } from './AuthorForm'

const inputSt = {
  width: '100%',
  height: 34,
  paddingLeft: 30,
  paddingRight: 10,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  background: 'hsl(var(--container-low))',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const selectSt = {
  width: '100%',
  height: 34,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  background: 'hsl(var(--container-low))',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

export default function AdminAuthors() {
  const { lowBandwidthMode } = usePerformance()
  const [authors, setAuthors] = useState<Author[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [roleFilter, setRoleFilter] = useState('all')
  const [viewingAuthor, setViewingAuthor] = useState<Author | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [publishedPostCount, setPublishedPostCount] = useState<number | null>(null)
  const [authorRoles, setAuthorRoles] = useState<string[]>([])

  // Form view state: null | 'create' | 'edit'
  const [formView, setFormView] = useState<{ mode: 'create' | 'edit'; authorId?: string } | null>(
    null
  )

  const fetchAuthors = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getAuthors()
      setAuthors(data)
    } catch {
      toast.error('Failed to sync personnel database.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const stats = await adminService.getBlogStats()
      setPublishedPostCount(stats.publishedCount)
    } catch {
      console.error('Failed to load blog stats')
    }
  }

  useEffect(() => {
    fetchAuthors()
    fetchStats()
    contentService.getAuthorRoles().then(setAuthorRoles)
  }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      const ok = await adminService.deleteAuthor(deleteConfirm.id)
      if (ok) {
        toast.success(`Author record removed: ${deleteConfirm.name}`)
        setAuthors((prev) => prev.filter((a) => a.id !== deleteConfirm.id))
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Deletion protocol failed.')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const filteredAuthors = useMemo(() => {
    const list = authors.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.role?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || a.role === roleFilter
      return matchesSearch && matchesRole
    })
    return list.sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [authors, searchQuery, roleFilter, sortOrder])

  // ── Layout ──
  if (formView) {
    return (
      <AuthorForm
        mode={formView.mode}
        authorId={formView.authorId}
        onClose={() => setFormView(null)}
        onSuccess={() => {
          setFormView(null)
          fetchAuthors()
        }}
      />
    )
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Editorial Author Management"
        icon="badge"
        description="Manage verified editorial personnel, field correspondents, and digital mobilization authors."
        actions={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setFormView({ mode: 'create' })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
            Appoint personnel
          </button>
        }
      />

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          {
            label: 'Total Personnel',
            value: String(authors.length),
            sub: 'Verified authors',
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Published posts',
            value: String(publishedPostCount ?? '—'),
            sub: 'Live blog posts',
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Appointed',
            value: String(authors.filter((a) => a.memberId).length),
            sub: 'Linked to members',
            bar: 'hsl(var(--on-surface))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '14px 18px 14px 22px', position: 'relative', overflow: 'hidden' }}
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
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 'var(--kpi-num-size)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 4px',
                lineHeight: 1.1,
              }}
            >
              {kpi.value}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile filters & Sort — inline above the card list */}
      <div
        className="mobile-only"
        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
              aria-label="Search authors"
              name="mobAuthorSearch"
              id="input-mob-author-search"
              type="text"
              placeholder="Search authors…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputSt, height: 40, paddingLeft: 34 }}
            />
          </div>
          <SortToggle value={sortOrder} onChange={setSortOrder} />
        </div>
        <select
          name="mobRoleFilter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ ...selectSt, height: 40 }}
        >
          <option value="all">All roles</option>
          {authorRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar-main">
        {/* Sidebar */}
        <aside
          className="desktop-only panel"
          style={{
            padding: 0,
            overflow: 'hidden',
            alignSelf: 'start',
            position: 'sticky',
            top: 80,
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
            >
              manage_search
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Filter authors
            </span>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label
                htmlFor="input-650b52"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Filter authors
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      pointerEvents: 'none',
                    }}
                  >
                    search
                  </span>
                  <input
                    aria-label="Name or role…"
                    name="searchQuery"
                    id="input-650b52"
                    type="text"
                    placeholder="Name or role…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={inputSt}
                  />
                </div>
                <SortToggle value={sortOrder} onChange={setSortOrder} />
              </div>
            </div>
            <div>
              <label
                htmlFor="select-b631d5"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Role classification
              </label>
              <select
                name="roleFilter"
                id="select-b631d5"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={selectSt}
              >
                <option value="all">All roles</option>
                {authorRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ paddingTop: 14, borderTop: '1px solid hsl(var(--border))' }}>
              <div
                style={{
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    color: 'hsl(var(--primary))',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    shield
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                    }}
                  >
                    Protocol V01
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  All editorial personnel must undergo background verification before recruitment
                  into the digital mobilization corps.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Table */}
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div className="ph">
            <h3>Registered personnel</h3>
            <span className="meta">{filteredAuthors.length} records identified</span>
          </div>
          {/* Desktop table */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Personnel profile</th>
                  <th>Role &amp; Authorization</th>
                  <th>Enlisted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} style={{ animation: 'pulse 2s infinite' }}>
                        <td>
                          <div
                            style={{
                              height: 14,
                              background: 'hsl(var(--border))',
                              borderRadius: 4,
                              width: 160,
                            }}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              height: 22,
                              background: 'hsl(var(--border))',
                              borderRadius: 4,
                              width: 90,
                            }}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              height: 14,
                              background: 'hsl(var(--border))',
                              borderRadius: 4,
                              width: 80,
                            }}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              height: 28,
                              background: 'hsl(var(--border))',
                              borderRadius: 4,
                              width: 80,
                              marginLeft: 'auto',
                            }}
                          />
                        </td>
                      </tr>
                    ))
                ) : filteredAuthors.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 40,
                          color: 'hsl(var(--border))',
                          display: 'block',
                          marginBottom: 10,
                        }}
                      >
                        edit_note
                      </span>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                          marginBottom: 12,
                        }}
                      >
                        No personnel matching search criteria
                      </p>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSearchQuery('')
                          setRoleFilter('all')
                        }}
                      >
                        Reset filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredAuthors.map((author) => (
                    <tr key={author.id}>
                      <td>
                        <div className="who">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              border: '1px solid hsl(var(--border))',
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'hsl(var(--container-low))',
                            }}
                          >
                            {!lowBandwidthMode ? (
                              <img
                                src={author.imageUrl || '/author-placeholder.svg'}
                                crossOrigin="anonymous"
                                loading="lazy"
                                alt={author.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {author.name[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <b
                              style={{ cursor: 'pointer' }}
                              onClick={() => setViewingAuthor(author)}
                            >
                              {author.name}
                            </b>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                opacity: 0.5,
                              }}
                            >
                              {author.id.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span className="pill pill-ok">{author.role || 'Contributor'}</span>
                          {author.memberId && (
                            <span
                              className="pill"
                              style={{
                                fontSize: 10,
                                background: 'hsla(var(--accent), 0.12)',
                                color: 'hsl(var(--accent))',
                                borderColor: 'hsla(var(--accent), 0.3)',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>
                                how_to_reg
                              </span>{' '}
                              Appointed
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            calendar_today
                          </span>
                          {format(new Date(author.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setViewingAuthor(author)}
                            className="ico"
                            title="View"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() => setFormView({ mode: 'edit', authorId: author.id })}
                            className="ico"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: author.id, name: author.name })}
                            className="ico no"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div
            className="mobile-only"
            style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {isLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="panel"
                    style={{
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
                        background: 'hsl(var(--border))',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'hsl(var(--border))',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            width: '60%',
                            height: 12,
                            background: 'hsl(var(--border))',
                            borderRadius: 3,
                            marginBottom: 10,
                          }}
                        />
                        <div
                          style={{
                            width: 70,
                            height: 18,
                            background: 'hsl(var(--border))',
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
            ) : filteredAuthors.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 36,
                    color: 'hsl(var(--border))',
                    display: 'block',
                    marginBottom: 10,
                  }}
                >
                  edit_note
                </span>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    marginBottom: 12,
                  }}
                >
                  No personnel matching search criteria
                </p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('')
                    setRoleFilter('all')
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredAuthors.map((author) => {
                const isAppointed = !!author.memberId
                return (
                  <div
                    key={author.id}
                    className="panel"
                    style={{ overflow: 'hidden', position: 'relative' }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: isAppointed ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                      }}
                    />

                    {/* Main row */}
                    <div
                      style={{
                        padding: '14px 16px 14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                      }}
                      onClick={() => setViewingAuthor(author)}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          border: '2px solid hsl(var(--border))',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'hsl(var(--container-low))',
                        }}
                      >
                        {!lowBandwidthMode ? (
                          <img
                            src={author.imageUrl || '/author-placeholder.svg'}
                            crossOrigin="anonymous"
                            loading="lazy"
                            alt={author.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {author.name[0]}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 14,
                            color: 'hsl(var(--on-surface))',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {author.name}
                        </b>
                        <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="pill pill-ok" style={{ fontSize: 10 }}>
                            {author.role || 'Contributor'}
                          </span>
                          {isAppointed && (
                            <span
                              className="pill"
                              style={{
                                fontSize: 10,
                                background: 'hsla(var(--accent), 0.12)',
                                color: 'hsl(var(--accent))',
                                borderColor: 'hsla(var(--accent), 0.3)',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>
                                how_to_reg
                              </span>{' '}
                              Appointed
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            marginTop: 5,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                            calendar_today
                          </span>
                          {format(new Date(author.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          color: 'hsl(var(--on-surface-muted))',
                          flexShrink: 0,
                        }}
                      >
                        chevron_right
                      </span>
                    </div>

                    {/* Action footer */}
                    <div
                      style={{
                        padding: '10px 16px 10px 20px',
                        borderTop: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewingAuthor(author)
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          visibility
                        </span>
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormView({ mode: 'edit', authorId: author.id })
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          edit
                        </span>
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm({ id: author.id, name: author.name })
                        }}
                        className="btn btn-dest btn-sm"
                        style={{ minWidth: 34, padding: '0 8px', justifyContent: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Author Details Modal */}
      {viewingAuthor &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setViewingAuthor(null)}
          >
            <div
              className="panel"
              style={{
                width: '100%',
                maxWidth: 440,
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                padding: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  height: 100,
                  background: 'hsl(var(--container-low))',
                  position: 'relative',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: -36,
                    left: 24,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'hsl(var(--surface))',
                    padding: 4,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'hsl(var(--container-low))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <img
                      src={viewingAuthor.imageUrl || '/author-placeholder.svg'}
                      alt={viewingAuthor.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setViewingAuthor(null)}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>

              <div style={{ padding: '54px 24px 24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 20,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {viewingAuthor.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className="pill pill-ok" style={{ fontSize: 10 }}>
                        {viewingAuthor.role || 'Contributor'}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        ID: {viewingAuthor.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Bio / Description
                    </span>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {viewingAuthor.bio || 'No biographical data enlisted.'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      padding: 16,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 6,
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        Enlisted on
                      </span>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          marginTop: 2,
                        }}
                      >
                        {format(new Date(viewingAuthor.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        Status
                      </span>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          marginTop: 2,
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        Verified
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        Member ID
                      </span>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          marginTop: 2,
                          fontFamily: "'Courier New', monospace",
                          wordBreak: 'break-all',
                        }}
                      >
                        {viewingAuthor.memberId || 'None linked'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid hsl(var(--border))',
                      paddingTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      verified_user
                    </span>
                    Verified editorial personnel
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <DeleteConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove personnel"
        description="This action will permanently revoke the author record. Associated blog posts will remain live but will lose their link to this personnel profile."
        itemName={deleteConfirm?.name || ''}
        isLoading={isDeleting}
        isPermanent={true}
      />
    </div>
  )
}
