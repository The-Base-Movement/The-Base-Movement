/**
 * blogs/IntelPanel.tsx
 * ─────────────────────────────────────────────────────────────────
 * Right sidebar of the blog editor — "Post Intelligence" panel.
 * Shows a live SEO quality score (0–100%) computed from 5 checks,
 * plus editable fields: resource slug, tactical tags, strategic summary
 * (meta description).
 *
 * Props:
 *  formData    — current post form state
 *  setFormData — updates form state
 */

import type { BlogPost } from '@/types/admin'
import { labelSt } from './styles'

type FormData = Omit<BlogPost, 'id'>

interface IntelPanelProps {
  formData: FormData
  setFormData: (data: FormData) => void
}

export function IntelPanel({ formData, setFormData }: IntelPanelProps) {
  /* SEO quality checks — each contributes 20% to the score */
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
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(var(--surface))',
        overflowY: 'auto',
      }}
    >
      {/* Panel header */}
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
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Post intelligence
        </span>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* SEO quality score */}
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
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              SEO quality
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 20,
                color: 'hsl(var(--primary))',
              }}
            >
              {seoScore}%
            </span>
          </div>
          {/* Score bar */}
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
          {/* Check list */}
          {seoChecks.map((chk, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
                  fontWeight: 'var(--font-weight-medium, 500)',
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

        {/* Resource slug */}
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
                fontWeight: 'var(--font-weight-medium, 500)',
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
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface))',
                flex: 1,
              }}
            />
          </div>
        </div>

        {/* Tactical tags */}
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
                    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
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
          {/* Enter-to-add tag input */}
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
              fontWeight: 'var(--font-weight-medium, 500)',
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

        {/* Strategic summary (meta description) */}
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
              fontWeight: 'var(--font-weight-medium, 500)',
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
  )
}
