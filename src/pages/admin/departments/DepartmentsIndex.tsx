import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { messagingService } from '@/services/messagingService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import {
  CANONICAL_DEPARTMENT_IDS,
  DEPARTMENT_CATALOG,
  DEPARTMENT_REPORTING_CHAIN,
  DEPARTMENT_SUB_COMMITTEES,
} from '@/lib/departmentCatalog'

const departmentById = new Map(DEPARTMENT_CATALOG.map((department) => [department.id, department]))

export default function DepartmentsIndex() {
  const { setCurrentLabel } = usePageLabel()
  const [departments, setDepartments] = useState<
    { id: string; name: string; icon: string; sort_order: number }[]
  >([])
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrentLabel('Departments')
  }, [setCurrentLabel])

  useEffect(() => {
    async function load() {
      const { departments: depts, openCounts: counts } =
        await messagingService.getDepartmentsWithOpenTickets()
      setDepartments(depts.filter((dept) => CANONICAL_DEPARTMENT_IDS.has(dept.id)))
      setOpenCounts(counts)
      setLoading(false)
    }
    void load()
  }, [])

  return (
    <div className="main">
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Departments
        </h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
          Enter by organizational level, then manage the sub-committees inside that level.
        </p>
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
            Reporting chain
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 1,
            background: 'hsl(var(--border))',
          }}
        >
          {DEPARTMENT_REPORTING_CHAIN.map((departmentId) => {
            const department = departmentById.get(departmentId)
            if (!department) return null
            return (
              <Link
                key={department.id}
                to={`/admin/departments/${department.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 16px',
                  background: 'hsl(var(--card))',
                  textDecoration: 'none',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                >
                  {department.icon}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {department.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {department.levelLabel}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24, padding: 20 }}>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          Sub-committees used inside NCC, Diaspora Affairs, RCC, and CCC
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DEPARTMENT_SUB_COMMITTEES.map((committee) => (
            <span key={committee.id} className="pill pill-mute" style={{ gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {committee.icon}
              </span>
              {committee.name}
            </span>
          ))}
        </div>
      </div>
      {loading ? (
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {departments.map((d) => {
            const open = openCounts[d.id] ?? 0
            const to = `/admin/departments/${d.id}`
            return (
              <Link
                key={d.id}
                to={to}
                className="panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '24px 16px',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'border-color 0.1s, background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                  e.currentTarget.style.background = 'hsl(var(--primary) / 0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.background = 'hsl(var(--card))'
                }}
              >
                {open > 0 && (
                  <span
                    className="pill pill-warn"
                    style={{ position: 'absolute', top: 10, right: 10, fontSize: 10 }}
                  >
                    {open} open
                  </span>
                )}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 32, color: 'hsl(var(--primary))' }}
                >
                  {d.icon}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {d.name}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
