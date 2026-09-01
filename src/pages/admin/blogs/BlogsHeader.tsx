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
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface BlogsHeaderProps {
  onWrite: () => void
  /** Youth Wing articles are a separate body of content with its own header, so
   * an editor can always see which readership they are writing for. */
  audience?: 'ADULT' | 'YOUTH'
}

export function BlogsHeader({ onWrite, audience = 'ADULT' }: BlogsHeaderProps) {
  const isYouth = audience === 'YOUTH'
  return (
    <AdminPageHeader
      title={isYouth ? 'Youth Wing articles' : 'Editorial command'}
      icon={isYouth ? 'auto_stories' : 'article'}
      description={
        isYouth
          ? 'Civic education articles written for members aged 14 to 17. These never appear on /blog, in the RSS feed, or in the adult member dashboard.'
          : 'Curate and publish movement news, updates, and public articles.'
      }
      actions={
        <>
          {!isYouth && (
            <Link
              to="/admin/content-calendar"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                calendar_month
              </span>
              Content Calendar
            </Link>
          )}
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
