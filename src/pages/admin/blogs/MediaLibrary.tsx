/**
 * blogs/MediaLibrary.tsx
 * ─────────────────────────────────────────────────────────────────
 * Left sidebar of the blog editor. Displays the media image library
 * for the active folder with search, upload, and per-image actions:
 *  • Cover  — sets the image as the post's featured image
 *  • Insert — inserts an <img> tag into the TinyMCE editor
 *
 * Props:
 *  mediaFiles / mediaFolders / activeMediaFolder / setActiveMediaFolder
 *  mediaSearch / setMediaSearch
 *  isMediaLoading / onRefresh
 *  selectedImageUrl — currently set cover image (used for selected border)
 *  onSetCover       — sets post cover image
 *  onInsert         — inserts image URL into TinyMCE
 *  onUpload         — uploads a file to activeMediaFolder then refreshes
 */

import { selectSt } from './styles'

interface MediaLibraryProps {
  mediaFiles: string[]
  mediaFolders: { id: string; label: string }[]
  activeMediaFolder: string
  setActiveMediaFolder: (v: string) => void
  mediaSearch: string
  setMediaSearch: (v: string) => void
  isMediaLoading: boolean
  onRefresh: () => void
  selectedImageUrl: string
  onSetCover: (url: string) => void
  onInsert: (url: string) => void
  onUpload: (file: File) => Promise<void>
}

export function MediaLibrary({
  mediaFiles,
  mediaFolders,
  activeMediaFolder,
  setActiveMediaFolder,
  mediaSearch,
  setMediaSearch,
  isMediaLoading,
  onRefresh,
  selectedImageUrl,
  onSetCover,
  onInsert,
  onUpload,
}: MediaLibraryProps) {
  const filtered = mediaFiles.filter(
    (url) => !mediaSearch || url.toLowerCase().includes(mediaSearch.toLowerCase())
  )

  return (
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
      {/* Panel header: title, file count, refresh */}
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
              fontWeight: 'var(--font-weight-medium, 500)',
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
          {/* File count badge */}
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 9,
              color: 'hsl(var(--on-surface-muted))',
              background: 'hsl(var(--border))',
              padding: '1px 5px',
              borderRadius: 10,
            }}
          >
            {mediaFiles.length}
          </span>
          {/* Refresh */}
          <button
            onClick={onRefresh}
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

      {/* Folder selector */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
        <select
          name="activeMediaFolder"
          id="select-2bbe02"
          value={activeMediaFolder}
          onChange={(e) => setActiveMediaFolder(e.target.value)}
          style={{ ...selectSt, height: 32, fontSize: 11, background: 'hsl(var(--background))' }}
        >
          {mediaFolders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search + upload row */}
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
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface))',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* Upload button */}
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
              await onUpload(file)
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

      {/* Image grid: 3 columns, each with hover overlay */}
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
        {/* Loading overlay */}
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

        {filtered.map((url, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 4,
              overflow: 'hidden',
              border: `2px solid ${selectedImageUrl === url ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              const actions = e.currentTarget.querySelector('.img-actions') as HTMLElement | null
              if (actions) actions.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              const actions = e.currentTarget.querySelector('.img-actions') as HTMLElement | null
              if (actions) actions.style.opacity = '0'
            }}
          >
            <img
              src={url}
              crossOrigin="anonymous"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
              {/* Set as cover image */}
              <button
                title="Set as cover image"
                onClick={() => onSetCover(url)}
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
                  fontWeight: 'var(--font-weight-medium, 500)',
                  width: '80%',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                  image
                </span>
                Cover
              </button>
              {/* Insert into editor */}
              <button
                title="Insert into article"
                onClick={() => onInsert(url)}
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
                  fontWeight: 'var(--font-weight-medium, 500)',
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

        {/* Empty state */}
        {filtered.length === 0 && (
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
                fontWeight: 'var(--font-weight-medium, 500)',
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
  )
}
