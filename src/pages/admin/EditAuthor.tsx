import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 40, animation: 'spin 1.5s linear infinite' }}>sync</span>
          <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'hsl(var(--on-surface-muted))', marginTop: 16 }}>Synchronizing Archives</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/admin/authors')} className="btn btn-outline" style={{ width: 40, height: 40, padding: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
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
            <div className="bl"><div /><div /><div /></div>
          </div>
        </div>
        <div className="actions">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => navigate('/admin/authors')}
          >
            Abort
          </button>
          <button 
            onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1.5s linear infinite' }}>sync</span>
                Syncing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                {isEditing ? 'Authorize changes' : 'Finalize recruitment'}
              </>
            )}
          </button>
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
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}>search</span>
                    <input aria-label="Identify movement personnel by name or ID" name="memberSearchQuery" id="input-7e0767" 
                      placeholder="Identify movement personnel by name or ID..." 
                      style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontWeight: 700, outline: 'none' }}
                      value={memberSearchQuery}
                      onChange={(e) => handleMemberSearch(e.target.value)}
                    />
                    {isSearchingMembers && (
                      <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 20, animation: 'spin 1.5s linear infinite' }}>sync</span>
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
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span className="material-symbols-outlined" style={{ fontSize: 20, opacity: 0.2, margin: 'auto' }}>person</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 4, background: 'hsla(var(--primary), 0.05)', border: '1px solid hsla(var(--primary), 0.15)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'hsla(var(--primary), 0.1)', border: '1px solid hsla(var(--primary), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {selectedMember.avatarUrl ? (
                        <img src={selectedMember.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>person</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface flex items-center gap-2 leading-none mb-1">
                        {selectedMember.name}
                        <span className="pill pill-ok">
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span> Identified
                        </span>
                      </p>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{selectedMember.id.substring(0,16)}</p>
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 900, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em', fontStyle: 'italic', margin: 0 }}>Target Mapped</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="field-label">Full Professional Name</label>
                  <input aria-label="e.g. Kwame Patriot" name="name-1fdab6" id="input-1fdab6" 
                    placeholder="e.g. Kwame Patriot"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    style={{ width: '100%', height: 44, padding: '0 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 14, fontWeight: 700, outline: 'none' }}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="field-label">Tactical Slug</label>
                  <input aria-label="kwame-patriot" name="name-11fe1a" id="input-11fe1a" 
                    placeholder="kwame-patriot"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    style={{ width: '100%', height: 44, padding: '0 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 14, fontWeight: 700, outline: 'none' }}
                    required
                  />
                  <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter italic">Used for URI resolution. Must be unique.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="field-label">Official Title / Authorization Role</label>
                <input aria-label="e.g. Senior Regional Correspondent" name="name-72ccb2" id="input-72ccb2" 
                  placeholder="e.g. Senior Regional Correspondent"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', height: 44, padding: '0 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 14, fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="field-label">Professional Biography</label>
                <textarea aria-label="Provide a comprehensive biography detailing editorial history and movement contributions" name="name-8cff23" id="textarea-8cff23" 
                  placeholder="Provide a comprehensive biography detailing editorial history and movement contributions..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  style={{ width: '100%', minHeight: 160, padding: 16, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 14, fontWeight: 500, outline: 'none', lineHeight: 1.6, resize: 'vertical' }}
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
              <div style={{ aspectRatio: '1/1', width: '100%', maxWidth: 200, margin: '0 auto', borderRadius: 4, background: 'hsl(var(--container-low))', border: '2px dashed hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }}>image</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person</span>
                    <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '8px 0 0' }}>No Portrait Mapped</p>
                  </div>
                )}
                {isUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 32, animation: 'spin 1.5s linear infinite' }}>sync</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="field-label">Portrait Resource URI</label>
                  <input aria-label="https://" name="name-0b7bed" id="input-0b7bed" 
                    placeholder="https://..."
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    style={{ width: '100%', height: 40, padding: '0 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12, fontWeight: 700, outline: 'none' }}
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
                    className="btn btn-primary"
                    style={{ width: '100%', height: 44 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span>
                    {isUploading ? 'Uploading...' : 'Transmit Portrait'}
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center font-bold italic">Required: 1:1 Aspect Ratio, max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="panel bg-muted/5 border-dashed">
            <div className="p-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--primary))', opacity: 0.4 }}>shield</span>
                <h4 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--on-surface))', margin: 0 }}>Security Protocol</h4>
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
