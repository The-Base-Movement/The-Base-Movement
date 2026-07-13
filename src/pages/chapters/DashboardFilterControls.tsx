import React from 'react'
import { SortToggle } from '@/components/ui/SortToggle'

export interface DashboardFilterControlsProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  chapters: { country: string }[]
  sortOrder: 'az' | 'za' | 'members-desc' | 'members-asc'
  setSortOrder: (v: 'az' | 'za' | 'members-desc' | 'members-asc') => void
  showActiveOnly: boolean
  setShowActiveOnly: (v: boolean) => void
  onRequestChapter: () => void
}

export function DashboardFilterControls({
  searchTerm,
  setSearchTerm,
  chapters,
  sortOrder,
  setSortOrder,
  showActiveOnly,
  setShowActiveOnly,
  onRequestChapter,
}: DashboardFilterControlsProps) {
  const sectionSt = { paddingTop: 16, marginTop: 16, borderTop: '1px solid hsl(var(--border))' }
  const headSt: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 11,
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 10,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Search */}
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
          search
        </span>
        <input
          aria-label="Search Base Diaspora communities"
          name="searchTerm"
          id="input-db9159"
          type="text"
          placeholder="Search by country, city, or community"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            paddingLeft: 32,
            paddingRight: 12,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            outline: 'none',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            borderRadius: 4,
            color: 'hsl(var(--on-surface))',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Sort */}
      <div style={sectionSt}>
        <div style={headSt}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            sort
          </span>
          Sort
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <SortToggle
            value={sortOrder === 'za' ? 'desc' : 'asc'}
            onChange={(next) => setSortOrder(next === 'asc' ? 'az' : 'za')}
          />
          <button
            onClick={() =>
              setSortOrder(sortOrder === 'members-desc' ? 'members-asc' : 'members-desc')
            }
            className={
              sortOrder.startsWith('members') ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
            }
            style={{ flex: 1, justifyContent: 'center', height: 38 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              group
            </span>
            Members {sortOrder === 'members-desc' ? '↓' : sortOrder === 'members-asc' ? '↑' : ''}
          </button>
        </div>
      </div>

      {/* Active only */}
      <div style={sectionSt}>
        <button
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className={showActiveOnly ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            {showActiveOnly ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          Active communities only
        </button>
      </div>

      {/* Stats */}
      <div style={sectionSt}>
        <div style={{ background: '#181d19', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                Communities
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 22,
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {chapters.length}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  color: 'hsl(var(--accent))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                Countries
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 22,
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {new Set(chapters.map((c) => c.country)).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request button */}
      <div style={sectionSt}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onRequestChapter}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Start a Diaspora Community
        </button>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Do not see your country or city? Help bring the Base Diaspora community together where you
          live.
        </p>
      </div>
    </div>
  )
}
