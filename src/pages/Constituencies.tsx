import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SEO from '@/components/SEO'
import { constituencyService } from '@/services/constituencyService'
import { useAuth } from '@/context/AuthContext'
import { ConstituencyCard } from '@/components/ConstituencyCard'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BrandLine } from '@/components/ui/BrandLine'
import type { Constituency } from '@/types/admin'

const GHANA_REGIONS = [
  'All Regions',
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

const ITEMS_PER_PAGE = 12

export default function Constituencies() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const { user } = useAuth()
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const userConstituency = user?.user_metadata?.constituency as string | undefined

  useEffect(() => {
    constituencyService.getConstituencies().then((data) => {
      setConstituencies(data)
      setLoading(false)
    })
  }, [])

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleRegionChange(value: string) {
    setSelectedRegion(value)
    setCurrentPage(1)
  }

  function handleActiveOnlyChange(value: boolean) {
    setShowActiveOnly(value)
    setCurrentPage(1)
  }

  const filtered = constituencies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRegion = selectedRegion === 'All Regions' || c.regionName === selectedRegion
    const matchActive = showActiveOnly ? c.status === 'Active' : true
    return matchSearch && matchRegion && matchActive
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const total = constituencies.length
  const activeCount = constituencies.filter((c) => c.status === 'Active').length
  const totalMembers = constituencies.reduce((sum, c) => sum + c.memberCount, 0)

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

  const filterPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Intro */}
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Constituencies
        </p>
        <p
          style={{
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Connect with your local constituency hub
        </p>
      </div>

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
          aria-label="Search constituencies…"
          type="text"
          placeholder="Search constituencies…"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
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
            borderRadius: 'var(--radius-sm)',
            color: 'hsl(var(--on-surface))',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Region filter */}
      <div style={sectionSt}>
        <div style={headSt}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            map
          </span>
          Region
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {GHANA_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => handleRegionChange(region)}
              className={
                selectedRegion === region
                  ? 'btn btn-active-tab btn-sm'
                  : 'btn btn-inactive-tab btn-sm'
              }
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Active only */}
      <div style={sectionSt}>
        <button
          onClick={() => handleActiveOnlyChange(!showActiveOnly)}
          className={showActiveOnly ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            {showActiveOnly ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          Active constituencies only
        </button>
      </div>
    </div>
  )

  // ── Public (guest) layout ────────────────────────────────────────────────
  if (!isDashboard) {
    return (
      <div className="min-h-screen pb-20" style={{ background: 'hsl(var(--background))' }}>
        <SEO
          title="Constituencies"
          description="Explore The Base Movement's organizing presence across all 275 constituencies of Ghana and connect with the movement in your area."
        />
        {/* Page hero header */}
        <header
          style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              padding: '64px clamp(16px, 4vw, 32px) 48px',
            }}
          >
            <Breadcrumbs />
            <div style={{ marginTop: 24 }}>
              <h1
                style={{
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 16px',
                  fontFamily: "'Public Sans', sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Constituencies
              </h1>
              <BrandLine />
              <p
                style={{
                  fontSize: 14,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '20px 0 0',
                  maxWidth: 520,
                  lineHeight: 1.6,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                Browse Ghana's {total} constituencies and connect with your local chapter
                coordinator.
              </p>
            </div>
          </div>
        </header>

        {/* Mobile filter overlay */}
        {showMobileFilters && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
            }}
            onClick={() => setShowMobileFilters(false)}
          >
            <div
              style={{
                width: '100%',
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                padding: 24,
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Filter Constituencies
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowMobileFilters(false)}
                  style={{ justifyContent: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>
              {filterPanel}
            </div>
          </div>
        )}

        {/* Main content */}
        <main
          style={{ maxWidth: 1280, margin: '0 auto', padding: '40px clamp(16px, 4vw, 32px) 60px' }}
        >
          {/* KPI row */}
          <div className="kpis" style={{ marginBottom: 32 }} data-fade-stagger>
            {[
              { label: 'Constituencies', value: total, bar: 'hsl(var(--primary))' },
              { label: 'Active', value: activeCount, bar: 'hsl(var(--accent))' },
              {
                label: 'Total Members',
                value: totalMembers.toLocaleString(),
                bar: 'hsl(var(--on-surface))',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="panel"
                style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: kpi.bar,
                  }}
                />
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '0 0 6px',
                  }}
                >
                  {kpi.label}
                </p>
                <p
                  style={{
                    fontSize: 'var(--kpi-num-size)',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <div className="mobile-only" style={{ marginBottom: 16 }}>
            <button
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowMobileFilters(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                filter_list
              </span>
              Filter &amp; Search
            </button>
          </div>

          {/* Sidebar + grid */}
          <div className="sidebar-main" style={{ alignItems: 'start' }}>
            <div
              className="desktop-only"
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div className="panel" style={{ padding: 20 }}>
                {filterPanel}
              </div>
            </div>
            <div>
              {loading ? (
                <p
                  style={{
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 14,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Loading constituencies…
                </p>
              ) : paginated.length === 0 ? (
                <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 32,
                      color: 'hsl(var(--on-surface-muted))',
                      opacity: 0.3,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    location_city
                  </span>
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    No constituencies found.
                  </p>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedRegion('All Regions')
                      setShowActiveOnly(false)
                    }}
                    style={{ justifyContent: 'center' }}
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 16,
                  }}
                >
                  {paginated
                    .filter((c) => !!c && !!c.id)
                    .map((c) => (
                      <ConstituencyCard
                        key={c.id}
                        constituency={c}
                        userConstituency={userConstituency}
                      />
                    ))}
                </div>
              )}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: '1px solid hsl(var(--border))',
                  }}
                >
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{ justifyContent: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      chevron_left
                    </span>
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={
                        currentPage === i + 1 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
                      }
                      style={{ minWidth: 36, justifyContent: 'center' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{ justifyContent: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      chevron_right
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Dashboard layout ──────────────────────────────────────────────────────
  return (
    <div className="main">
      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            style={{
              width: '100%',
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              padding: 24,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Filter Constituencies
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowMobileFilters(false)}
                style={{ justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Constituencies
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            margin: '4px 0 0',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Connect with your local constituency hub
        </p>
      </div>

      {/* KPI row */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          { label: 'Constituencies', value: total, bar: 'hsl(var(--primary))' },
          { label: 'Active', value: activeCount, bar: 'hsl(var(--accent))' },
          {
            label: 'Total Members',
            value: totalMembers.toLocaleString(),
            bar: 'hsl(var(--on-surface))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile filter toggle */}
      <div className="mobile-only" style={{ marginBottom: 16 }}>
        <button
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => setShowMobileFilters(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            filter_list
          </span>
          Filter &amp; Search
        </button>
      </div>

      {/* Sidebar + grid */}
      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* Sidebar */}
        <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: 20 }}>
            {filterPanel}
          </div>
        </div>

        {/* Grid */}
        <div>
          {loading ? (
            <p
              style={{
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Loading constituencies…
            </p>
          ) : paginated.length === 0 ? (
            <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: 'hsl(var(--on-surface-muted))',
                  opacity: 0.3,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                location_city
              </span>
              <p
                style={{
                  margin: '0 0 12px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No constituencies found.
              </p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedRegion('All Regions')
                  setShowActiveOnly(false)
                }}
                style={{ justifyContent: 'center' }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {paginated
                .filter((c) => !!c && !!c.id)
                .map((c) => (
                  <ConstituencyCard
                    key={c.id}
                    constituency={c}
                    userConstituency={userConstituency}
                  />
                ))}
            </div>
          )}

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid hsl(var(--border))',
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{ justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_left
                </span>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={
                    currentPage === i + 1 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
                  }
                  style={{ minWidth: 36, justifyContent: 'center' }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{ justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_right
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
