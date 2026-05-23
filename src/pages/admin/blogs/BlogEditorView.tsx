/**
 * blogs/BlogEditorView.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full-screen blog editor (currentView === 'edit').
 * Three-pane layout:
 *  Left  — MediaLibrary (collapsible, toggled by showMediaPanel)
 *  Center — Article canvas: author, category, title, excerpt, cover image, TinyMCE
 *  Right — IntelPanel (collapsible, toggled by showIntelPanel)
 *
 * The top bar shows breadcrumb, post title + status pill, and action
 * buttons (Media toggle, Intel toggle, Save/Authorize).
 *
 * Props: see BlogEditorViewProps below.
 */

import { Editor } from '@tinymce/tinymce-react'
import type { BlogPost, Author } from '@/types/admin'
import { MediaLibrary } from './MediaLibrary'
import { IntelPanel } from './IntelPanel'
import { CATEGORIES } from './constants'

type FormData = Omit<BlogPost, 'id'>

interface BlogEditorViewProps {
  editingPost: BlogPost | null
  formData: FormData
  setFormData: (data: FormData) => void
  authors: Author[]
  isLoading: boolean
  showMediaPanel: boolean
  setShowMediaPanel: React.Dispatch<React.SetStateAction<boolean>>
  showIntelPanel: boolean
  setShowIntelPanel: React.Dispatch<React.SetStateAction<boolean>>
  editorRef: React.RefObject<{ getContent: () => string } | null>
  mediaFiles: string[]
  mediaFolders: { id: string; label: string }[]
  activeMediaFolder: string
  setActiveMediaFolder: (v: string) => void
  mediaSearch: string
  setMediaSearch: (v: string) => void
  isMediaLoading: boolean
  onRefreshMedia: () => void
  onUpload: (file: File) => Promise<void>
  onBack: () => void
  onSubmit: () => void
}

export function BlogEditorView({
  editingPost,
  formData,
  setFormData,
  authors,
  isLoading,
  showMediaPanel,
  setShowMediaPanel,
  showIntelPanel,
  setShowIntelPanel,
  editorRef,
  mediaFiles,
  mediaFolders,
  activeMediaFolder,
  setActiveMediaFolder,
  mediaSearch,
  setMediaSearch,
  isMediaLoading,
  onRefreshMedia,
  onUpload,
  onBack,
  onSubmit,
}: BlogEditorViewProps) {
  /* Called by MediaLibrary "Insert" button — injects <img> into TinyMCE */
  const handleInsert = (url: string) => {
    const editor = editorRef.current as unknown as { insertContent: (html: string) => void } | null
    editor?.insertContent(`<img src="${url}" alt="" style="max-width:100%;height:auto;" />`)
  }

  return (
    <div
      className="main animate-in fade-in duration-500 !p-0 !max-w-none flex flex-col"
      style={{
        height: 'calc(100vh - 4rem)',
        overflow: 'hidden',
        background: 'hsl(var(--background))',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="top !mb-0 px-6 py-3 border-b border-border/40 bg-white shrink-0">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Back arrow */}
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
            {/* Breadcrumb */}
            <div className="crumbs" style={{ marginBottom: 2 }}>
              <button
                onClick={onBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--primary))',
                }}
              >
                Editorial
              </button>
              {' · '}
              {editingPost ? 'Refining intelligence' : 'Drafting dispatch'}
            </div>
            {/* Post title + status pill */}
            <h2
              className="!text-sm !font-bold !m-0"
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

        {/* Top-bar actions */}
        <div className="actions !gap-2">
          {/* Toggle media library */}
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
          {/* Toggle intel panel */}
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
          {/* Save / Authorize */}
          <button className="btn btn-primary btn-sm" disabled={isLoading} onClick={onSubmit}>
            {isLoading ? 'Saving…' : formData.status === 'Published' ? 'Authorize' : 'Save draft'}
          </button>
        </div>
      </div>

      {/* ── Three-pane editor body ───────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left: media library (collapsible) */}
        {showMediaPanel && (
          <MediaLibrary
            mediaFiles={mediaFiles}
            mediaFolders={mediaFolders}
            activeMediaFolder={activeMediaFolder}
            setActiveMediaFolder={setActiveMediaFolder}
            mediaSearch={mediaSearch}
            setMediaSearch={setMediaSearch}
            isMediaLoading={isMediaLoading}
            onRefresh={onRefreshMedia}
            selectedImageUrl={formData.imageUrl ?? ''}
            onSetCover={(url) => setFormData({ ...formData, imageUrl: url })}
            onInsert={handleInsert}
            onUpload={onUpload}
          />
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
                      {/* Author avatar */}
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
                          fontWeight: 'var(--font-weight-semibold, 600)',
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
                        {/* Author select — updates name/role/image/bio from authors list */}
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
                            fontWeight: 'var(--font-weight-semibold, 600)',
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
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {formData.authorRole || 'Contributor'}
                        </div>
                      </div>
                    </div>
                    {/* Category select */}
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
                        fontWeight: 'var(--font-weight-medium, 500)',
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

                  {/* Title + excerpt textareas */}
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}
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
                        fontWeight: 'var(--font-weight-semibold, 600)',
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

                  {/* Cover image preview with remove button */}
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

                  {/* TinyMCE editor — keyed by post id to force re-mount on post change */}
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
                          const { contentService } = await import('@/services/contentService')
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

        {/* Right: intel panel (collapsible) */}
        {showIntelPanel && <IntelPanel formData={formData} setFormData={setFormData} />}
      </div>
    </div>
  )
}
