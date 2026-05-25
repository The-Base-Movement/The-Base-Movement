import React from 'react'

export interface DashboardFilterControlsProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  activeTab: 'ghana' | 'diaspora'
  setActiveTab: (v: 'ghana' | 'diaspora') => void
  selectedRegion: string
  setSelectedRegion: (v: string) => void
  regions: string[]
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
  activeTab,
  setActiveTab,
  selectedRegion,
  setSelectedRegion,
  regions,
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
          aria-label="Search chapters…"
          name="searchTerm"
          id="input-db9159"
          type="text"
          placeholder="Search chapters…"
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

      {/* Network */}
      <div style={sectionSt}>
        <div style={headSt}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            public
          </span>
          Network
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { v: 'ghana' as const, icon: 'flag', label: 'Ghana' },
            { v: 'diaspora' as const, icon: 'public', label: 'Diaspora' },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => {
                setActiveTab(t.v)
                setSelectedRegion('All Regions')
              }}
              className={activeTab === t.v ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              style={{ justifyContent: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {t.icon}
              </span>
              <span style={{ fontSize: 11, fontWeight: 'var(--font-weight-medium, 500)' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Region (Ghana only) */}
      {activeTab === 'ghana' && regions.length > 0 && (
        <div style={sectionSt}>
          <div style={headSt}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              location_on
            </span>
            Region
          </div>
          <div style={{ position: 'relative' }}>
            <select
              name="selectedRegion"
              id="select-3eb288"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 32px 0 12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                outline: 'none',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                borderRadius: 4,
                color: 'hsl(var(--on-surface))',
                boxSizing: 'border-box',
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              expand_more
            </span>
          </div>
        </div>
      )}

      {/* Sort */}
      <div style={sectionSt}>
        <div style={headSt}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            sort
          </span>
          Sort
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { v: 'az' as const, label: 'A → Z' },
            { v: 'za' as const, label: 'Z → A' },
            { v: 'members-desc' as const, label: 'Most members' },
            { v: 'members-asc' as const, label: 'Fewest members' },
          ].map((s) => (
            <button
              key={s.v}
              onClick={() => setSortOrder(s.v)}
              className={sortOrder === s.v ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              style={{ justifyContent: 'center' }}
            >
              {s.label}
            </button>
          ))}
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
          Active chapters only
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
                Total chapters
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
          Request a chapter
        </button>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            textAlign: 'center',
            marginTop: 8,
            fontStyle: 'italic',
          }}
        >
          Don&apos;t see your region? Propose a new hub.
        </p>
      </div>
    </div>
  )
}
