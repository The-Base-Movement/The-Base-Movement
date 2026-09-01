import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import YouthMembershipCard from '@/components/YouthMembershipCard'
import { YouthMembershipCardActions } from '@/components/YouthMembershipCardActions'
import { religions } from '@/components/admin/RegistrationForm.constants'
import {
  youthWingService,
  type YouthWingDirectoryFilters,
  type YouthWingDirectoryRow,
  type YouthWingStatus,
} from '@/services/youthWingService'
import { adminService } from '@/services/adminService'
import { YOUTH_STATUS_META } from './shared'

/**
 * Youth Wing member directory. A separate roll from the adult member directory:
 * these records live in youth_wing_members and are never counted as members,
 * assigned to constituencies or given leadership positions. Filtering by age
 * happens in the database (youth_wing_directory view computes the live age from
 * the stored date of birth), so it stays correct as they grow.
 */

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  boxSizing: 'border-box',
  background: 'transparent',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-xs)',
  padding: '0 10px',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 5,
}

const cellStyle: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 13,
  color: 'hsl(var(--on-surface))',
  borderBottom: '1px solid hsl(var(--border))',
  textAlign: 'left',
  verticalAlign: 'top',
}

const headStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  borderBottom: '1px solid hsl(var(--border))',
  textAlign: 'left',
}

const EMPTY_FILTERS: YouthWingDirectoryFilters = {
  status: 'all',
  gender: '',
  region: '',
  religion: '',
  search: '',
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminYouthWingDirectory() {
  const [rows, setRows] = useState<YouthWingDirectoryRow[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [filters, setFilters] = useState<YouthWingDirectoryFilters>(EMPTY_FILTERS)
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<YouthWingDirectoryRow | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setRows(
        await youthWingService.listDirectory({
          ...filters,
          minAge: minAge ? Number(minAge) : undefined,
          maxAge: maxAge ? Number(maxAge) : undefined,
        })
      )
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to load the Youth Wing directory.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, minAge, maxAge])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load()
  }, [load])

  useEffect(() => {
    adminService
      .getRegions()
      .then((data) => setRegions(data.map((r) => r.name)))
      .catch(() => setRegions([]))
  }, [])

  const set = <K extends keyof YouthWingDirectoryFilters>(
    key: K,
    value: YouthWingDirectoryFilters[K]
  ) => setFilters((prev) => ({ ...prev, [key]: value }))

  const genderSplit = useMemo(
    () =>
      rows.reduce<Record<string, number>>((acc, r) => {
        const key = r.gender || 'Unstated'
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {}),
    [rows]
  )

  function exportCsv() {
    const header = [
      'Member no.',
      'Name',
      'Date of birth',
      'Age',
      'Gender',
      'Region',
      'Country',
      'Religion',
      'Education level',
      'School',
      'Guardian',
      'Guardian relationship',
      'Guardian phone',
      'Status',
      'Joined',
    ]
    const body = rows.map((r) => [
      r.membership_number,
      r.full_name,
      r.date_of_birth,
      r.age,
      r.gender || '',
      r.region || '',
      r.country,
      r.religion || '',
      r.education_level || '',
      r.school_name || '',
      r.guardian_name,
      r.guardian_relationship,
      r.guardian_phone,
      YOUTH_STATUS_META[r.status]?.label ?? r.status,
      formatDate(r.created_at),
    ])
    const csv = [header, ...body]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'youth-wing-directory.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Youth Wing directory"
        icon="groups_2"
        description="Members aged 14 to 17. A separate roll: never counted in adult membership totals, constituency rolls or diaspora rolls."
        actions={
          <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              download
            </span>
            Export CSV
          </button>
        }
      />

      <div className="panel" style={{ padding: '18px 20px', marginBottom: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
          }}
        >
          <div>
            <label htmlFor="yw-f-search" style={labelStyle}>
              Search
            </label>
            <input
              id="yw-f-search"
              style={inputStyle}
              value={filters.search || ''}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Name or member no."
            />
          </div>
          <div>
            <label htmlFor="yw-f-status" style={labelStyle}>
              Status
            </label>
            <select
              id="yw-f-status"
              style={inputStyle}
              value={filters.status || 'all'}
              onChange={(e) => set('status', e.target.value as YouthWingStatus | 'all')}
            >
              <option value="all">All</option>
              {(Object.keys(YOUTH_STATUS_META) as YouthWingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {YOUTH_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="yw-f-gender" style={labelStyle}>
              Gender
            </label>
            <select
              id="yw-f-gender"
              style={inputStyle}
              value={filters.gender || ''}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="yw-f-region" style={labelStyle}>
              Region
            </label>
            <select
              id="yw-f-region"
              style={inputStyle}
              value={filters.region || ''}
              onChange={(e) => set('region', e.target.value)}
            >
              <option value="">All</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="yw-f-religion" style={labelStyle}>
              Religion
            </label>
            <select
              id="yw-f-religion"
              style={inputStyle}
              value={filters.religion || ''}
              onChange={(e) => set('religion', e.target.value)}
            >
              <option value="">All</option>
              {religions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="yw-f-minage" style={labelStyle}>
              Age from
            </label>
            <input
              id="yw-f-minage"
              type="number"
              min={14}
              max={18}
              style={inputStyle}
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              placeholder="14"
            />
          </div>
          <div>
            <label htmlFor="yw-f-maxage" style={labelStyle}>
              Age to
            </label>
            <input
              id="yw-f-maxage"
              type="number"
              min={14}
              max={18}
              style={inputStyle}
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              placeholder="17"
            />
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-3"
          style={{ marginTop: 14, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}
        >
          <span>
            {rows.length} record{rows.length === 1 ? '' : 's'}
          </span>
          {Object.entries(genderSplit).map(([g, n]) => (
            <span key={g}>
              {g}: {n}
            </span>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setFilters(EMPTY_FILTERS)
              setMinAge('')
              setMaxAge('')
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                <th style={headStyle}>Member no.</th>
                <th style={headStyle}>Name</th>
                <th style={headStyle}>Age</th>
                <th style={headStyle}>Gender</th>
                <th style={headStyle}>Region / country</th>
                <th style={headStyle}>Religion</th>
                <th style={headStyle}>Education</th>
                <th style={headStyle}>Status</th>
                <th style={headStyle} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td style={cellStyle} colSpan={9}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td style={{ ...cellStyle, color: 'hsl(var(--on-surface-muted))' }} colSpan={9}>
                    No Youth Wing members match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{r.membership_number}</td>
                    <td style={cellStyle}>
                      {r.full_name}
                      {r.school_name && (
                        <div style={{ fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                          {r.school_name}
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {r.age}
                      {r.has_birthday_within_30_days && (
                        <span
                          className="pill pill-warn"
                          style={{ marginLeft: 6, fontSize: 9 }}
                          title="Birthday within 30 days"
                        >
                          BDAY
                        </span>
                      )}
                    </td>
                    <td style={cellStyle}>{r.gender || '—'}</td>
                    <td style={cellStyle}>{r.region || r.country}</td>
                    <td style={cellStyle}>{r.religion || '—'}</td>
                    <td style={cellStyle}>{r.education_level || '—'}</td>
                    <td style={cellStyle}>
                      <span className={`pill ${YOUTH_STATUS_META[r.status]?.pill ?? 'pill-mute'}`}>
                        {YOUTH_STATUS_META[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setSelected(r)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 26px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ph" style={{ marginBottom: 16 }}>
              <div>
                <h2
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 19,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {selected.full_name}
                </h2>
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '3px 0 0',
                  }}
                >
                  {selected.membership_number} &middot; age {selected.age}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="btn btn-outline btn-sm"
                  href={`/youth-wing/portal?member=${encodeURIComponent(selected.membership_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    open_in_new
                  </span>
                  Open member portal
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <YouthMembershipCard
              userName={selected.full_name}
              membershipNumber={selected.membership_number}
              initials={initials(selected.full_name)}
              gender={selected.gender || undefined}
              age={selected.age}
              region={selected.region || undefined}
              country={selected.country}
              educationLevel={selected.education_level || undefined}
              joinedDate={formatDate(selected.created_at)}
              status={YOUTH_STATUS_META[selected.status]?.label}
            />
            <YouthMembershipCardActions
              style={{ marginTop: 14, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
              cardProps={{
                userName: selected.full_name,
                membershipNumber: selected.membership_number,
                initials: initials(selected.full_name),
                gender: selected.gender || undefined,
                age: selected.age,
                region: selected.region || undefined,
                country: selected.country,
                educationLevel: selected.education_level || undefined,
                joinedDate: formatDate(selected.created_at),
                status: YOUTH_STATUS_META[selected.status]?.label,
              }}
            />

            <dl
              style={{
                margin: '22px 0 0',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '6px 16px',
                fontSize: 13,
              }}
            >
              {(
                [
                  ['Date of birth', formatDate(selected.date_of_birth)],
                  ['Religion', selected.religion || '—'],
                  ['School', selected.school_name || '—'],
                  ['Education level', selected.education_level || '—'],
                  ['Guardian', selected.guardian_name],
                  ['Relationship', selected.guardian_relationship],
                  ['Guardian phone', selected.guardian_phone],
                  [
                    'Consent given',
                    selected.consent_at ? new Date(selected.consent_at).toLocaleString() : '—',
                  ],
                  ['Joined', formatDate(selected.created_at)],
                ] as Array<[string, string]>
              ).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt style={{ color: 'hsl(var(--on-surface-muted))' }}>{k}</dt>
                  <dd style={{ margin: 0, color: 'hsl(var(--on-surface))' }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
