import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, Loader2, Save, Image as ImageIcon } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import type { Author } from '@/types/admin'

export default function AdminEditAuthor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState<Partial<Author>>({
    name: '',
    slug: '',
    role: '',
    bio: '',
    imageUrl: ''
  })

  useEffect(() => {
    const fetchAuthor = async (authorId: string) => {
      try {
        const author = await contentService.getAuthorById(authorId)
        if (author) {
          setFormData(author)
        } else {
          toast.error('Author not found')
          navigate('/admin/authors')
        }
      } catch (error) {
        console.error('Failed to fetch author:', error)
        toast.error('Error loading author data')
      } finally {
        setIsLoading(false)
      }
    }

    if (isEditing && id) {
      fetchAuthor(id)
    }
  }, [id, isEditing, navigate])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      const url = await contentService.uploadImage(file, 'author-images')
      if (url) {
        setFormData({ ...formData, imageUrl: url })
        toast.success('Author image uploaded successfully')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('An error occurred during upload')
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({ 
      ...formData, 
      name,
      slug: !isEditing ? generateSlug(name) : formData.slug 
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required')
      return
    }

    setIsSaving(true)
    try {
      let success = false
      if (isEditing && id) {
        success = await contentService.updateAuthor(id, formData)
        if (success) toast.success('Author profile updated successfully')
      } else {
        success = await contentService.createAuthor(formData as Omit<Author, 'id' | 'createdAt'>)
        if (success) toast.success('New author created successfully')
      }

      if (success) {
        navigate('/admin/authors')
      } else {
        toast.error(isEditing ? 'Failed to update author' : 'Failed to create author')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-red)]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <Breadcrumbs />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 font-outfit">
              {isEditing ? 'Edit Editorial Profile' : 'New Editorial Profile'}
            </h1>
            <p className="text-stone-500 text-sm">
              Configure credentials and biographical information for the movement's content creators.
            </p>
          </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8 space-y-8">
            
            {/* Identity Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">Identity & Role</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-stone-700">Full Name</Label>
                  <Input 
                    placeholder="e.g. Kwame Patriot"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    className="border-stone-200 focus-visible:ring-[var(--brand-red)]"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-stone-700">Unique Slug</Label>
                  <Input 
                    placeholder="kwame-patriot"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="border-stone-200 focus-visible:ring-[var(--brand-red)] bg-stone-50"
                    required
                  />
                  <p className="text-[10px] text-stone-500">Used for URL generation. Must be unique.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-stone-700">Official Title / Role</Label>
                <Input 
                  placeholder="e.g. Senior Regional Coordinator"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="border-stone-200 focus-visible:ring-[var(--brand-red)]"
                />
              </div>
            </div>

            {/* Profile Media */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">Profile Media</h3>
              
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-32 h-32 rounded-xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-stone-400 p-4">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">No Image</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-red)]" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 flex-1 w-full">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-stone-700">Image URL</Label>
                    <Input 
                      placeholder="https://..."
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="border-stone-200 focus-visible:ring-[var(--brand-red)]"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input 
                        type="file" 
                        id="author-image-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="author-image-upload" 
                        className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-stone-200"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </div>
                    <p className="text-xs text-stone-500">Recommended: Square ratio, at least 400x400px.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Biographical Data */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">Biographical Information</h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-bold text-stone-700">Professional Biography</Label>
                <Textarea 
                  placeholder="Provide a comprehensive biography detailing the author's contributions to the movement..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="min-h-[150px] border-stone-200 focus-visible:ring-[var(--brand-red)] resize-y"
                />
              </div>
            </div>

          </CardContent>
          <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/authors')}
              className="border-stone-200 hover:bg-stone-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-[var(--brand-red)] hover:bg-red-700 text-white shadow-lg shadow-red-500/20 px-8 font-bold tracking-wide"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Save Changes' : 'Create Profile'}
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
