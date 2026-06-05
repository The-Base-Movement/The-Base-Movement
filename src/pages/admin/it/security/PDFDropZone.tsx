import { useState, useRef } from 'react'
import { toast } from 'sonner'

interface DropZoneProps {
  file: File | null
  onFile: (f: File | null) => void
}

export function PDFDropZone({ file, onFile }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') {
      onFile(dropped)
    } else if (dropped) {
      toast.error('Only PDF files are accepted')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        PDF Upload{' '}
        <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(optional)</span>
      </p>

      {file ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: '2px solid hsl(var(--primary))',
            borderRadius: 'var(--radius-md)',
            background: 'hsl(var(--primary) / 0.04)',
            padding: 24,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--destructive))' }}
          >
            picture_as_pdf
          </span>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 2px',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                wordBreak: 'break-all',
              }}
            >
              {file.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button type="button" onClick={() => onFile(null)} className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              close
            </span>
            Remove
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: `2px dashed ${dragging ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            borderRadius: 'var(--radius-md)',
            background: dragging ? 'hsl(var(--primary) / 0.04)' : 'hsl(var(--container-low))',
            cursor: 'pointer',
            padding: 32,
            transition: 'border-color 0.15s, background 0.15s',
            minHeight: 200,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 44,
              color: dragging ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              opacity: 0.45,
              transition: 'color 0.15s',
            }}
          >
            upload_file
          </span>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: dragging ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                transition: 'color 0.15s',
              }}
            >
              {dragging ? 'Drop the PDF here' : 'Drag & drop a PDF'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              or click to browse · max 20 MB
            </p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        id="pdf-upload"
        name="pdfUpload"
        type="file"
        accept="application/pdf"
        aria-label="Upload PDF document"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
