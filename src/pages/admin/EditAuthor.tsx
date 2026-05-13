import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Upload, Loader2, Save, Image as ImageIcon, Search, User, Check, Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import type { Author, Member } from '@/types/admin'
import { BrandLine } from '@/components/admin/BrandLine'


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
          toast.error('Strategic Intelligence: Author profile not located in archives.')
          navigate('/admin/authors')
        }
      } catch (error) {
        console.error('Failed to fetch author:', error)
        toast.error('Communication failure with editorial vault.')
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
        toast.success('Tactical Asset: Editorial portrait uploaded successfully')
      } else {
        toast.error('Upload protocols failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Communication error during asset synchronization')
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
    toast.success(`Personnel Identified: "${member.name}". Credentials pre-filled.`)
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
      toast.error('Critical Error: Full Name and Slug are required identifiers.')
      return
    }

    setIsSaving(true)
    try {
      let success = false
      if (isEditing && id) {
        success = await contentService.updateAuthor(id, formData)
        if (success) toast.success('Editorial records updated successfully')
      } else {
        success = await contentService.createAuthor(formData as Omit<Author, 'id' | 'createdAt'>)
        if (success) toast.success('New personnel successfully recruited to editorial corps')
      }

      if (success) {
        navigate('/admin/authors')
      } else {
        toast.error(isEditing ? 'Failed to sync modifications' : 'Failed to authorize recruitment')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Operational failure during database synchronization')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Synchronizing Archives</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="top">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/authors')} className="w-10 h-10 flex items-center justify-center rounded-sm border border-border/40 bg-white hover:bg-muted/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="crumbs uppercase font-black tracking-widest text-[9px]">
              <Link to="/admin/authors" className="hover:text-primary transition-colors">Editorial</Link>
              {' · '}
              {isEditing ? 'Credential refinement' : 'Personnel recruitment'}
            </div>
            <h2 className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{isEditing ? 'manage_accounts' : 'person_add'}</span>
              {isEditing ? `Refine: ${formData.name}` : 'Recruit new personnel'}
            </h2>
            <BrandLine />
          </div>
        </div>
        <div className="actions">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/authors')}
            className="font-bold tracking-tight rounded-sm border-border/40"
          >
            Abort
          </Button>
          <Button 
            onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            variant="primary"
            disabled={isSaving}
            className="font-bold tracking-tight rounded-sm shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Authorize changes' : 'Finalize recruitment'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="main-sidebar">
        {/* Left Form Panel */}
        <div className="space-y-4">
          {!isEditing && (
            <div className="panel animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="ph">
                <h3>Tactical Personnel Search</h3>
                {selectedMember && (
                  <button onClick={clearMemberSelection} className="text-[10px] font-black uppercase text-destructive hover:underline">Reset selection</button>
                )}
              </div>
              <div className="p-6">
                {!selectedMember ? (
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <input 
                      placeholder="Identify movement personnel by name or ID..." 
                      className="w-full h-12 pl-12 pr-4 bg-muted/5 border border-border/40 rounded-sm text-sm font-bold outline-none focus:border-primary/50 transition-all placeholder:italic"
                      value={memberSearchQuery}
                      onChange={(e) => handleMemberSearch(e.target.value)}
                    />
                    {isSearchingMembers && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    )}
                    
                    {memberSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-border/40 rounded-sm shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                  <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-muted-foreground/20" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">{member.name}</p>
                                <p className="text-[10px] text-muted-foreground/60 truncate font-bold uppercase tracking-widest">{member.id.substring(0,12)} • {member.region}</p>
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-primary">Map Data</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-sm bg-brand-green/5 border border-brand-green/20 animate-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedMember.avatarUrl ? (
                        <img src={selectedMember.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-brand-green" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface flex items-center gap-2 leading-none mb-1">
                        {selectedMember.name}
                        <span className="pill bg-brand-green/10 text-brand-green !py-0.5 border-brand-green/20">
                          <Check className="w-2 h-2" /> Identified
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{selectedMember.id.substring(0,16)}</p>
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">Target Mapped</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="panel">
            <div className="ph">
              <h3>Identity & Editorial Mission</h3>
              <span className="meta">Required credentials</span>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Full Professional Name</label>
                  <input 
                    placeholder="e.g. Kwame Patriot"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    className="w-full h-11 px-4 bg-muted/5 border border-border/40 rounded-sm text-sm font-bold outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Tactical Slug</label>
                  <input 
                    placeholder="kwame-patriot"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full h-11 px-4 bg-muted/5 border border-border/40 rounded-sm text-sm font-bold outline-none focus:border-primary/50 transition-all"
                    required
                  />
                  <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter italic">Used for URI resolution. Must be unique.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Official Title / Authorization Role</label>
                <input 
                  placeholder="e.g. Senior Regional Correspondent"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full h-11 px-4 bg-muted/5 border border-border/40 rounded-sm text-sm font-bold outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Professional Biography</label>
                <textarea 
                  placeholder="Provide a comprehensive biography detailing editorial history and movement contributions..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full min-h-[160px] p-4 bg-muted/5 border border-border/40 rounded-sm text-sm font-medium leading-relaxed outline-none focus:border-primary/50 transition-all resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Asset Panel */}
        <div className="space-y-4">
          <div className="panel">
            <div className="ph">
              <h3>Personnel Portrait</h3>
              <span className="meta">Visual identification</span>
            </div>
            <div className="p-8 space-y-6">
              <div className="aspect-square w-full max-w-[200px] mx-auto rounded-sm bg-muted/5 border-2 border-dashed border-border/40 flex items-center justify-center overflow-hidden relative group shadow-inner">
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-8 h-8 text-white opacity-80" />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground/20 p-6">
                    <User className="w-12 h-12 mx-auto mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No Portrait Mapped</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Portrait Resource URI</label>
                  <input 
                    placeholder="https://..."
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full h-10 px-4 bg-muted/5 border border-border/40 rounded-sm text-xs font-bold outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                
                <div className="pt-2">
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
                    className="flex items-center justify-center gap-2 w-full h-12 bg-on-surface text-white hover:bg-on-surface/90 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Transmit Portrait'}
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center font-bold italic">Required: 1:1 Aspect Ratio, max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="panel bg-muted/5 border-dashed">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-primary/40" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-on-surface">Security Protocol</h4>
              </div>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-medium">
                Author profiles are publicly accessible. Ensure all biographical information complies with movement security guidelines and contains no sensitive logistical data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
