import { useState, useEffect } from 'react'
import { Plus, Search, PenTool, Edit3, Trash2, Shield, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
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

  useEffect(() => {
    fetchAuthors()
  }, [])

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

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-2 font-outfit">Author Directory</h1>
          <p className="text-stone-500 text-sm max-w-xl">
            Manage the official editorial profiles, biographies, and access credentials for the movement's content creators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-[var(--brand-red)] hover:bg-red-700 text-white shadow-lg shadow-red-500/20 px-6 font-bold tracking-wide"
            onClick={() => window.location.href = '/admin/authors/new'}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Author
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input 
              placeholder="Search by name or role..." 
              className="pl-9 bg-white border-stone-200 focus-visible:ring-[var(--brand-red)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-500 font-medium bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
            <Shield className="w-4 h-4 text-stone-400" />
            Authorized Editorial Personnel: <span className="text-stone-900 font-bold ml-1">{authors.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-stone-500 uppercase tracking-widest bg-stone-50/80 border-b border-stone-100">
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
                            <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
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
                          variant="ghost" 
                          size="sm" 
                          className="text-stone-500 hover:text-stone-900"
                          onClick={() => window.location.href = `/admin/authors/edit/${author.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-stone-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteConfirm({ id: author.id, name: author.name })}
                        >
                          <Trash2 className="w-4 h-4" />
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
        isDeleting={isDeleting === deleteConfirm?.id}
        actionLabel="Move to Trash"
      />
    </div>
  )
}
