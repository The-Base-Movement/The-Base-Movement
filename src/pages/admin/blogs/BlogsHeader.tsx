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

import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface BlogsHeaderProps {
  onWrite: () => void
}

export function BlogsHeader({ onWrite }: BlogsHeaderProps) {
  return (
    <AdminPageHeader
      title="Editorial command"
      icon="article"
      description="Curate and publish movement news, updates, and public articles."
      actions={
        <>
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              download
            </span>
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={onWrite}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            Write article
          </button>
        </>
      }
    />
  )
}
