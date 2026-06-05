import React from 'react'

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}
const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

export interface DashboardRequestModalProps {
  chapterLocation: string
  setChapterLocation: (v: string) => void
  chapterDescription: string
  setChapterDescription: (v: string) => void
  isSubmitting: boolean
  submissionSuccess: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function DashboardRequestModal({
  chapterLocation,
  setChapterLocation,
  chapterDescription,
  setChapterDescription,
  isSubmitting,
  submissionSuccess,
  onClose,
  onSubmit,
}: DashboardRequestModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: 480,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            background: '#181d19',
            borderTop: '3px solid hsl(var(--primary))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              account_balance
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 15,
                color: '#fff',
              }}
            >
              Request a chapter
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.5,
            }}
          >
            Proposals are reviewed by the National Executive Committee for strategic alignment.
          </p>
        </div>

        {submissionSuccess ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 40,
                color: 'hsl(var(--primary))',
                display: 'block',
                marginBottom: 12,
              }}
            >
              send
            </span>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 15,
                color: 'hsl(var(--on-surface))',
                marginBottom: 6,
              }}
            >
              Request Submitted
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Your proposal for <strong>{chapterLocation}</strong> has been logged. Coordinators
              will contact you shortly.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label htmlFor="input-c66f5d" style={labelSt}>
                Chapter location / country
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  location_on
                </span>
                <input
                  aria-label="e.g. Kumasi, Ashanti Region or London, UK"
                  name="chapterLocation"
                  id="input-c66f5d"
                  required
                  placeholder="e.g. Kumasi, Ashanti Region or London, UK"
                  value={chapterLocation}
                  onChange={(e) => setChapterLocation(e.target.value)}
                  style={{ ...inputSt, paddingLeft: 32 }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="textarea-3c577c" style={labelSt}>
                Why start a chapter here?
              </label>
              <textarea
                aria-label="Describe local interest and your vision for organizing this hub…"
                name="chapterDescription"
                id="textarea-3c577c"
                required
                rows={4}
                placeholder="Describe local interest and your vision for organizing this hub…"
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
                style={{
                  ...inputSt,
                  height: 'auto',
                  padding: '10px 12px',
                  resize: 'none',
                  lineHeight: 1.55,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                paddingTop: 8,
                borderTop: '1px solid hsl(var(--border))',
              }}
            >
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSubmitting}
                style={{ minWidth: 120, justifyContent: 'center' }}
              >
                {isSubmitting ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
