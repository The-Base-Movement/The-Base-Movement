import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import {
  jobTaxonomyService,
  type JobAnalyticsRow,
  type JobTaxonomy,
} from '@/services/jobTaxonomyService'

// Mirrors the server-side gate in get_job_analytics_rows().
const ALLOWED_ROLES = [
  'ADMIN',
  'SUPER_ADMIN',
  'FOUNDER',
  'IT_MANAGER',
  'MOVEMENT_LEADER',
  'FINANCE_OFFICER',
]

const PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210 70% 50%)',
  'hsl(280 55% 55%)',
  'hsl(var(--destructive))',
  'hsl(160 55% 42%)',
  'hsl(35 85% 52%)',
  'hsl(190 60% 45%)',
  'hsl(330 60% 55%)',
  'hsl(95 45% 45%)',
  'hsl(245 55% 60%)',
  'hsl(15 75% 55%)',
]

interface Slice {
  name: string
  value: number
}

interface Filters {
  industryId: number | null
  subCategoryId: number | null
  roleId: number | null
  level: string | null
}
const EMPTY_FILTERS: Filters = { industryId: null, subCategoryId: null, roleId: null, level: null }

function countBy(rows: JobAnalyticsRow[], key: (r: JobAnalyticsRow) => string | null): Slice[] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = key(r)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const selectStyle: CSSProperties = {
  height: 34,
  padding: '0 10px',
  fontSize: 12,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
  minWidth: 150,
}

export default function JobsAnalytics() {
  const [role, setRole] = useState<string | null>(() => adminService.getCurrentUser()?.role ?? null)
  const [authChecked, setAuthChecked] = useState<boolean>(() => !!adminService.getCurrentUser())
  const [rows, setRows] = useState<JobAnalyticsRow[]>([])
  const [tax, setTax] = useState<JobTaxonomy | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  // Resolve the admin role (handles a cold load where getCurrentUser is null).
  useEffect(() => {
    if (authChecked) return
    adminService.initialize().then((u) => {
      setRole(u?.role ?? null)
      setAuthChecked(true)
    })
  }, [authChecked])

  const allowed = !!role && ALLOWED_ROLES.includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, taxonomy] = await Promise.all([
        jobTaxonomyService.getAnalyticsRows(),
        jobTaxonomyService.getTaxonomy(),
      ])
      setRows(data)
      setTax(taxonomy)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('insufficient_privilege') || msg.includes('42501')) {
        setDenied(true)
      } else {
        console.error(err)
        toast.error('Failed to load job analytics')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authChecked && allowed) load()
      else if (authChecked && !allowed) setLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [authChecked, allowed, load])

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filters.industryId == null || r.industry_id === filters.industryId) &&
          (filters.subCategoryId == null || r.sub_category_id === filters.subCategoryId) &&
          (filters.roleId == null || r.role_id === filters.roleId) &&
          (filters.level == null || r.level === filters.level)
      ),
    [rows, filters]
  )

  const byIndustry = useMemo(() => countBy(filtered, (r) => r.industry_name), [filtered])
  const bySub = useMemo(() => countBy(filtered, (r) => r.sub_category_name), [filtered])
  const byLevel = useMemo(() => countBy(filtered, (r) => r.level), [filtered])
  const byRole = useMemo(
    () =>
      countBy(
        filtered.filter((r) => !r.is_custom),
        (r) => r.role_name
      ),
    [filtered]
  )
  const customRows = useMemo(() => filtered.filter((r) => r.is_custom), [filtered])
  const customTitles = useMemo(
    () => countBy(customRows, (r) => (r.custom_title ? r.custom_title.trim() : null)),
    [customRows]
  )

  const subOptions = useMemo(
    () =>
      tax && filters.industryId
        ? tax.subCategories.filter((s) => s.industry_id === filters.industryId)
        : (tax?.subCategories ?? []),
    [tax, filters.industryId]
  )
  const roleOptions = useMemo(
    () =>
      tax && filters.subCategoryId
        ? tax.roles.filter((r) => r.sub_category_id === filters.subCategoryId)
        : [],
    [tax, filters.subCategoryId]
  )

  // --- Gates -----------------------------------------------------------------
  if (!authChecked) return <Centered>Verifying access…</Centered>
  if (!allowed || denied) {
    return (
      <Centered>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, color: 'hsl(var(--destructive))', marginBottom: 8 }}
        >
          lock
        </span>
        <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium, 500)' }}>Access restricted</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          The Jobs Analytics dashboard is limited to authorized leadership roles.
        </p>
      </Centered>
    )
  }

  const totalAll = rows.length
  const total = filtered.length
  const standard = filtered.filter((r) => !r.is_custom && r.role_id).length
  const customCount = customRows.length
  const industriesCovered = new Set(
    filtered.map((r) => r.industry_id).filter((v): v is number => v != null)
  ).size

  const kpis = [
    { label: 'Members with a saved job', value: total, bar: 'hsl(var(--on-surface))' },
    { label: 'Standard roles', value: standard, bar: 'hsl(var(--primary))' },
    { label: 'Custom “Other” entries', value: customCount, bar: 'hsl(var(--accent))' },
    {
      label: 'Industries covered',
      value: `${industriesCovered} / 7`,
      bar: 'hsl(var(--destructive))',
    },
  ]

  const hasFilters =
    filters.industryId != null ||
    filters.subCategoryId != null ||
    filters.roleId != null ||
    filters.level != null

  return (
    <div className="main">
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            work
          </span>
          Jobs Analytics
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          Member professions across the approved taxonomy — {totalAll} member
          {totalAll === 1 ? '' : 's'} have a saved job.
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          padding: 12,
          marginBottom: 20,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
        >
          filter_alt
        </span>
        <select
          value={filters.industryId ?? ''}
          style={selectStyle}
          onChange={(e) =>
            setFilters({
              industryId: e.target.value ? Number(e.target.value) : null,
              subCategoryId: null,
              roleId: null,
              level: filters.level,
            })
          }
        >
          <option value="">All industries</option>
          {tax?.industries.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <select
          value={filters.subCategoryId ?? ''}
          style={selectStyle}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              subCategoryId: e.target.value ? Number(e.target.value) : null,
              roleId: null,
            }))
          }
        >
          <option value="">All sub-categories</option>
          {subOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filters.roleId ?? ''}
          style={selectStyle}
          disabled={!filters.subCategoryId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, roleId: e.target.value ? Number(e.target.value) : null }))
          }
        >
          <option value="">{filters.subCategoryId ? 'All roles' : 'Pick a sub-category'}</option>
          {roleOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={filters.level ?? ''}
          style={selectStyle}
          onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value || null }))}
        >
          <option value="">All job levels</option>
          {['Entry', 'Professional', 'Senior / Specialist', 'Management', 'Other'].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
            style={{ marginLeft: 'auto' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
            Clear filters
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 20 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
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
                background: k.bar,
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
              {k.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div
          className="panel"
          style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
        >
          Loading analytics…
        </div>
      ) : total === 0 ? (
        <div
          className="panel"
          style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
        >
          No members match the current filters yet.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <PieCard
              title="By Industry"
              data={byIndustry}
              onSlice={(name) => {
                const ind = tax?.industries.find((i) => i.name === name)
                if (ind)
                  setFilters({
                    industryId: ind.id,
                    subCategoryId: null,
                    roleId: null,
                    level: filters.level,
                  })
              }}
            />
            <PieCard
              title="By Sub-Category"
              data={bySub}
              onSlice={(name) => {
                const sc = tax?.subCategories.find((s) => s.name === name)
                if (sc)
                  setFilters((f) => ({
                    ...f,
                    industryId: sc.industry_id,
                    subCategoryId: sc.id,
                    roleId: null,
                  }))
              }}
            />
            <PieCard
              title="By Job Level"
              data={byLevel}
              onSlice={(name) => setFilters((f) => ({ ...f, level: name }))}
            />
            <PieCard title="By Job Role (top 12)" data={byRole.slice(0, 12)} />
          </div>

          {/* Custom "Other" entries */}
          <div className="panel">
            <div className="ph">
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Custom “Other” job titles
                </h3>
                <p
                  style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}
                >
                  Member-entered titles not in the official list — review for taxonomy additions.
                </p>
              </div>
              <span className="pill pill-warn">{customCount} total</span>
            </div>
            {customTitles.length === 0 ? (
              <p
                style={{
                  padding: 20,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: 0,
                }}
              >
                No custom entries for the current filters.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Custom job title', 'Members'].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            textAlign: i === 1 ? 'right' : 'left',
                            padding: '10px 16px',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'hsl(var(--on-surface-muted))',
                            borderBottom: '1px solid hsl(var(--border))',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customTitles.map((c) => (
                      <tr key={c.name}>
                        <td
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {c.name}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid hsl(var(--border))',
                            textAlign: 'right',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {c.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        fontFamily: "'Public Sans', sans-serif",
        color: 'hsl(var(--on-surface))',
      }}
    >
      {children}
    </div>
  )
}

function PieCard({
  title,
  data,
  onSlice,
}: {
  title: string
  data: Slice[]
  onSlice?: (name: string) => void
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {title}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            {data.length} group{data.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <div
        style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={70}
                paddingAngle={2}
                stroke="none"
                onClick={(d: { name?: string }) => onSlice && d?.name && onSlice(d.name)}
                style={{ cursor: onSlice ? 'pointer' : 'default' }}
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: "'Public Sans'",
                  color: 'hsl(var(--on-surface))',
                }}
                formatter={(value: number, name: string) => [
                  `${value} (${total ? Math.round((value / total) * 100) : 0}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 140,
            display: 'grid',
            gap: 5,
            maxHeight: 170,
            overflowY: 'auto',
          }}
        >
          {data.map((d, i) => (
            <button
              key={d.name}
              onClick={() => onSlice?.(d.name)}
              disabled={!onSlice}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                background: 'none',
                border: 'none',
                padding: '2px 0',
                textAlign: 'left',
                cursor: onSlice ? 'pointer' : 'default',
                color: 'hsl(var(--on-surface))',
                width: '100%',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: PALETTE[i % PALETTE.length],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.name}
              </span>
              <span style={{ fontWeight: 'var(--font-weight-medium, 500)' }}>{d.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
