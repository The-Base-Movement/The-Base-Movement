import { useState } from 'react'
import type { BlogPost } from '@/services/adminService'
import { SearchBar } from '@/components/SearchBar'

interface PublicSearchFilterProps {
  categories: string[]
  activeCategory: string
  posts: BlogPost[]
  searchQuery: string
  onCategoryChange: (cat: string) => void
  onSearchChange: (q: string) => void
}

export function PublicSearchFilter({
  categories,
  activeCategory,
  posts,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: PublicSearchFilterProps) {
  const [open, setOpen] = useState(false)
  const nonAll = categories.filter((c) => c !== 'All')
  const isFiltered = activeCategory !== 'All'

  return (
    // Always column on mobile (this component is lg:hidden)
    // Row 1: search full-width | Row 2: All + dropdown
    <div className="lg:hidden mb-6" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Row 1: Search full width */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search articles…"
        variant="public"
      />

      {/* Row 2: All + Category dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onCategoryChange('All')}
          style={{
            height: 38,
            padding: '0 16px',
            border: '1px solid',
            borderRadius: 4,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: !isFiltered ? 'hsl(var(--primary))' : 'transparent',
            color: !isFiltered ? '#fff' : 'hsl(var(--on-surface-muted))',
            borderColor: !isFiltered ? 'hsl(var(--primary))' : '#e5e7eb',
          }}
        >
          All
          <span style={{ opacity: 0.65, fontSize: 10, fontWeight: 500 }}>{posts.length}</span>
        </button>

        {nonAll.length > 0 && (
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setOpen((v) => !v)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                background: isFiltered ? 'hsl(var(--primary))' : 'transparent',
                color: isFiltered ? '#fff' : 'hsl(var(--on-surface-muted))',
                borderColor: isFiltered ? 'hsl(var(--primary))' : '#e5e7eb',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isFiltered ? activeCategory : 'Filter by category'}
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
                    right: 0,
                    zIndex: 50,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 4,
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
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          background: active ? 'rgba(0,107,63,0.06)' : 'transparent',
                          color: active ? 'var(--brand-green)' : '#374151',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          border: 'none',
                          cursor: 'pointer',
                          borderLeft: active
                            ? '3px solid var(--brand-green)'
                            : '3px solid transparent',
                          boxSizing: 'border-box',
                        }}
                      >
                        {cat}
                        <span style={{ fontWeight: 500, fontSize: 11, opacity: 0.5 }}>{count}</span>
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
