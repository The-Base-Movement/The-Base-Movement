import { useEffect } from 'react'
import type { ImpactProject } from '@/services/impactContentService'

/**
 * Read-only modal for a single charitable work: up to 4 images + full notes.
 * Opened from a card on the public /impact gallery.
 */
export function ImpactProjectModal({
  project,
  onClose,
}: {
  project: ImpactProject
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const images = project.images.slice(0, 4)
  const dateLabel = project.datePerformed
    ? new Date(project.datePerformed).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px,3vw,32px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 860,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '20px 24px 12px',
            position: 'sticky',
            top: 0,
            background: 'hsl(var(--card))',
            borderBottom: '1px solid hsl(var(--border))',
            zIndex: 1,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 'clamp(18px,3vw,24px)',
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.2,
              }}
            >
              {project.title}
            </h2>
            {(project.location || dateLabel) && (
              <p
                style={{
                  margin: '6px 0 0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {project.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      location_on
                    </span>
                    {project.location}
                  </span>
                )}
                {dateLabel && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      event
                    </span>
                    {dateLabel}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm"
            style={{ flex: '0 0 auto', padding: '4px 8px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          {/* Image grid — adapts to 1–4 images */}
          {images.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${project.title} — photo ${i + 1}`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    aspectRatio: images.length === 1 ? '16 / 9' : '4 / 3',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                  }}
                />
              ))}
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 15,
                lineHeight: 1.7,
                color: 'hsl(var(--on-surface))',
                whiteSpace: 'pre-wrap',
              }}
            >
              {project.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
