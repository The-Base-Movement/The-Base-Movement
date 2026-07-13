import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import type { Author, Member } from '@/types/admin'

interface AuthorFormProps {
  mode: 'create' | 'edit'
  authorId?: string
  onClose: () => void
  onSuccess: () => void
}

export function AuthorForm({ mode, authorId, onClose, onSuccess }: AuthorFormProps) {
  const isEditing = mode === 'edit'

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState<Partial<Author>>({
    name: '',
    slug: '',
    role: '',
    bio: '',
    imageUrl: '',
  })
  const [availableRoles, setAvailableRoles] = useState<string[]>([])

  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([])
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [searchType, setSearchType] = useState<'name' | 'id' | 'phone'>('name')

  useEffect(() => {
    if (isEditing && authorId) {
      contentService
        .getAuthorById(authorId)
        .then((author) => {
          if (author) {
            setFormData(author)
          } else {
            toast.error('Author profile not found.')
            onClose()
          }
          setIsLoading(false)
        })
        .catch(() => {
          toast.error('Failed to load author profile.')
          setIsLoading(false)
        })
    }
  }, [authorId, isEditing, onClose])

  useEffect(() => {
    contentService.getAuthorRoles().then(setAvailableRoles)
  }, [])

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({ ...prev, name, slug: !isEditing ? generateSlug(name) : prev.slug }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const url = await contentService.uploadImage(file, 'author-images')
      if (url) {
        setFormData((prev) => ({ ...prev, imageUrl: url }))
        toast.success('Portrait uploaded successfully')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('Upload error')
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleMemberSearch = async (query: string) => {
    setMemberSearchQuery(query)
    if (query.length < 2) {
      setMemberSearchResults([])
      return
    }
    setIsSearchingMembers(true)
    try {
      const results = await adminService.searchMembers(query, searchType)
      setMemberSearchResults(results)
    } catch {
      // silently fail — results just won't show
    } finally {
      setIsSearchingMembers(false)
    }
  }

  const selectMember = (member: Member) => {
    setSelectedMember(member)
    setFormData((prev) => ({
      ...prev,
      name: member.name,
      slug: generateSlug(member.name),
      imageUrl: member.avatarUrl || '',
      role: member.profession || '',
      memberId: member.authId,
    }))
    setMemberSearchQuery('')
    setMemberSearchResults([])
    toast.success(`"${member.name}" identified — credentials pre-filled.`)
  }

  const clearMemberSelection = () => {
    setSelectedMember(null)
    setFormData({ name: '', slug: '', role: '', bio: '', imageUrl: '' })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Full Name and Slug are required.')
      return
    }
    setIsSaving(true)
    try {
      let result: Author | boolean = false
      if (isEditing && authorId) {
        result = await contentService.updateAuthor(authorId, formData)
        if (result) toast.success('Author updated successfully')
      } else {
        result = await contentService.createAuthor(formData as Omit<Author, 'id' | 'createdAt'>)
        if (result) toast.success('Personnel recruited successfully')
      }
      if (result) {
        onSuccess()
      } else {
        toast.error(isEditing ? 'Failed to update author' : 'Failed to create author')
      }
    } catch {
      toast.error('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 16px',
    background: 'hsl(var(--container-low))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 'var(--font-weight-medium, 500)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 36,
              color: 'hsl(var(--primary))',
              animation: 'spin 1.5s linear infinite',
              display: 'block',
            }}
          >
            sync
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 14,
            }}
          >
            Loading profile
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Form actions bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, animation: 'spin 1.5s linear infinite' }}
              >
                sync
              </span>
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                save
              </span>
              {isEditing ? 'Save changes' : 'Finalise recruitment'}
            </>
          )}
        </button>
      </div>

      <div className="main-sidebar">
        {/* Left: main fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Member appointment search — only on new */}
          {!isEditing && (
            <div className="panel" style={{ overflow: 'visible' }}>
              <div className="ph">
                <div>
                  <h3>Tactical Personnel Search</h3>
                  <span className="meta">Appoint an existing member</span>
                </div>
                {selectedMember && (
                  <button
                    onClick={clearMemberSelection}
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      color: 'hsl(var(--destructive))',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                {!selectedMember ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(['name', 'id', 'phone'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          style={{ flexShrink: 0 }}
                          className={
                            searchType === type
                              ? 'btn btn-primary btn-sm'
                              : 'btn btn-outline btn-sm'
                          }
                          onClick={() => {
                            setSearchType(type)
                            setMemberSearchQuery('')
                            setMemberSearchResults([])
                          }}
                        >
                          {type === 'name' ? 'Name' : type === 'id' ? 'Member ID' : 'Phone'}
                        </button>
                      ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 18,
                          color: 'hsl(var(--on-surface-muted))',
                          opacity: 0.4,
                          pointerEvents: 'none',
                        }}
                      >
                        search
                      </span>
                      <input
                        aria-label="Search members"
                        name="memberSearchQuery"
                        id="author-member-search"
                        placeholder={
                          searchType === 'name'
                            ? 'Search by full name…'
                            : searchType === 'id'
                              ? 'Search by member ID…'
                              : 'Search by phone number…'
                        }
                        style={{ ...inputSt, paddingLeft: 44, paddingRight: 16, height: 46 }}
                        value={memberSearchQuery}
                        onChange={(e) => handleMemberSearch(e.target.value)}
                      />
                      {isSearchingMembers && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 18,
                              color: 'hsl(var(--primary))',
                              animation: 'spin 1.5s linear infinite',
                            }}
                          >
                            sync
                          </span>
                        </div>
                      )}
                      {memberSearchResults.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            zIndex: 100,
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 6,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                            {memberSearchResults.map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => selectMember(member)}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '12px 16px',
                                  background: 'none',
                                  border: 'none',
                                  borderBottom: '1px solid hsl(var(--border))',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontFamily: "'Public Sans', sans-serif",
                                }}
                              >
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    background: 'hsl(var(--container-low))',
                                    border: '1px solid hsl(var(--border))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                  }}
                                >
                                  {member.avatarUrl ? (
                                    <img
                                      src={member.avatarUrl}
                                      crossOrigin="anonymous"
                                      loading="lazy"
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: 20, opacity: 0.3 }}
                                    >
                                      person
                                    </span>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 'var(--font-weight-medium, 500)',
                                      color: 'hsl(var(--on-surface))',
                                      margin: 0,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {member.name}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 'var(--font-weight-medium, 500)',
                                      color: 'hsl(var(--on-surface-muted))',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                      margin: '2px 0 0',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {member.id.substring(0, 12)} · {member.region}
                                  </p>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    color: 'hsl(var(--primary))',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    flexShrink: 0,
                                  }}
                                >
                                  Appoint
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: 14,
                      borderRadius: 4,
                      background: 'hsla(var(--primary), 0.05)',
                      border: '1px solid hsla(var(--primary), 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: 'hsla(var(--primary), 0.1)',
                        border: '2px solid hsla(var(--primary), 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {selectedMember.avatarUrl ? (
                        <img
                          src={selectedMember.avatarUrl}
                          crossOrigin="anonymous"
                          loading="lazy"
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
                        >
                          person
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 4,
                        }}
                      >
                        <b
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 160,
                          }}
                        >
                          {selectedMember.name}
                        </b>
                        <span className="pill pill-ok" style={{ fontSize: 10, flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                            check
                          </span>{' '}
                          Appointed
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selectedMember.id.substring(0, 16)}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 9,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--primary))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontStyle: 'italic',
                        flexShrink: 0,
                      }}
                    >
                      Mapped
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Identity fields */}
          <div className="panel">
            <div className="ph">
              <div>
                <h3>Identity &amp; Editorial Mission</h3>
                <span className="meta">Required credentials</span>
              </div>
            </div>
            <div
              style={{
                padding: '16px 20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="af-name" className="field-label">
                    Full Professional Name
                  </label>
                  <input
                    id="af-name"
                    name="af-name"
                    aria-label="e.g. Kwame Compatriot"
                    placeholder="e.g. Kwame Compatriot"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    style={inputSt}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="af-slug" className="field-label">
                    Tactical Slug
                  </label>
                  <input
                    id="af-slug"
                    name="af-slug"
                    aria-label="kwame-compatriot"
                    placeholder="kwame-compatriot"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    style={inputSt}
                    required
                  />
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontStyle: 'italic',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                      margin: 0,
                    }}
                  >
                    Used for URI resolution. Must be unique.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="af-role" className="field-label">
                  Official Title / Authorization Role
                </label>
                <select
                  id="af-role"
                  name="af-role"
                  value={formData.role || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  style={{ ...inputSt, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">— Select a role —</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="af-bio" className="field-label">
                  Professional Biography
                </label>
                <textarea
                  id="af-bio"
                  name="af-bio"
                  aria-label="Provide a comprehensive biography"
                  placeholder="Provide a comprehensive biography detailing editorial history and movement contributions…"
                  value={formData.bio || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: 160,
                    padding: 16,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 500,
                    outline: 'none',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: portrait + security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="ph">
              <div>
                <h3>Personnel Portrait</h3>
                <span className="meta">Visual identification</span>
              </div>
            </div>
            <div
              style={{
                padding: '16px 20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                style={{
                  aspectRatio: '1/1',
                  width: '100%',
                  maxWidth: 200,
                  margin: '0 auto',
                  borderRadius: 4,
                  background: 'hsl(var(--container-low))',
                  border: '2px dashed hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={formData.imageUrl || '/author-placeholder.svg'}
                  crossOrigin="anonymous"
                  loading="lazy"
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {isUploading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      zIndex: 10,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 32,
                        color: 'hsl(var(--primary))',
                        animation: 'spin 1.5s linear infinite',
                      }}
                    >
                      sync
                    </span>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="af-portrait-upload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="af-portrait-upload"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    upload
                  </span>
                  {isUploading ? 'Uploading…' : 'Upload Portrait'}
                </label>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '10px 0 0',
                  }}
                >
                  1:1 ratio · max 2 MB
                </p>
              </div>
            </div>
          </div>

          <div
            className="panel"
            style={{ borderStyle: 'dashed', background: 'hsl(var(--container-low))' }}
          >
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--primary))', opacity: 0.4 }}
                >
                  shield
                </span>
                <h4
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  Security Protocol
                </h4>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Author profiles are publicly accessible. Ensure all biographical information
                complies with movement security guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
