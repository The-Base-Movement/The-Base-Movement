import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { contentService } from '@/services/contentService'
import type { Author } from '@/types/admin'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

export default function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null)
  const [viewingAuthor, setViewingAuthor] = useState<Author | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const navigate = useNavigate()

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

  // Deep Link Handling for Global Search
  useEffect(() => {
    if (authors.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const viewId = params.get('view')
      if (viewId) {
        const author = authors.find(a => a.id === viewId)
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
        setAuthors(authors.filter(a => a.id !== deleteConfirm.id))
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

  const uniqueRoles = Array.from(new Set(authors.map(a => a.role || 'Contributor'))).sort()

  const filteredAuthors = authors.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || (a.role || 'Contributor') === roleFilter;
    return matchesSearch && matchesRole;
  })

  const inputSt: React.CSSProperties = { width: '100%', height: 36, padding: '0 10px 0 32px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, outline: 'none', background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }
  const selectSt: React.CSSProperties = { width: '100%', height: 36, padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, outline: 'none', background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box', appearance: 'none' }

  return (
    <div className="main">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>edit_note</span>
            Personnel directory
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Editorial intelligence — verified content creators.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
            Export records
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/authors/new')}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
            Recruit author
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <TacticalKPI label="Intelligence" value={authors.length} description="Active editorial personnel" trend={{ direction: 'neutral', value: 'Strategic' }} />
        <TacticalKPI label="Mobility" value={uniqueRoles.length} description="Distinct tactical roles" trend={{ direction: 'up', value: 'Diverse' }} />
        <TacticalKPI label="Mobilization" value="350k" description="Estimated editorial reach" trend={{ direction: 'up', value: 'Influence' }} />
        <TacticalKPI label="Verification" value="100%" description="Background clearance rate" trend={{ direction: 'up', value: 'Secure' }} />
      </div>

      <div className="sidebar-main">
        {/* Sidebar */}
        <aside className="panel" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>manage_search</span>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Intelligence filters</span>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search personnel</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                <input aria-label="Name or role…" name="searchQuery" id="input-650b52" type="text" placeholder="Name or role…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={inputSt} />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role classification</label>
              <select name="roleFilter" id="select-b631d5" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectSt}>
                <option value="all">All Roles</option>
                {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div style={{ paddingTop: 14, borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'hsl(var(--primary))' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>shield</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Protocol V01</span>
                </div>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                  All editorial personnel must undergo background verification before recruitment into the digital mobilization corps.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Table */}
        <div className="panel overflow-hidden">
          <div className="ph">
            <h3>Registered personnel</h3>
            <span className="meta">{filteredAuthors.length} records identified</span>
          </div>
          <div className="overflow-x-auto">
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
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} style={{ animation: 'pulse 2s infinite' }}>
                      <td><div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 160 }} /></td>
                      <td><div style={{ height: 22, background: 'hsl(var(--border))', borderRadius: 4, width: 90 }} /></td>
                      <td><div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 80 }} /></td>
                      <td><div style={{ height: 28, background: 'hsl(var(--border))', borderRadius: 4, width: 80, marginLeft: 'auto' }} /></td>
                    </tr>
                  ))
                ) : filteredAuthors.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--border))', display: 'block', marginBottom: 10 }}>edit_note</span>
                      <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 12 }}>No personnel matching search criteria</p>
                      <button className="btn btn-outline btn-sm" onClick={() => { setSearchQuery(''); setRoleFilter('all') }}>Reset filters</button>
                    </td>
                  </tr>
                ) : (
                  filteredAuthors.map(author => (
                    <tr key={author.id}>
                      <td>
                        <div className="who">
                          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid hsl(var(--border))', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--container-low))' }}>
                            {author.imageUrl
                              ? <img src={author.imageUrl} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>person</span>
                            }
                          </div>
                          <div>
                            <b style={{ cursor: 'pointer' }} onClick={() => setViewingAuthor(author)}>{author.name}</b>
                            <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">{author.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pill pill-ok">{author.role || 'Contributor'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
                          {format(new Date(author.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions justify-end">
                          <button onClick={() => setViewingAuthor(author)} className="ico" title="View">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                          </button>
                          <button onClick={() => navigate(`/admin/authors/edit/${author.id}`)} className="ico" title="Edit">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: author.id, name: author.name })} className="ico no" title="Delete">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
      />
    </div>
  )
}

function AuthorDetailModal({ author, isOpen, onClose }: { author: Author | null, isOpen: boolean, onClose: () => void }) {
  if (!author || !isOpen) return null

  const closeBtnSt: React.CSSProperties = {
    position: 'absolute', top: 12, right: 12,
    background: 'none', border: '1px solid hsl(var(--border))', borderRadius: 4,
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'hsl(var(--on-surface-muted))',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 6, border: '1px solid hsl(var(--border))', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner + avatar */}
        <div style={{ height: 76, background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: -24, left: 24, width: 52, height: 52, borderRadius: 4, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.14)', overflow: 'hidden', background: '#fff' }}>
            {author.imageUrl ? (
              <img src={author.imageUrl} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--container-low))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26, color: 'hsl(var(--on-surface-muted))' }}>person</span>
              </div>
            )}
          </div>
          <button style={closeBtnSt} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Identity block */}
        <div style={{ padding: '36px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 22, color: 'hsl(var(--on-surface))', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {author.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="pill pill-ok" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>
                {author.role || 'Contributor'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, opacity: 0.5 }}>shield</span>
                ID: <span style={{ fontFamily: 'monospace', letterSpacing: 'normal' }}>{author.id.substring(0, 8).toUpperCase()}</span>
              </span>
            </div>
          </div>

          <Link to={`/admin/authors/edit/${author.id}`} onClick={onClose}>
            <button className="btn btn-primary btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
              Modify Credentials
            </button>
          </Link>

          {/* Bio */}
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>format_quote</span>
              Editorial Mission & Biography
            </p>
            <div style={{ position: 'relative', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '14px 16px 14px 20px' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'hsl(var(--primary))', borderRadius: '4px 0 0 4px', opacity: 0.25 }} />
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface))', lineHeight: 1.75, fontStyle: 'italic', margin: 0, opacity: 0.7 }}>
                {author.bio || 'No biography has been added for this editorial profile. Strategic intelligence suggests adding a bio to increase perceived authority.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: 'hsl(var(--container-low))', borderTop: '1px solid hsl(var(--border))', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Date Enlisted</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5, color: 'hsl(var(--on-surface))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--primary))', opacity: 0.45 }}>calendar_today</span>
                {format(new Date(author.createdAt), 'MMM dd, yyyy').toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Security Status</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--primary))', boxShadow: '0 0 8px rgba(0,107,63,0.4)' }} />
                Authorized Duty
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
            Verified Editorial Personnel
          </div>
        </div>
      </div>
    </div>
  )
}
