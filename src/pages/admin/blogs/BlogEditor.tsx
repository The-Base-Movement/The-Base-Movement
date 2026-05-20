import { useState, useEffect, useCallback, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { toast } from 'sonner'
import { contentService } from '@/services/contentService'
import type { BlogPost, Author } from '@/types/admin'
import { selectSt, labelSt, CATEGORIES } from './styles'

interface BlogEditorProps {
  editingPost: BlogPost | null
  formData: Omit<BlogPost, 'id'>
  setFormData: React.Dispatch<React.SetStateAction<Omit<BlogPost, 'id'>>>
  authors: Author[]
  onBack: () => void
  onSave: (finalContent: string) => Promise<void>
  isLoading: boolean
}

export function BlogEditor({
  editingPost,
  formData,
  setFormData,
  authors,
  onBack,
  onSave,
  isLoading,
}: BlogEditorProps) {
  const editorRef = useRef<{ getContent: () => string } | null>(null)
  const [showMediaPanel, setShowMediaPanel] = useState(true)
  const [showIntelPanel, setShowIntelPanel] = useState(true)
  const [mediaSearch, setMediaSearch] = useState('')
  const [activeMediaFolder, setActiveMediaFolder] = useState('blog-images')
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [mediaFolders, setMediaFolders] = useState<{ id: string; label: string }[]>([])
  const [isMediaLoading, setIsMediaLoading] = useState(false)

  const fetchMedia = useCallback(async () => {
    setIsMediaLoading(true)
    try {
      const files = await contentService.getMediaFiles(activeMediaFolder)
      setMediaFiles(files)
    } catch (err) {
      console.error('[MEDIA] Failed to fetch library:', err)
    } finally {
      setIsMediaLoading(false)
    }
  }, [activeMediaFolder])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  useEffect(() => {
    contentService.getMediaFolders().then(setMediaFolders)
  }, [])

  const handleSubmit = (e?: React.MouseEvent) => {
    e?.preventDefault()
    const editorContent = editorRef.current ? editorRef.current.getContent() : formData.content
    onSave(editorContent)
  }

  const seoChecks = [
    {
      ok: (formData.title?.length || 0) > 10 && (formData.title?.length || 0) <= 64,
      label: `Title ${formData.title?.length || 0}ch · ${(formData.title?.length || 0) <= 64 ? 'within limit' : 'too long'}`,
    },
    {
      ok: !!(formData.metaDescription && formData.metaDescription.length > 50),
      label: `Meta description ${formData.metaDescription ? `set · ${formData.metaDescription.length}ch` : 'missing'}`,
    },
    {
      ok: !!formData.imageUrl,
      label: formData.imageUrl ? 'Featured image set' : 'No featured image',
    },
    {
      ok: formData.tags.length > 0,
      label:
        formData.tags.length > 0
          ? `${formData.tags.length} tag${formData.tags.length > 1 ? 's' : ''} added`
          : 'No tags set',
    },
    {
      ok: !!(formData.excerpt && formData.excerpt.length > 80),
      label: `Excerpt ${formData.excerpt?.length || 0}ch · ${(formData.excerpt?.length || 0) > 80 ? 'good length' : 'too short'}`,
    },
  ]
  const seoScore = Math.round((seoChecks.filter((c) => c.ok).length / seoChecks.length) * 100)

  return (
    <div
      className="main animate-in fade-in duration-500 !p-0 !max-w-none flex flex-col"
      style={{
        height: 'calc(100vh - 4rem)',
        overflow: 'hidden',
        background: 'hsl(var(--background))',
      }}
    >
      {/* Top bar */}
      <div className="top !mb-0 px-6 py-3 border-b border-border/40 bg-white shrink-0">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <button
            onClick={onBack}
            className="material-symbols-outlined"
            style={{
              fontSize: 20,
              color: 'hsl(var(--on-surface-muted))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            arrow_back
          </button>
          <div>
            <div className="crumbs" style={{ marginBottom: 2 }}>
              <button
                onClick={onBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--primary))',
                }}
              >
                Editorial
              </button>
              {' · '}
              {editingPost ? 'Refining intelligence' : 'Drafting dispatch'}
            </div>
            <h2
              className="!text-sm !font-black !m-0"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {formData.title || 'Untitled Dispatch'}
              <span
                className="pill"
                style={{
                  background:
                    formData.status === 'Published' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                  color: formData.status === 'Published' ? '#fff' : 'hsl(var(--on-surface))',
                  fontSize: 10,
                }}
              >
                {formData.status}
              </span>
            </h2>
          </div>
        </div>
        <div className="actions !gap-2">
          <button
            className={showMediaPanel ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setShowMediaPanel((v) => !v)}
            title="Toggle media library"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              photo_library
            </span>
            <span className="desktop-only">Media</span>
          </button>
          <button
            className={showIntelPanel ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setShowIntelPanel((v) => !v)}
            title="Toggle post intelligence"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              tune
            </span>
            <span className="desktop-only">Intel</span>
          </button>
          <button className="btn btn-primary btn-sm" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving…' : formData.status === 'Published' ? 'Authorize' : 'Save draft'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left: media library */}
        {showMediaPanel && (
          <aside
            style={{
              width: 240,
              flexShrink: 0,
              borderRight: '1px solid hsl(var(--border))',
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                >
                  photo_library
                </span>
                <label
                  htmlFor="select-2bbe02"
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: 0,
                    cursor: 'pointer',
                  }}
                >
                  Library
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 9,
                    color: 'hsl(var(--on-surface-muted))',
                    background: 'hsl(var(--border))',
                    padding: '1px 5px',
                    borderRadius: 10,
                  }}
                >
                  {mediaFiles.length}
                </span>
                <button
                  onClick={() => fetchMedia()}
                  title="Refresh library"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    refresh
                  </span>
                </button>
              </div>
            </div>

            {/* Folder Selector */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
              <select
                name="activeMediaFolder"
                id="select-2bbe02"
                value={activeMediaFolder}
                onChange={(e) => setActiveMediaFolder(e.target.value)}
                style={{
                  ...selectSt,
                  height: 32,
                  fontSize: 11,
                  background: 'hsl(var(--background))',
                }}
              >
                {mediaFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search + upload */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                gap: 6,
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 8,
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
                  aria-label="Search…"
                  name="mediaSearch"
                  id="input-9b2cec"
                  placeholder="Search…"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: 32,
                    paddingLeft: 28,
                    paddingRight: 8,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    background: 'hsl(var(--background))',
                    outline: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface))',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <label
                title={`Upload to ${activeMediaFolder}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = await contentService.uploadImage(file, activeMediaFolder)
                    if (url) {
                      toast.success(`Uploaded to ${activeMediaFolder}`)
                      fetchMedia()
                    }
                    e.target.value = ''
                  }}
                />
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                >
                  upload
                </span>
              </label>
            </div>

            {/* Image grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 10,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 4,
                alignContent: 'start',
                position: 'relative',
              }}
            >
              {isMediaLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.7)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: '2px solid hsl(var(--border))',
                      borderTopColor: 'hsl(var(--primary))',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              )}
              {mediaFiles
                .filter(
                  (url) => !mediaSearch || url.toLowerCase().includes(mediaSearch.toLowerCase())
                )
                .map((url, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: `2px solid ${formData.imageUrl === url ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      const actions = e.currentTarget.querySelector(
                        '.img-actions'
                      ) as HTMLElement | null
                      if (actions) actions.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      const actions = e.currentTarget.querySelector(
                        '.img-actions'
                      ) as HTMLElement | null
                      if (actions) actions.style.opacity = '0'
                    }}
                  >
                    <img
                      src={url}
                      crossOrigin="anonymous"
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      alt=""
                    />
                    <div
                      className="img-actions"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        opacity: 0,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <button
                        title="Set as cover image"
                        onClick={() => setFormData({ ...formData, imageUrl: url })}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: '1px solid rgba(255,255,255,0.4)',
                          borderRadius: 3,
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '3px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 9,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          width: '80%',
                          justifyContent: 'center',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                          image
                        </span>
                        Cover
                      </button>
                      <button
                        title="Insert into article"
                        onClick={() => {
                          const editor = editorRef.current as unknown as {
                            insertContent: (html: string) => void
                          } | null
                          editor?.insertContent(
                            `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`
                          )
                        }}
                        style={{
                          background: 'hsl(var(--primary))',
                          border: 'none',
                          borderRadius: 3,
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '3px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 9,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          width: '80%',
                          justifyContent: 'center',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                          add_photo_alternate
                        </span>
                        Insert
                      </button>
                    </div>
                  </div>
                ))}
              {mediaFiles.filter(
                (url) => !mediaSearch || url.toLowerCase().includes(mediaSearch.toLowerCase())
              ).length === 0 && (
                <div style={{ gridColumn: '1/-1', padding: '24px 0', textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 32,
                      color: 'hsl(var(--on-surface-muted))',
                      opacity: 0.25,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    photo_library
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {mediaSearch ? 'No matches' : 'No assets in this folder'}
                  </span>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center: article canvas */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'hsl(var(--container-low))',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div>
              <div
                className="panel !p-0 overflow-hidden"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}
              >
                <div style={{ background: '#fff', padding: '32px 48px', minHeight: 900 }}>
                  {/* Author + category row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      borderBottom: '1px solid hsl(var(--border))',
                      paddingBottom: 20,
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'hsl(var(--primary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          fontSize: 15,
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {formData.authorImage ? (
                          <img
                            src={formData.authorImage}
                            crossOrigin="anonymous"
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt=""
                          />
                        ) : (
                          formData.authorName?.[0] || 'A'
                        )}
                      </div>
                      <div>
                        <label htmlFor="select-7efb7f" style={{ display: 'none' }}>
                          Author
                        </label>
                        <select
                          name="name-7efb7f"
                          id="select-7efb7f"
                          value={formData.authorId || authors[0]?.id}
                          onChange={(e) => {
                            const author = authors.find((a) => a.id === e.target.value)
                            if (author)
                              setFormData({
                                ...formData,
                                authorId: author.id,
                                authorName: author.name,
                                authorRole: author.role || '',
                                authorImage: author.imageUrl || '',
                                authorBio: author.bio || '',
                              })
                          }}
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {authors.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {formData.authorRole || 'Contributor'}
                        </div>
                      </div>
                    </div>
                    <label htmlFor="select-b23691" style={{ display: 'none' }}>
                      Category
                    </label>
                    <select
                      name="name-b23691"
                      id="select-b23691"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{
                        height: 34,
                        padding: '0 10px',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        outline: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title + excerpt */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <textarea
                      aria-label="Article Title…"
                      name="name-159e76"
                      id="textarea-159e76"
                      placeholder="Article Title…"
                      style={{
                        width: '100%',
                        fontSize: 36,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        outline: 'none',
                        border: 'none',
                        background: 'transparent',
                        resize: 'none',
                        minHeight: 80,
                        color: 'hsl(var(--on-surface))',
                      }}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]+/g, ''),
                        })
                      }
                    />
                    <textarea
                      aria-label="Compelling opening hook or summary…"
                      name="name-08e458"
                      id="textarea-08e458"
                      placeholder="Compelling opening hook or summary…"
                      style={{
                        width: '100%',
                        fontSize: 17,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 500,
                        lineHeight: 1.65,
                        outline: 'none',
                        border: 'none',
                        background: 'transparent',
                        resize: 'none',
                        minHeight: 70,
                        color: 'hsl(var(--on-surface-muted))',
                        fontStyle: 'italic',
                      }}
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    />
                  </div>

                  {formData.imageUrl && (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 4,
                        overflow: 'hidden',
                        aspectRatio: '16/9',
                        border: '1px solid hsl(var(--border))',
                        marginBottom: 20,
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget.querySelector('button') as HTMLElement | null
                        if (btn) btn.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget.querySelector('button') as HTMLElement | null
                        if (btn) btn.style.opacity = '0'
                      }}
                    >
                      <img
                        src={formData.imageUrl}
                        crossOrigin="anonymous"
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt=""
                      />
                      <button
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          width: 36,
                          height: 36,
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  )}

                  <div style={{ minHeight: 500 }}>
                    <Editor
                      key={editingPost?.id ?? 'new'}
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      onInit={(_, editor) => (editorRef.current = editor)}
                      initialValue={formData.content ?? ''}
                      init={{
                        height: 600,
                        menubar: false,
                        plugins: [
                          'advlist',
                          'autolink',
                          'lists',
                          'link',
                          'image',
                          'charmap',
                          'preview',
                          'searchreplace',
                          'visualblocks',
                          'insertdatetime',
                          'table',
                          'wordcount',
                        ],
                        toolbar:
                          'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link image | removeformat',
                        statusbar: false,
                        content_style:
                          'body { font-family: "Inter", sans-serif; font-size:16px; color:#1f2520; line-height:1.7; background:white; }',
                        branding: false,
                        images_upload_handler: async (blobInfo: {
                          blob: () => Blob
                          filename: () => string
                        }) => {
                          const file = new File([blobInfo.blob()], blobInfo.filename(), {
                            type: blobInfo.blob().type,
                          })
                          const url = await contentService.uploadImage(file, 'editor-content')
                          if (!url) throw new Error('Upload failed')
                          return url
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right: post intelligence */}
        {showIntelPanel && (
          <aside
            style={{
              width: 280,
              flexShrink: 0,
              borderLeft: '1px solid hsl(var(--border))',
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Post intelligence
              </span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* SEO */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    SEO quality
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {seoScore}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'hsl(var(--container-low))',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'hsl(var(--primary))',
                      width: `${seoScore}%`,
                      transition: 'width 0.7s',
                    }}
                  />
                </div>
                {seoChecks.map((chk, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: chk.ok ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                        opacity: chk.ok ? 1 : 0.3,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 10,
                        color: chk.ok ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                        opacity: chk.ok ? 1 : 0.5,
                      }}
                    >
                      {chk.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="input-7ecb7f" style={labelSt}>
                  Resource Slug
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '0 10px',
                    height: 36,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    /blog/
                  </span>
                  <input
                    name="name-7ecb7f"
                    id="input-7ecb7f"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface))',
                      flex: 1,
                    }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="input-bfbda3" style={labelSt}>
                  Tactical tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="pill pill-mute"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {tag}
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            tags: formData.tags.filter((t) => t !== tag),
                          })
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                          lineHeight: 1,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  aria-label="Type and press Enter…"
                  name="name-bfbda3"
                  id="input-bfbda3"
                  placeholder="Type and press Enter…"
                  style={{
                    width: '100%',
                    height: 32,
                    padding: '0 10px',
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim()
                      if (val && !formData.tags.includes(val)) {
                        setFormData({ ...formData, tags: [...formData.tags, val] })
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              {/* Meta description */}
              <div>
                <label htmlFor="textarea-992ac4" style={labelSt}>
                  Strategic summary
                </label>
                <textarea
                  name="name-992ac4"
                  id="textarea-992ac4"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  style={{
                    width: '100%',
                    minHeight: 90,
                    padding: 10,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    lineHeight: 1.6,
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    color: 'hsl(var(--on-surface))',
                  }}
                  placeholder="Search engine summary…"
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
