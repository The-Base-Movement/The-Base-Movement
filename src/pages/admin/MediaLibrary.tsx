import { useState, useEffect, useCallback } from 'react'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'

export default function MediaLibrary() {
  const [files, setFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState('branding')
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null)

  const folders = [
    { id: 'branding', label: 'Branding Assets', icon: 'image' },
    { id: 'blog-images', label: 'Blog Posts', icon: 'image' },
    { id: 'author-images', label: 'Authors', icon: 'image' },
    { id: 'product-images', label: 'Product Images', icon: 'image' },
    { id: 'logos-favicons', label: 'Logos & Favicons', icon: 'image' },
    { id: 'public-assets', label: 'Public Assets', icon: 'image' },
    { id: 'editor-content', label: 'Editor Media', icon: 'description' },
  ]

  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load files through the centralized service which handles local-only,
      // cloud-only, and hybrid folders automatically.
      const mediaFiles = await contentService.getMediaFiles(activeFolder)
      setFiles(mediaFiles)
    } catch {
      toast.error('Failed to load media files')
    } finally {
      setIsLoading(false)
    }
  }, [activeFolder])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await contentService.uploadImage(file, activeFolder)
      if (url) {
        setFiles((prev) => [url, ...prev])
        toast.success('File uploaded successfully')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('An error occurred during upload')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success('URL copied to clipboard')
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const filteredFiles = files.filter((url) => url.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleConfirmedDelete = async () => {
    if (!assetToDelete) return

    setIsLoading(true)
    try {
      const success = await contentService.deleteMediaFile(assetToDelete)
      if (success) {
        toast.success('Asset moved to trash')
        setAssetToDelete(null)
        loadFiles()

        // Log action
        const filename = assetToDelete.split('/').pop() || 'Unknown'
        adminService.logAction('TRASH_MEDIA', `MEDIA/${filename}`, 'Success')
      } else {
        toast.error('Failed to move asset to trash')
      }
    } catch {
      toast.error('An error occurred during deletion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: 'hsl(var(--on-surface))',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              image
            </span>
            Media library
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Central repository for movement assets and deployment media.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={loadFiles}>
            Refresh vault
          </button>
          <input
            type="file"
            id="media-upload"
            style={{ display: 'none' }}
            onChange={handleUpload}
            accept="image/*"
            disabled={isUploading}
          />
          <label
            htmlFor="media-upload"
            className={`btn btn-primary btn-sm${isUploading ? ' opacity-60' : ''}`}
            style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {isUploading ? 'sync' : 'upload'}
            </span>
            {isUploading ? 'Ingesting…' : 'Ingest asset'}
          </label>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 8 }}>
        {[
          {
            label: 'Total assets',
            value: String(files.length),
            sub: 'In current vault',
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'Active folder',
            value: activeFolder,
            sub: 'Context segment',
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Storage usage',
            value: '12%',
            sub: 'Of 5.0 GB limit',
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Sync status',
            value: 'Online',
            sub: 'Supabase connected',
            bar: 'hsl(var(--primary))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '14px 18px 14px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--kpi-num-size)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 4px',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {kpi.value}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile folder selector */}
      <div className="mobile-only" style={{ marginBottom: 8 }}>
        <label htmlFor="select-7676fc" style={{ display: 'none' }}>
          Active Folder
        </label>
        <select
          name="activeFolder"
          id="select-7676fc"
          value={activeFolder}
          onChange={(e) => setActiveFolder(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            border: '1px solid hsl(var(--border))',
            borderRadius: 4,
            padding: '0 12px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            background: '#fff',
            color: 'hsl(var(--on-surface))',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        >
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: search + horizontal folder tabs */}
      <div
        className="desktop-only panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 4,
        }}
      >
        <div style={{ position: 'relative', width: 220, flexShrink: 0 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            aria-label="Search assets"
            name="searchQuery"
            placeholder="Search assets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 30,
              paddingRight: 10,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              background: 'hsl(var(--container-low))',
              color: 'hsl(var(--on-surface))',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ width: 1, height: 24, background: 'hsl(var(--border))', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {folders.map((folder) => {
            const active = activeFolder === folder.id
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  border: `1px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  borderRadius: 20,
                  background: active ? 'hsl(var(--primary))' : 'transparent',
                  color: active ? '#fff' : 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {folder.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel" style={{ minHeight: 500 }}>
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 400,
                gap: 12,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: 'hsl(var(--on-surface-muted))',
                  animation: 'spin 1s linear infinite',
                }}
              >
                sync
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Scanning repository…
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 400,
                gap: 12,
                textAlign: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 48, color: 'hsl(var(--border))' }}
              >
                image
              </span>
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                No assets found
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  maxWidth: 280,
                }}
              >
                {searchQuery
                  ? `No results match "${searchQuery}". Try a different term.`
                  : `Your ${activeFolder.replace('-', ' ')} folder is currently empty.`}
              </p>
              <label
                htmlFor="media-upload"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8, cursor: 'pointer' }}
              >
                Initialize repository
              </label>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 12,
                padding: 16,
              }}
            >
              {filteredFiles.map((url, idx) => (
                <div key={idx} className="group" style={{ position: 'relative' }}>
                  <div
                    style={{
                      aspectRatio: '1',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={url}
                      alt="Media asset"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      decoding="async"
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <button
                        onClick={() => copyToClipboard(url)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          background: 'hsl(var(--primary))',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                        title="Copy URL"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          {copiedUrl === url ? 'check' : 'content_copy'}
                        </span>
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          background: 'hsl(var(--accent))',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          textDecoration: 'none',
                        }}
                        title="Open in new tab"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          open_in_new
                        </span>
                      </a>
                      <button
                        onClick={() => setAssetToDelete(url)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          background: 'hsl(var(--destructive))',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                        title="Delete"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 6, paddingInline: 2 }}>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {url.split('/').pop()}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 2,
                      }}
                    >
                      {activeFolder.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storage panel */}
        <div
          style={{
            background: 'hsl(var(--on-surface))',
            borderRadius: 6,
            padding: '24px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                background: 'rgba(0,107,63,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 24, color: 'hsl(var(--primary))' }}
              >
                storage
              </span>
            </div>
            <div>
              <h4
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#fff',
                  marginBottom: 2,
                }}
              >
                Cloud storage intelligence
              </h4>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                Real-time usage monitoring for Supabase storage buckets.
              </p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Capacity utilization
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'hsl(var(--primary))',
                }}
              >
                12%
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '12%',
                  background: 'hsl(var(--primary))',
                  borderRadius: 99,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                0.6 GB consumed
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                5.0 GB limit
              </span>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmedDelete}
        title="Move to Trash"
        description="This asset will be moved to the trash vault. You can restore it within 30 days before it is permanently purged from storage."
        itemName={assetToDelete?.split('/').pop() || ''}
        isLoading={isLoading}
        isPermanent={false}
      />
    </div>
  )
}
