import { useState } from 'react'
import type { BlogPost } from '@/services/adminService'
import { SearchBar } from '@/components/SearchBar'

interface CategoryFilterBarProps {
  categories: string[]
  activeCategory: string
  posts: BlogPost[]
  onCategoryChange: (cat: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function CategoryFilterBar({
  categories,
  activeCategory,
  posts,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: CategoryFilterBarProps) {
  const [open, setOpen] = useState(false)
  const nonAll = categories.filter((c) => c !== 'All')
  const isFiltered = activeCategory !== 'All'

  return (
    // Mobile: column (search full-width on row 1, buttons on row 2)
    // sm+: single row
    <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: 8, marginBottom: 24 }}>
      {/* Search — grows on desktop, full-width on mobile */}
      <div className="w-full sm:flex-1">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search articles…"
          variant="dashboard"
        />
      </div>

      {/* Row 2 on mobile / inline on desktop: All + Category dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onCategoryChange('All')}
          className={!isFiltered ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          All
          <span style={{ marginLeft: 6, fontWeight: 500, opacity: 0.65, fontSize: 10 }}>
            {posts.length}
          </span>
        </button>

        {nonAll.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen((v) => !v)}
              className={isFiltered ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isFiltered ? activeCategory : 'Category'}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, flexShrink: 0 }}>
                {open ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {open && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 50,
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    minWidth: 180,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  {nonAll.map((cat) => {
                    const count = posts.filter((p) => p.category === cat).length
                    const active = activeCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          onCategoryChange(cat)
                          setOpen(false)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          background: active ? 'hsl(var(--primary) / 0.07)' : 'transparent',
                          color: active ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          border: 'none',
                          cursor: 'pointer',
                          borderLeft: active
                            ? '3px solid hsl(var(--primary))'
                            : '3px solid transparent',
                        }}
                      >
                        {cat}
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: 10,
                            opacity: 0.5,
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
