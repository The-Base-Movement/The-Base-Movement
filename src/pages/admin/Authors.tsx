import { useState, useEffect } from 'react'
import { Plus, Search, PenTool, Edit3, Trash2, Shield, Loader2, Eye, Calendar, Quote, User } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { BrandLine } from '@/components/ui/BrandLine'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { contentService } from '@/services/contentService'
import type { Author } from '@/types/admin'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminAuthors() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null)
  const [viewingAuthor, setViewingAuthor] = useState<Author | null>(null)
  const [roleFilter, setRoleFilter] = useState('All Roles')

  useEffect(() => {
    fetchAuthors()
  }, [])

  // Deep Link Handling for Global Search
  useEffect(() => {
    if (authors.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const viewId = params.get('view')
      if (viewId) {
        const author = authors.find(a => a.id === viewId)
        if (author) {
          // Defer to avoid synchronous setState warning
          setTimeout(() => {
            setViewingAuthor(author)
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [authors])

  const fetchAuthors = async () => {
    try {
      const data = await contentService.getAuthors()
      setAuthors(data)
    } catch (error) {
      console.error('Failed to fetch authors:', error)
      toast.error('Failed to load authors')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(deleteConfirm.id)
    
    try {
      const success = await contentService.deleteAuthor(deleteConfirm.id)
      if (success) {
        toast.success(`Author ${deleteConfirm.name} moved to trash vault`)
        setAuthors(authors.filter(a => a.id !== deleteConfirm.id))
      } else {
        toast.error('Failed to delete author')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An error occurred while deleting')
    } finally {
      setIsDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const uniqueRoles = Array.from(new Set(authors.map(a => a.role || 'Contributor'))).sort()

  const filteredAuthors = authors.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'All Roles' || (a.role || 'Contributor') === roleFilter;
    return matchesSearch && matchesRole;
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-2 font-meta">Author Directory</h1>
          <BrandLine className="mb-4" />
          <p className="text-stone-500 text-sm max-w-xl">
            Manage the official editorial profiles, biographies, and access credentials for the movement's content creators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-[10px] font-bold capitalize tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            onClick={() => window.location.href = '/admin/authors/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Provision Author
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input 
                placeholder="Search by name or role..." 
                className="pl-9 bg-white border-stone-200 focus-visible:ring-[var(--brand-red)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 py-2 text-sm font-medium rounded-md border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:border-transparent cursor-pointer"
            >
              <option value="All Roles">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-500 font-medium bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
            <Shield className="w-4 h-4 text-stone-400" />
            Authorized Editorial Personnel: <span className="text-stone-900 font-bold ml-1">{authors.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-stone-500 capitalize tracking-tight bg-stone-50/80 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 font-bold">Author Profile</th>
                <th className="px-6 py-4 font-bold">Role & Title</th>
                <th className="px-6 py-4 font-bold">Date Added</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-red)]" />
                      <span>Loading editorial profiles...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAuthors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-400 mb-3">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <p className="text-stone-500 font-medium">No authors found.</p>
                  </td>
                </tr>
              ) : (
                filteredAuthors.map((author) => (
                  <tr key={author.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden shrink-0 border border-stone-300">
                          {author.imageUrl ? (
                            <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                              <PenTool className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 group-hover:text-[var(--brand-red)] transition-colors">
                            {author.name}
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5 max-w-[200px] truncate">
                            {author.bio || 'No biography provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-700">
                        {author.role || 'Contributor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-xs font-medium">
                      {format(new Date(author.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-10 w-10 text-stone-500 hover:text-brand-green border-stone-200 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95"
                          onClick={() => setViewingAuthor(author)}
                          title="View Profile"
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-10 w-10 text-stone-500 hover:text-accent border-stone-200 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95"
                          onClick={() => window.location.href = `/admin/authors/edit/${author.id}`}
                          title="Edit Profile"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-10 w-10 text-stone-400 hover:text-destructive border-stone-200 hover:bg-destructive/10 rounded-sm transition-all shadow-sm active:scale-95"
                          onClick={() => setDeleteConfirm({ id: author.id, name: author.name })}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DeleteConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Move to Trash Vault?"
        description={`Are you sure you want to move ${deleteConfirm?.name} to the trash? Their profile will be hidden from the platform but can be restored within 30 days.`}
        itemName={deleteConfirm?.name || ''}
        isLoading={isDeleting === deleteConfirm?.id}
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
  if (!author) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-white border-stone-200 p-0 overflow-hidden rounded-sm shadow-2xl">
        <div className="h-32 bg-stone-100 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-stone-200 overflow-hidden shadow-lg">
              {author.imageUrl ? (
                <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-16 px-8 pb-8">
          <DialogHeader className="sr-only">
            <DialogTitle>{author.name} Profile</DialogTitle>
            <DialogDescription>Viewing editorial profile for {author.name}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 font-meta tracking-tight">{author.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                  {author.role || 'Contributor'}
                </span>
                <span className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-stone-300" />
                  Editorial ID: <span className="text-stone-600 font-mono">{author.id.substring(0, 8)}</span>
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="text-xs font-bold uppercase tracking-wider"
              onClick={() => window.location.href = `/admin/authors/edit/${author.id}`}
            >
              <Edit3 className="w-3.5 h-3.5 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Quote className="w-4 h-4 text-stone-300" />
                Biography & Editorial Mission
              </h3>
              <div className="text-stone-600 text-base leading-relaxed bg-stone-50/50 p-6 rounded-sm border border-stone-100 italic relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-brand-red transition-colors" />
                {author.bio || "No biography has been established for this editorial profile. Profiles without biographies may appear less authoritative to the mobilization base."}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-50/80 border-t border-stone-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter mb-0.5">Enlisted Date</span>
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-stone-400" />
                {format(new Date(author.createdAt), 'MMMM dd, yyyy')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter mb-0.5">Current Status</span>
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Active Duty
              </span>
            </div>
          </div>
          <div className="text-[10px] text-stone-300 font-bold uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Verified Editorial Personnel
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
