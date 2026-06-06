/**
 * blogs/MobileFilterSheet.tsx
 * ─────────────────────────────────────────────────────────────────
 * Mobile bottom-sheet portal for Blogs list view filters.
 * Only renders when isMobile + show are both true.
 * The FAB that opens this sheet lives in Blogs.tsx list view.
 *
 * Props:
 *  isMobile              — guards against mounting on desktop
 *  show / onClose        — sheet open state
 *  searchQuery / setSearchQuery
 *  statusFilter / setStatusFilter
 *  categoryFilter / setCategoryFilter
 */

import { createPortal } from 'react-dom'
import { selectSt } from './styles'
import { CATEGORIES } from './constants'

interface MobileFilterSheetProps {
  isMobile: boolean
  show: boolean
  onClose: () => void
  categoryFilter: string
  setCategoryFilter: (v: string) => void
}

/** Uppercase section label style used inside the sheet */
const sheetLabelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 8,
}

export function MobileFilterSheet({
  isMobile,
  show,
  onClose,
  categoryFilter,
  setCategoryFilter,
}: MobileFilterSheetProps) {
  if (!isMobile || !show) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 70,
          background: 'hsl(var(--surface))',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      >
        {/* Sheet header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Intelligence filters
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              close
            </span>
          </button>
        </div>

        {/* Filter fields */}
        <div
          style={{
            padding: '18px 18px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {/* Category */}
          <div>
            <label htmlFor="mob-cat-blogs" style={sheetLabelSt}>
              Category
            </label>
            <select
              id="mob-cat-blogs"
              name="mobCategoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ ...selectSt, height: 42 }}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Apply button */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', height: 44, marginTop: 4 }}
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              check
            </span>
            Apply filters
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
