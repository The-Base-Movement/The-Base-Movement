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

import { Link } from 'react-router-dom'

interface BlogsHeaderProps {
  onWrite: () => void
}

export function BlogsHeader({ onWrite }: BlogsHeaderProps) {
  return (
    <div className="top">
      <div>
        {/* Breadcrumb trail */}
        <div className="crumbs">
          <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>
            Admin
          </Link>
          {' · '} Blog intelligence
        </div>

        {/* Page title with leading icon */}
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            article
          </span>
          Editorial command
        </h2>

        {/* Decorative triple-line accent */}
        <div className="bl">
          <div />
          <div />
          <div />
        </div>
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
