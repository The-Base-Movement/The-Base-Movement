import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { AuthorForm } from './AuthorForm'
import { contentService } from '@/services/contentService'
import type { Author } from '@/types/admin'
import { toast } from 'sonner'
import { format } from 'date-fns'

type FormView = { mode: 'new' } | { mode: 'edit'; authorId: string }

export default function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [viewingAuthor, setViewingAuthor] = useState<Author | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [formView, setFormView] = useState<FormView | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [publishedPostCount, setPublishedPostCount] = useState<number | null>(null)

  useEffect(() => {
    contentService.getAuthorRoles().then(setAvailableRoles)
    contentService.getPublishedPostCount().then(setPublishedPostCount)
  }, [])

  const fetchAuthors = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await contentService.getAuthors()
      setAuthors(data)
    } catch (error) {
      console.error('Failed to fetch authors:', error)
      toast.error('Failed to load editorial intelligence')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Deep Link Handling for Global Search
  useEffect(() => {
    if (authors.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const viewId = params.get('view')
      if (viewId) {
        const author = authors.find((a) => a.id === viewId)
        if (author) {
          setTimeout(() => {
            setViewingAuthor(author)
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [authors])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(deleteConfirm.id)

    try {
      const success = await contentService.deleteAuthor(deleteConfirm.id)
      if (success) {
        toast.success(`Personnel "${deleteConfirm.name}" moved to trash vault`)
        setAuthors(authors.filter((a) => a.id !== deleteConfirm.id))
      } else {
        toast.error('Authorization failure during deletion')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Strategic failure during data purge')
    } finally {
      setIsDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const filteredAuthors = authors.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = roleFilter === 'all' || (a.role || 'Contributor') === roleFilter
    return matchesSearch && matchesRole
  })

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 10px 0 32px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 4,
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    outline: 'none',
    background: '#fff',
    color: 'hsl(var(--on-surface))',
    boxSizing: 'border-box',
  }
  const selectSt: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 10px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 4,
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    outline: 'none',
    background: '#fff',
    color: 'hsl(var(--on-surface))',
    boxSizing: 'border-box',
    appearance: 'none',
  }

  const handleFormSave = (saved: Author) => {
    setAuthors((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setFormView(null)
  }

  return (
    <div className="main">
      {/* Header */}
      <div className="top" style={{ marginBottom: formView ? 24 : 32 }}>
        <div>
          {formView && (
            <div className="crumbs" style={{ marginBottom: 6 }}>
              <button
                onClick={() => setFormView(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'hsl(var(--primary))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Authors directory
              </button>
              {' · '}
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {formView.mode === 'new' ? 'Recruit author' : 'Edit author'}
              </span>
            </div>
          )}
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {formView
                ? formView.mode === 'new'
                  ? 'person_add'
                  : 'manage_accounts'
                : 'edit_note'}
            </span>
            {formView
              ? formView.mode === 'new'
                ? 'Recruit new personnel'
                : 'Refine credentials'
              : 'Authors directory'}
          </h2>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
          {!formView && (
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                marginTop: 8,
              }}
            >
              Editorial intelligence — verified content creators.
            </p>
          )}
        </div>
        {!formView && (
          <div className="actions">
            <button className="btn btn-outline btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                download
              </span>
              Export records
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setFormView({ mode: 'new' })}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Recruit author
            </button>
          </div>
        )}
      </div>

      {/* Form view */}
      {formView && (
        <AuthorForm
          authorId={formView.mode === 'edit' ? formView.authorId : undefined}
          onSave={handleFormSave}
          onCancel={() => setFormView(null)}
        />
      )}

      {/* KPIs */}
      {!formView && (
        <>
          <div className="kpis">
            {[
              {
                label: 'Intelligence',
                value: String(authors.length),
                sub: 'Active editorial personnel',
                bar: 'hsl(var(--on-surface))',
              },
              {
                label: 'Mobility',
                value: String(availableRoles.length),
                sub: 'Distinct tactical roles',
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
                    fontWeight: 800,
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
                    fontWeight: 800,
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
                    fontWeight: 700,
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
                    fontWeight: 800,
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
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Filter authors
                  </label>
                  <div style={{ position: 'relative' }}>
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
                </div>
                <div>
                  <label
                    htmlFor="select-b631d5"
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
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
                    {availableRoles.map((role) => (
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
                          fontWeight: 700,
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
                      All editorial personnel must undergo background verification before
                      recruitment into the digital mobilization corps.
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
                              fontWeight: 700,
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
                                <img
                                  src={author.imageUrl || '/author-placeholder.svg'}
                                  crossOrigin="anonymous"
                                  loading="lazy"
                                  alt={author.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                              <div>
                                <b
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setViewingAuthor(author)}
                                >
                                  {author.name}
                                </b>
                                <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }}>
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
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 10 }}
                                  >
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
                                fontWeight: 700,
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
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 16 }}
                                >
                                  visibility
                                </span>
                              </button>
                              <button
                                onClick={() => setFormView({ mode: 'edit', authorId: author.id })}
                                className="ico"
                                title="Edit"
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 16 }}
                                >
                                  edit
                                </span>
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({ id: author.id, name: author.name })
                                }
                                className="ico no"
                                title="Delete"
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 16 }}
                                >
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
                        fontWeight: 700,
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
                            <img
                              src={author.imageUrl || '/author-placeholder.svg'}
                              crossOrigin="anonymous"
                              loading="lazy"
                              alt={author.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 800,
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
                            <div
                              style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}
                            >
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
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 10 }}
                                  >
                                    how_to_reg
                                  </span>{' '}
                                  Appointed
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 700,
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
                          Filter authors
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
                        }}
                      >
                        <div>
                          <label
                            htmlFor="mob-authors-search"
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
                            Filter authors
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span
                              className="material-symbols-outlined"
                              style={{
                                position: 'absolute',
                                left: 9,
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
                              id="mob-authors-search"
                              name="mobAuthorsSearch"
                              placeholder="Name or role…"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              style={{ ...inputSt, paddingLeft: 32, height: 42 }}
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="mob-authors-role"
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
                            Role classification
                          </label>
                          <select
                            id="mob-authors-role"
                            name="mobRoleFilter"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            style={{ ...selectSt, height: 42 }}
                          >
                            <option value="all">All roles</option>
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
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
        </>
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Move to Trash Vault?"
        description={`Are you sure you want to decommission "${deleteConfirm?.name}"? Their profile will be moved to the encrypted trash vault and hidden from the mobilization feed.`}
        itemName={deleteConfirm?.name || ''}
        isLoading={!!isDeleting}
      />

      <AuthorDetailModal
        author={viewingAuthor}
        isOpen={!!viewingAuthor}
        onClose={() => setViewingAuthor(null)}
        onEdit={(id) => {
          setViewingAuthor(null)
          setFormView({ mode: 'edit', authorId: id })
        }}
      />
    </div>
  )
}

function AuthorDetailModal({
  author,
  isOpen,
  onClose,
  onEdit,
}: {
  author: Author | null
  isOpen: boolean
  onClose: () => void
  onEdit: (id: string) => void
}) {
  if (!author || !isOpen) return null

  const closeBtnSt: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'none',
    border: '1px solid hsl(var(--border))',
    borderRadius: 4,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'hsl(var(--on-surface-muted))',
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 6,
          border: '1px solid hsl(var(--border))',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner + avatar */}
        <div
          style={{
            height: 76,
            background: 'hsl(var(--container-low))',
            borderBottom: '1px solid hsl(var(--border))',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: -24,
              left: 24,
              width: 52,
              height: 52,
              borderRadius: 4,
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <img
              src={author.imageUrl || '/author-placeholder.svg'}
              crossOrigin="anonymous"
              loading="lazy"
              alt={author.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <button aria-label="Close modal" style={closeBtnSt} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Identity block */}
        <div
          style={{ padding: '36px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: 'hsl(var(--on-surface))',
                margin: '0 0 10px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {author.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="pill pill-ok" style={{ fontWeight: 700, fontSize: 11 }}>
                {author.role || 'Contributor'}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13, opacity: 0.5 }}>
                  shield
                </span>
                Id:{' '}
                <span style={{ fontFamily: 'monospace', letterSpacing: 'normal' }}>
                  {author.id.substring(0, 8)}
                </span>
              </span>
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => onEdit(author.id)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              edit
            </span>
            Modify Credentials
          </button>

          {/* Bio */}
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                format_quote
              </span>
              Editorial mission & biography
            </p>
            <div
              style={{
                position: 'relative',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '14px 16px 14px 20px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'hsl(var(--primary))',
                  borderRadius: '4px 0 0 4px',
                  opacity: 0.25,
                }}
              />
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.75,
                  fontStyle: 'italic',
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                {author.bio ||
                  'No biography has been added for this editorial profile. Strategic intelligence suggests adding a bio to increase perceived authority.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            background: 'hsl(var(--container-low))',
            borderTop: '1px solid hsl(var(--border))',
            padding: '16px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Date enlisted
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, color: 'hsl(var(--primary))', opacity: 0.45 }}
                >
                  calendar_today
                </span>
                {format(new Date(author.createdAt), 'MMM dd, yyyy')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Security status
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 6,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--primary))',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'hsl(var(--primary))',
                    boxShadow: '0 0 8px rgba(0,107,63,0.4)',
                  }}
                />
                Authorized duty
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
              fontWeight: 700,
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
    </div>,
    document.body
  )
}
