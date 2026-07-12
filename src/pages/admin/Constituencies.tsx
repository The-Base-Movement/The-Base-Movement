import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { constituencyService, type MemberAssignmentIssue } from '@/services/constituencyService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'
import type { Constituency } from '@/types/admin'
import { Pagination } from '@/components/Pagination'

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

export default function AdminConstituencies() {
  const navigate = useNavigate()
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [assignmentIssues, setAssignmentIssues] = useState<MemberAssignmentIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('All Regions')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    Promise.all([
      constituencyService.getConstituencies(),
      constituencyService.getAssignmentIssues(),
    ]).then(([constituencyRows, issueRows]) => {
      setConstituencies(constituencyRows)
      setAssignmentIssues(issueRows)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const list = constituencies.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.regionName.toLowerCase().includes(search.toLowerCase())
      const matchRegion = regionFilter === 'All Regions' || c.regionName === regionFilter
      return matchSearch && matchRegion
    })
    return list.sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [constituencies, search, regionFilter, sortOrder])

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const total = constituencies.length
  const activeCount = constituencies.filter((c) => c.status === 'Active').length
  const unledCount = constituencies.filter((c) => !c.leaderId).length

  return (
    <div className="main">
      <AdminPageHeader title="Constituencies" description="Manage Ghana constituency hubs" />

      {/* KPI row */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div
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
              background: 'hsl(var(--primary))',
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
            Total
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {total}
          </p>
        </div>
        <div
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
              background: 'hsl(var(--accent))',
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
            Active
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {activeCount}
          </p>
        </div>
        <div
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
              background: 'hsl(var(--destructive))',
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
            Unled
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {unledCount}
          </p>
        </div>
        <div
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
              background: 'hsl(var(--destructive))',
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
            Assignment Issues
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {assignmentIssues.length}
          </p>
        </div>
      </div>

      {assignmentIssues.length > 0 && (
        <section className="panel" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <div className="ph">
            <div>
              <h2 style={{ margin: 0 }}>Assignment reconciliation</h2>
              <p style={{ margin: '4px 0 0', color: 'hsl(var(--on-surface-muted))' }}>
                Members whose network assignment needs administrative review
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Member', 'Platform', 'Current assignment', 'Issue'].map((label) => (
                    <th key={label} style={{ padding: 12, textAlign: 'left' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignmentIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td style={{ padding: 12 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate('/admin/members/' + issue.id)}
                      >
                        {issue.fullName}
                      </button>
                    </td>
                    <td style={{ padding: 12 }}>{issue.platform}</td>
                    <td style={{ padding: 12 }}>
                      {issue.constituency || issue.chapter || issue.region || 'Unassigned'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span className="pill pill-warn">{issue.issueCode.replaceAll('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            id="constituency-search"
            name="constituency-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search constituencies or regions..."
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 36,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              boxSizing: 'border-box',
              background: 'hsl(var(--background))',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>
        <select
          id="region-filter"
          name="region-filter"
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value)
            setCurrentPage(1)
          }}
          style={{
            height: 40,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            background: 'hsl(var(--background))',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <SortToggle value={sortOrder} onChange={setSortOrder} />
      </div>

      {/* Table — desktop */}
      <div className="panel desktop-only" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
            No constituencies found.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Name', 'Region', 'Members', 'Coordinator', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {c.name}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {c.regionName}
                  </td>
                  <td
                    style={{ padding: '12px 16px', fontSize: 13, color: 'hsl(var(--on-surface))' }}
                  >
                    {c.memberCount}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {c.leaderName ?? <span style={{ fontStyle: 'italic' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`pill ${c.status === 'Active' ? 'pill-ok' : 'pill-mute'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/admin/constituencies/${c.id}`)}
                    >
                      View Hub
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="panel mobile-only" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
            No constituencies found.
          </p>
        ) : (
          paginated.map((c) => (
            <div
              key={c.id}
              style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {c.name}
                </p>
                <span
                  className={`pill ${c.status === 'Active' ? 'pill-ok' : 'pill-mute'}`}
                  style={{ fontSize: 11, flexShrink: 0 }}
                >
                  {c.status}
                </span>
              </div>
              <p
                style={{
                  margin: '0 0 4px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {c.regionName} · {c.memberCount} member{c.memberCount !== 1 ? 's' : ''}
              </p>
              <p
                style={{
                  margin: '0 0 10px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {c.leaderName ?? <span style={{ fontStyle: 'italic' }}>No coordinator</span>}
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
                onClick={() => navigate(`/admin/constituencies/${c.id}`)}
              >
                View Hub
              </button>
            </div>
          ))
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          pageSize={ITEMS_PER_PAGE}
        />
      )}
    </div>
  )
}
