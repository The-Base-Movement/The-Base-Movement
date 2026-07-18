import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Helpdesk } from '@/components/admin/Helpdesk'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { Pagination } from '@/components/Pagination'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { adminService } from '@/services/adminService'

interface DiasporaChapter {
  id: string
  name: string
  country: string
}

const QUICK_LINKS = [
  { to: '/admin/chapters', icon: 'public', label: 'Manage diaspora chapters' },
  { to: '/admin/chapter-ops', icon: 'hub', label: 'Chapter operations' },
  { to: '/admin/members', icon: 'group', label: 'Diaspora members' },
  { to: '/admin/broadcasts', icon: 'campaign', label: 'Diaspora communications' },
  { to: '/admin/leadership', icon: 'groups_2', label: 'Diaspora leads' },
]
const COUNTRIES_PAGE_SIZE = 20

export default function DiasporaAffairsDashboard() {
  const { setCurrentLabel } = usePageLabel()
  const [chapters, setChapters] = useState<DiasporaChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [countrySearch, setCountrySearch] = useState('')
  const [countryPage, setCountryPage] = useState(1)

  useEffect(() => {
    setCurrentLabel('Diaspora Affairs')
  }, [setCurrentLabel])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const diasporaChapters = await adminService.getDiasporaChapters()
      if (!cancelled) {
        setChapters(diasporaChapters)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const countryRows = useMemo(() => {
    const counts = new Map<string, number>()
    chapters.forEach((chapter) => {
      const country = chapter.country || 'Unassigned'
      counts.set(country, (counts.get(country) ?? 0) + 1)
    })
    return Array.from(counts, ([country, count]) => ({ country, count })).sort(
      (left, right) => right.count - left.count || left.country.localeCompare(right.country)
    )
  }, [chapters])
  const filteredCountryRows = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    if (!q) return countryRows
    return countryRows.filter((row) => row.country.toLowerCase().includes(q))
  }, [countryRows, countrySearch])
  const countryTotalPages = Math.max(1, Math.ceil(filteredCountryRows.length / COUNTRIES_PAGE_SIZE))
  const safeCountryPage = Math.min(countryPage, countryTotalPages)
  const pagedCountryRows = useMemo(() => {
    const start = (safeCountryPage - 1) * COUNTRIES_PAGE_SIZE
    return filteredCountryRows.slice(start, start + COUNTRIES_PAGE_SIZE)
  }, [filteredCountryRows, safeCountryPage])

  return (
    <div className="main">
      <AdminPageHeader
        title="Diaspora Affairs"
        icon="public"
        description="Command dashboard for diaspora chapters, chapter leads, communications, and support requests."
        actions={
          <Link to="/admin/departments/diaspora-affairs" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              apartment
            </span>
            Department queue
          </Link>
        }
      />

      <div className="kpis" style={{ marginBottom: 24 }}>
        <TacticalKPI
          label="Diaspora Chapters"
          value={loading ? '...' : chapters.length.toLocaleString()}
          variant="green"
          description="Non-Ghana chapter hubs"
        />
        <TacticalKPI
          label="Countries"
          value={loading ? '...' : countryRows.length.toLocaleString()}
          variant="gold"
          description="Countries with active hubs"
        />
        <TacticalKPI
          label="Reporting Line"
          value="NCC"
          variant="black"
          description="Diaspora affairs reports to national command"
        />
      </div>

      <div className="panel" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '13px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Diaspora operations
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 1,
            background: 'hsl(var(--border))',
          }}
        >
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--on-surface))',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 17, color: 'hsl(var(--primary))' }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24, padding: 20 }}>
        <div className="ph" style={{ marginBottom: 12 }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Chapter coverage by country
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Diaspora chapters grouped by operating country.
            </p>
          </div>
        </div>
        <div style={{ marginBottom: 12, maxWidth: 320, position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            aria-label="Filter countries"
            placeholder="Filter countries…"
            value={countrySearch}
            onChange={(e) => {
              setCountryPage(1)
              setCountrySearch(e.target.value)
            }}
            style={{
              width: '100%',
              height: 34,
              padding: '0 12px 0 32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12.5,
              boxSizing: 'border-box',
            }}
          />
        </div>
        {loading ? (
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            Loading diaspora chapters...
          </p>
        ) : filteredCountryRows.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            No diaspora chapters found.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {pagedCountryRows.map((row) => (
              <div
                key={row.country}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <span style={{ fontSize: 13, color: 'hsl(var(--on-surface))' }}>{row.country}</span>
                <span className="pill pill-mute">
                  {row.count} chapter{row.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pagination
          currentPage={safeCountryPage}
          totalPages={countryTotalPages}
          onPageChange={setCountryPage}
          totalItems={filteredCountryRows.length}
          pageSize={COUNTRIES_PAGE_SIZE}
        />
      </div>

      <div className="ph" style={{ marginBottom: 8 }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Diaspora affairs helpdesk
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Requests from diaspora chapter leads and operators.
          </p>
        </div>
      </div>
      <Helpdesk departmentId="diaspora-affairs" />
    </div>
  )
}
