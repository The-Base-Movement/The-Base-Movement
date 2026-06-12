import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import type { HelpdeskDepartment } from '@/components/admin/Helpdesk/types'

export default function DepartmentsIndex() {
  const { setCurrentLabel } = usePageLabel()
  const [departments, setDepartments] = useState<HelpdeskDepartment[]>([])
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrentLabel('Departments')
  }, [setCurrentLabel])

  useEffect(() => {
    async function load() {
      const [{ data: depts }, { data: tickets }] = await Promise.all([
        supabase
          .from('helpdesk_departments')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('helpdesk_tickets')
          .select('department_id')
          .in('status', ['open', 'in-progress']),
      ])
      setDepartments((depts ?? []) as HelpdeskDepartment[])
      const counts: Record<string, number> = {}
      for (const t of (tickets ?? []) as { department_id: string }[]) {
        counts[t.department_id] = (counts[t.department_id] ?? 0) + 1
      }
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
          Operational dashboards for every movement department
        </p>
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
            const to = d.id === 'it' ? '/admin/it-department' : `/admin/departments/${d.id}`
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
