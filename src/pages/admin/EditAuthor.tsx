import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, Loader2, Save, Image as ImageIcon, Search, User, Check, X } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { BrandLine } from '@/components/ui/BrandLine'
import { contentService } from '@/services/contentService'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import type { Author, Member } from '@/types/admin'

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

  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([])
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

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

  const handleMemberSearch = async (query: string) => {
    setMemberSearchQuery(query)
    if (query.length < 2) {
      setMemberSearchResults([])
      return
    }

    setIsSearchingMembers(true)
    try {
      const results = await adminService.searchMembers(query)
      setMemberSearchResults(results)
    } catch (error) {
      console.error('Member search error:', error)
    } finally {
      setIsSearchingMembers(false)
    }
  }

  const selectMember = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      ...formData,
      name: member.name,
      slug: generateSlug(member.name),
      imageUrl: member.avatarUrl || '',
      role: member.profession || ''
    })
    setMemberSearchQuery('')
    setMemberSearchResults([])
    toast.success(`Personnel identified: ${member.name}. Profile pre-filled.`)
  }

  const clearMemberSelection = () => {
    setSelectedMember(null)
    setFormData({
      name: '',
      slug: '',
      role: '',
      bio: '',
      imageUrl: ''
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="admin-page-container max-w-4xl animate-in fade-in duration-500">
      <Breadcrumbs currentLabel={formData.name} />
      
      {/* Header */}
      <div className="flex-columns items-center">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface font-meta mb-2">
            {isEditing ? 'Edit Editorial Profile' : 'New Editorial Profile'}
          </h1>
          <BrandLine className="mb-4" />
          <p className="text-muted-foreground/80 text-sm">
            Configure credentials and biographical information for the movement's content creators.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8 space-y-8">
            
            {!isEditing && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <h3 className="text-sm font-bold text-on-surface capitalize tracking-tight">Personnel Search</h3>
                  {selectedMember && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={clearMemberSelection}
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/5 text-[10px] font-bold capitalize tracking-tight"
                    >
                      <X className="w-3 h-3 mr-1" /> Reset selection
                    </Button>
                  )}
                </div>

                {!selectedMember ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search by name or phone number to identify movement personnel..."
                      className="pl-10 h-12 border-border/60 focus-visible:ring-on-surface bg-muted/5 placeholder:italic"
                      value={memberSearchQuery}
                      onChange={(e) => handleMemberSearch(e.target.value)}
                    />
                    
                    {isSearchingMembers && (
                      <div className="absolute right-3 top-3.5">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}

                    {memberSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-border/60 rounded-sm shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-60 overflow-y-auto">
                          {memberSearchResults.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => selectMember(member)}
                              className="w-full flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors text-left border-b border-border/5 last:border-0"
                            >
                              <div className="w-10 h-10 rounded-full bg-muted/10 border border-border/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt="" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                                ) : (
                                  <User className="w-5 h-5 text-muted-foreground/40" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">{member.name}</p>
                                <p className="text-[10px] text-muted-foreground/60 truncate">{member.id} • {member.region} • {member.profession}</p>
                              </div>
                              <div className="text-[10px] font-bold capitalize tracking-tight text-primary opacity-0 group-hover:opacity-100 transition-opacity">Select</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-green/5 border border-brand-green/20 animate-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedMember.avatarUrl ? (
                        <img src={selectedMember.avatarUrl} alt="" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                      ) : (
                        <User className="w-6 h-6 text-brand-green" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                        {selectedMember.name}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[9px] capitalize font-bold tracking-tight">
                          <Check className="w-2 h-2" /> Identified
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/80">{selectedMember.id} • {selectedMember.phone}</p>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/40 italic">Personnel data successfully mapped.</p>
                  </div>
                )}
              </div>
            )}

            {/* Identity Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-on-surface capitalize tracking-tight border-b border-border/10 pb-2">Identity & Role</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-on-surface/80">Full Name</Label>
                  <Input 
                    placeholder="e.g. Kwame Patriot"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    className="border-border/60 focus-visible:ring-on-surface"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-on-surface/80">Unique Slug</Label>
                  <Input 
                    placeholder="kwame-patriot"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="border-border/60 focus-visible:ring-on-surface bg-muted/5"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground/80">Used for URL generation. Must be unique.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-on-surface/80">Official Title / Role</Label>
                <Input 
                  placeholder="e.g. Senior Regional Coordinator"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="border-border/60 focus-visible:ring-on-surface"
                />
              </div>
            </div>

            {/* Profile Media */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-on-surface capitalize tracking-tight border-b border-border/10 pb-2">Profile Media</h3>
              
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-32 h-32 rounded-sm bg-muted/10 border-2 border-dashed border-border/40 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                      <div className="absolute inset-0 bg-on-surface/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground/40 p-4">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span className="text-[10px] capitalize tracking-tight font-bold">No Image</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 flex-1 w-full">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-on-surface/80">Image URL</Label>
                    <Input 
                      placeholder="https://..."
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="border-border/60 focus-visible:ring-on-surface"
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
                        className="flex items-center gap-2 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-on-surface/80 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-border/60"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground/80">Recommended: Square ratio, at least 400x400px.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Biographical Data */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-on-surface capitalize tracking-tight border-b border-border/10 pb-2">Biographical Information</h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-bold text-on-surface/80">Professional Biography</Label>
                <Textarea 
                  placeholder="Provide a comprehensive biography detailing the author's contributions to the movement..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="min-h-[150px] border-border/60 focus-visible:ring-on-surface resize-y"
                />
              </div>
            </div>

          </CardContent>
          <div className="p-6 border-t border-border/10 bg-muted/5 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/authors')}
              className="border-border/40 hover:bg-stone-50 transition-all rounded-sm text-[10px] font-bold capitalize tracking-tight h-12 px-8"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSaving}
              className="px-10 h-12 rounded-sm shadow-lg shadow-brand-green/20 text-[10px] font-bold capitalize tracking-tight"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
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
