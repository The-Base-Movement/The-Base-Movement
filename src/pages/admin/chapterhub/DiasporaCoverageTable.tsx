import { useState, useMemo } from 'react'
import { Pagination } from '@/components/Pagination'

interface CountryStat {
  country: string
  chapters: number
  members: number
  verified: number
}

interface DiasporaCoverageTableProps {
  stats: CountryStat[]
}

const PAGE_SIZE = 15

export function DiasporaCoverageTable({ stats }: DiasporaCoverageTableProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? stats.filter((s) => s.country.toLowerCase().includes(q)) : stats
    return [...list].sort((a, b) => b.members - a.members)
  }, [stats, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div
      className="panel"
      style={{ height: '100%', maxHeight: 660, display: 'flex', flexDirection: 'column' }}
    >
      <div className="ph">
        <div>
          <h3>Diaspora coverage</h3>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-normal, 400)',
              marginTop: 2,
            }}
          >
            Members per country — sorted by presence. Use this to identify thin markets needing
            mobilization.
          </p>
        </div>
        <span className="meta">
          {filtered.length} {filtered.length === 1 ? 'country' : 'countries'}
        </span>
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            id="diaspora-coverage-search"
            name="diasporaCoverageSearch"
            aria-label="Search countries"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search country…"
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 34,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans'",
              fontSize: 12,
              fontWeight: 'var(--font-weight-medium, 500)',
              boxSizing: 'border-box',
              outline: 'none',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            padding: '32px 18px',
            textAlign: 'center',
            fontFamily: "'Public Sans'",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {search.trim() ? 'No countries match your search.' : 'No diaspora member data yet.'}
        </p>
      ) : (
        <>
          {/* Table — desktop */}
          <div
            className="desktop-only"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  fontFamily: "'Public Sans'",
                }}
              >
                <thead>
                  <tr>
                    {['Country', 'Chapters', 'Members', 'Verified', 'Coverage'].map((h) => (
                      <th
                        key={h}
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          padding: '8px 16px',
                          textAlign: 'left',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 9.5,
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                          background: 'hsl(var(--container-low))',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row, i) => {
                    const coveragePct =
                      row.members > 0 ? Math.round((row.verified / row.members) * 100) : 0
                    const coverageColor =
                      coveragePct >= 70
                        ? 'hsl(var(--primary))'
                        : coveragePct >= 40
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--destructive))'
                    return (
                      <tr
                        key={row.country}
                        style={{
                          borderBottom:
                            i < paginated.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12.5,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.country}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            fontWeight: 'var(--font-weight-normal, 400)',
                          }}
                        >
                          {row.chapters}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {row.members}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 'var(--font-weight-normal, 400)',
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                            color:
                              row.verified > 0
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {row.verified}
                        </td>
                        <td style={{ padding: '10px 16px', minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 5,
                                background: 'hsl(var(--border))',
                                borderRadius: 'var(--radius-pill)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${coveragePct}%`,
                                  height: '100%',
                                  background: coverageColor,
                                  borderRadius: 'var(--radius-pill)',
                                  transition: 'width .3s',
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                color: coverageColor,
                                minWidth: 30,
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {coveragePct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card list — mobile */}
          <div className="mobile-only" style={{ flex: 1, overflowY: 'auto' }}>
            {paginated.map((row, i) => {
              const coveragePct =
                row.members > 0 ? Math.round((row.verified / row.members) * 100) : 0
              const coverageColor =
                coveragePct >= 70
                  ? 'hsl(var(--primary))'
                  : coveragePct >= 40
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--destructive))'
              return (
                <div
                  key={row.country}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      i < paginated.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {row.country}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          marginTop: 2,
                        }}
                      >
                        {row.chapters} chapter{row.chapters !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        {row.members}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                        }}
                      >
                        members
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        width: '100%',
                        height: 5,
                        background: 'hsl(var(--border))',
                        borderRadius: 'var(--radius-pill)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${coveragePct}%`,
                          height: '100%',
                          background: coverageColor,
                          borderRadius: 'var(--radius-pill)',
                          transition: 'width .3s',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        Verified: {row.verified}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: coverageColor,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {coveragePct}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid hsl(var(--border))' }}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
