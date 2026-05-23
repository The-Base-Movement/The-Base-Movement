/**
 * blogs/BlogsHeader.tsx
 * ─────────────────────────────────────────────────────────────────
 * Page header for the Blogs (Editorial Command) admin list view.
 * Renders the breadcrumb, page title, accent line, and action buttons
 * (Export placeholder + Write article).
 *
 * Props:
 *  onWrite — opens the editor to create a new post
 */

import { BrandLine } from '@/components/ui/BrandLine'

interface BlogsHeaderProps {
  onWrite: () => void
}

export function BlogsHeader({ onWrite }: BlogsHeaderProps) {
  return (
    <div className="top">
      <div>
        {/* Page title with leading icon */}
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            article
          </span>
          Editorial command
        </h2>

        {/* Decorative triple-line accent */}
        <BrandLine />
        <p
          style={{
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 12.5,
            marginTop: 6,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          Curate and publish movement news, updates, and public articles.
        </p>
      </div>

      {/* Header actions */}
      <div className="actions">
        <button className="btn btn-outline">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            download
          </span>
          Export
        </button>
        <button className="btn btn-primary" onClick={onWrite}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Write article
        </button>
      </div>
    </div>
  )
}
