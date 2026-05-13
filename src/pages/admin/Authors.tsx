import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, PenTool, Edit3, Trash2, Shield, Eye, Calendar, User, Download } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/neon-button'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { contentService } from '@/services/contentService'
import type { Author } from '@/types/admin'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { BrandLine } from '@/components/admin/BrandLine'

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

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="top">
        <div>
          <div className="crumbs uppercase font-black tracking-widest text-[9px]">
            <Link to="/admin/dashboard" className="hover:text-primary transition-colors">Admin</Link>
            {' · '}
            Editorial intelligence
          </div>
          <h2 className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Personnel directory
          </h2>
          <BrandLine />
        </div>
        <div className="actions">
          <Button variant="outline" className="h-10 px-4 text-[12px] font-bold tracking-tight rounded-sm border-border/40 gap-2">
            <Download className="w-4 h-4" /> Export records
          </Button>
          <Button 
            onClick={() => navigate('/admin/authors/new')}
            variant="primary"
            className="text-[12px] font-bold tracking-tight rounded-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Recruit author
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[14px] mb-[18px]">
        <TacticalKPI 
          label="Intelligence"
          value={authors.length}
          variant="green"
          description="Verified content creators active in command center"
          delta="Strategic personnel"
        />

        <TacticalKPI 
          label="Mobility"
          value={uniqueRoles.length}
          variant="gold"
          description="Functional diversity across all operational sectors"
          delta="Tactical roles"
        />

        <TacticalKPI 
          label="Mobilization"
          value="350k"
          variant="red"
          description="Estimated reach through editorial content distribution"
          delta="Public influence"
        />

        <TacticalKPI 
          label="Verification"
          value="100%"
          variant="black"
          description="Personnel background verification success rate"
          delta="Security protocol"
        />
      </div>

      <div className="sidebar-main">
        {/* Sidebar Filters */}
        <aside className="panel h-fit sticky top-20">
          <div className="ph">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <Search className="w-4 h-4" />
              Intelligence filters
            </h3>
          </div>
          <div className="p-5 flex flex-col gap-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Search personnel</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Name or role..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-border/40 rounded-sm text-xs font-bold outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-border/40">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Role classification</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 w-full bg-white border-border/40 text-xs font-bold rounded-sm focus:ring-primary/20">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="bg-muted/5 p-4 rounded-sm border border-border/40">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocol V01</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium italic">
                  All editorial personnel must undergo background verification before recruitment into the digital mobilization corps.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Authors Table/Grid */}
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
                  <th>Role & Authorization</th>
                  <th>Enlisted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted/5" />
                          <div className="space-y-2">
                            <div className="h-3 w-32 bg-muted/5 rounded" />
                            <div className="h-2 w-20 bg-muted/5 rounded" />
                          </div>
                        </div>
                      </td>
                      <td><div className="h-6 w-24 bg-muted/5 rounded" /></td>
                      <td><div className="h-3 w-20 bg-muted/5 rounded" /></td>
                      <td><div className="h-8 w-8 ml-auto bg-muted/5 rounded" /></td>
                    </tr>
                  ))
                ) : filteredAuthors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="w-12 h-12 bg-muted/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PenTool className="w-6 h-6 text-muted-foreground/20" />
                      </div>
                      <p className="text-sm font-bold text-on-surface">No personnel matching search criteria</p>
                      <Button variant="ghost" onClick={() => {setSearchQuery(''); setRoleFilter('all')}} className="mt-2 text-micro">Reset intelligence filters</Button>
                    </td>
                  </tr>
                ) : (
                  filteredAuthors.map((author) => (
                    <tr key={author.id}>
                      <td>
                        <div className="who">
                          <div className="w-10 h-10 rounded-full bg-muted/10 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                            {author.imageUrl ? (
                              <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground/20" />
                            )}
                          </div>
                          <div>
                            <b className="group-hover:text-primary transition-colors cursor-pointer" onClick={() => setViewingAuthor(author)}>{author.name}</b>
                            <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">{author.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pill bg-brand-green/10 text-brand-green border-brand-green/20 px-2.5 py-1">
                          {author.role || 'Contributor'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-muted-foreground/40 font-bold text-[11px]">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(author.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions justify-end">
                          <button onClick={() => setViewingAuthor(author)} className="ico" title="Intelligence Review">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/admin/authors/edit/${author.id}`)} className="ico" title="Modify Credentials">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: author.id, name: author.name })} className="ico no" title="Decommission">
                            <Trash2 className="w-4 h-4" />
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
