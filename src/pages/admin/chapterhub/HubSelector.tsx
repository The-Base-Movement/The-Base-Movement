import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Chapter } from '@/types/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Pagination } from '@/components/Pagination'

interface HubSelectorProps {
  chapters: Chapter[]
}

export function HubSelector({ chapters }: HubSelectorProps) {
  const [hubSearch, setHubSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  const filteredHubs = chapters.filter((c) => {
    const q = hubSearch.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.city_or_region.toLowerCase().includes(q)
  })
  const totalPages = Math.ceil(filteredHubs.length / itemsPerPage)
  const currentHubs = filteredHubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="main">
      <AdminPageHeader
        title="Regional Hub Command"
        icon="shield"
        description="Select a regional chapter to view its operational telemetry and personnel."
      />

      {/* Search */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 30,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            id="hub-search"
            name="hubSearch"
            type="text"
            placeholder="Search hubs by name or region..."
            value={hubSearch}
            onChange={(e) => {
              setHubSearch(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 40,
              paddingRight: 12,
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Hub grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {currentHubs.map((h) => (
          <Link
            key={h.id}
            to={`/admin/regional-hub/${h.id}`}
            className="panel"
            style={{
              textDecoration: 'none',
              display: 'block',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 4,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 24, color: 'hsl(var(--primary))' }}
                  >
                    account_balance
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {h.city_or_region}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Personnel
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 16,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {h.member_count || 0}
                  </p>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Status
                  </p>
                  <span
                    className={`pill ${h.status === 'Active' ? 'pill-ok' : 'pill-warn'}`}
                    style={{ marginTop: 2 }}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '12px 20px',
                background: 'hsl(var(--container-low))',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--primary))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Open Hub Command
              </span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
              >
                arrow_forward
              </span>
            </div>
          </Link>
        ))}

        {filteredHubs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}
            >
              search_off
            </span>
            <p
              style={{
                marginTop: 12,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No hubs found matching your criteria.
            </p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredHubs.length}
        pageSize={itemsPerPage}
      />
    </div>
  )
}
