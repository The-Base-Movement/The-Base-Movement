# IT System Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/it-department/system` — a security event log with severity-coded rows and a live system health section at the top.

**Architecture:** New `system_audit_logs` table (IT-staff-only RLS) feeds a paginated/searchable table. A `get_db_stats()` SECURITY DEFINER RPC provides real DB size and connection count. API uptime is a static mock. The page plugs into the existing `ITDepartmentLayout` via `useITLayout`. Settings audit tab is untouched.

**Tech Stack:** React 18, TypeScript, Supabase JS v2, existing `useITLayout` / `useIsMobile` / `SortToggle` patterns, Material Symbols icons, CSS design-system variables.

---

## File Map

| Action     | Path                                                              |
| ---------- | ----------------------------------------------------------------- |
| **Create** | `supabase/migrations/20260603000300_create_system_audit_logs.sql` |
| **Create** | `src/pages/admin/it/ITSystem.tsx`                                 |
| **Modify** | `src/pages/admin/it/ITDepartmentLayout.tsx`                       |
| **Modify** | `src/routes.tsx`                                                  |

---

## Task 1: Database Migration

**Files:**

- Create: `supabase/migrations/20260603000300_create_system_audit_logs.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260603000300_create_system_audit_logs.sql

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  action      TEXT        NOT NULL,
  user_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  severity    TEXT        NOT NULL DEFAULT 'info'
              CHECK (severity IN ('info', 'warning', 'critical')),
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_audit_logs_staff_select" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_staff_select"
  ON public.system_audit_logs FOR SELECT TO authenticated
  USING ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

DROP POLICY IF EXISTS "system_audit_logs_staff_insert" ON public.system_audit_logs;
CREATE POLICY "system_audit_logs_staff_insert"
  ON public.system_audit_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

-- No DELETE — audit logs are immutable.

-- ── RPC: get_db_stats ─────────────────────────────────────────────────────────
-- SECURITY DEFINER so it can read pg_stat_activity regardless of caller role.

CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'db_size_bytes',       pg_database_size(current_database()),
    'active_connections',  (SELECT count(*)::int FROM pg_stat_activity WHERE state = 'active')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_db_stats() TO authenticated;

-- ── Seed data ─────────────────────────────────────────────────────────────────

INSERT INTO public.system_audit_logs (action, severity, details) VALUES
  ('Platform initialised',                   'info',     '{"environment":"production"}'),
  ('Admin role assigned',                    'warning',  '{"role":"FINANCE_OFFICER","target":"officer@example.com"}'),
  ('Failed login attempt (5 consecutive)',   'critical', '{"attempts":5,"ip":"192.168.1.100"}'),
  ('Database backup completed',              'info',     '{"size_mb":42,"duration_s":18}'),
  ('Suspicious query burst detected',        'warning',  '{"table":"finance_requests","count":200}'),
  ('New SUPER_ADMIN account created',        'critical', '{"email":"newadmin@example.com"}'),
  ('Scheduled maintenance window started',   'info',     '{"window_minutes":30}'),
  ('Finance request auto-escalated',         'warning',  '{"request_id":"auto-123","reason":"timeout"}');
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__supabase__apply_migration` with the SQL above.

- [ ] **Step 3: Verify**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'system_audit_logs';
```

Expected columns: `id`, `action`, `user_id`, `severity`, `details`, `created_at`.

Also verify the RPC works:

```sql
SELECT public.get_db_stats();
```

Expected: a JSON object with `db_size_bytes` and `active_connections` keys.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260603000300_create_system_audit_logs.sql
git commit -m "feat(db): add system_audit_logs table and get_db_stats RPC"
```

---

## Task 2: ITSystem Page

**Files:**

- Create: `src/pages/admin/it/ITSystem.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { SortToggle } from '@/components/ui/SortToggle'

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'info' | 'warning' | 'critical'

interface AuditLog {
  id: string
  action: string
  user_id: string | null
  severity: Severity
  details: Record<string, unknown> | null
  created_at: string
  user_name: string
}

interface DbStats {
  db_size_bytes: number
  active_connections: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25

const SEV: Record<Severity, { pill: string; row: string; label: string; icon: string }> = {
  info: { pill: 'pill pill-mute', row: 'transparent', label: 'Info', icon: 'info' },
  warning: {
    pill: 'pill pill-warn',
    row: 'hsl(var(--accent) / 0.06)',
    label: 'Warning',
    icon: 'warning',
  },
  critical: {
    pill: 'pill pill-err',
    row: 'hsl(var(--destructive) / 0.07)',
    label: 'Critical',
    icon: 'error',
  },
}

// ─── HealthCard ───────────────────────────────────────────────────────────────

function HealthCard({
  label,
  icon,
  value,
  pct,
  bar,
  status,
  statusColor,
  loading,
}: {
  label: string
  icon: string
  value: string
  pct: number
  bar: string
  status: string
  statusColor: string
  loading: boolean
}) {
  return (
    <div
      className="panel"
      style={{ padding: '16px 18px 18px 22px', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: bar }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          {label}
        </p>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: bar, opacity: 0.55 }}
        >
          {icon}
        </span>
      </div>
      <p
        style={{
          fontSize: 'var(--kpi-num-size)',
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          margin: '0 0 12px',
        }}
      >
        {loading ? '—' : value}
      </p>
      {/* Progress bar */}
      <div
        style={{
          height: 4,
          background: 'hsl(var(--border))',
          borderRadius: 99,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${loading ? 0 : pct}%`,
            background: bar,
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      {/* Status dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: loading ? 'hsl(var(--border))' : statusColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontFamily: "'Public Sans', sans-serif",
            color: loading ? 'hsl(var(--on-surface-muted))' : statusColor,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {loading ? 'Checking…' : status}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ITSystem() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()

  useEffect(() => {
    setCurrentLabel('System Monitor')
  }, [setCurrentLabel])

  useITLayout('System Monitor', 'shield', 'Security event log and live system health indicators.')

  // ── Health ──────────────────────────────────────────────────────────────────
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    supabase
      .rpc('get_db_stats')
      .then(({ data }) => {
        if (data) setDbStats(data as DbStats)
        setHealthLoading(false)
      })
      .catch(() => setHealthLoading(false))
  }, [])

  const dbSizeMB = (dbStats?.db_size_bytes ?? 0) / 1024 / 1024
  const dbLimitMB = 500
  const dbPct = Math.min(100, (dbSizeMB / dbLimitMB) * 100)
  const conns = dbStats?.active_connections ?? 0
  const connPct = Math.min(100, (conns / 100) * 100)

  // ── Audit logs ──────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all')
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    const { data } = await supabase
      .from('system_audit_logs')
      .select('*, user:users!user_id(full_name)')
      .order('created_at', { ascending: sortDir === 'asc' })
    setLogs(
      (data ?? []).map((l: Record<string, unknown>) => ({
        ...(l as Omit<AuditLog, 'user_name'>),
        user_name: (l.user as { full_name: string } | null)?.full_name ?? 'System',
      }))
    )
    setLogsLoading(false)
  }, [sortDir])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setPage(1)
  }, [search, sevFilter])

  const filtered = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase())
    const matchSev = sevFilter === 'all' || l.severity === sevFilter
    return matchSearch && matchSev
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Health card helpers ─────────────────────────────────────────────────────

  const dbBar =
    dbPct > 80
      ? 'hsl(var(--destructive))'
      : dbPct > 60
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const dbStatus = dbPct > 80 ? 'High Usage' : dbPct > 60 ? 'Moderate' : 'Healthy'
  const connBar =
    conns > 80
      ? 'hsl(var(--destructive))'
      : conns > 50
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const connStatus = conns > 80 ? 'High Load' : conns > 50 ? 'Elevated' : 'Normal'

  // ── Input style ─────────────────────────────────────────────────────────────

  const inputSt: React.CSSProperties = {
    height: 34,
    padding: '0 10px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 12,
    color: 'hsl(var(--on-surface))',
    background: '#fff',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  return (
    <div>
      {/* ── System Health ──────────────────────────────────────────────────── */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
        <HealthCard
          label="API Uptime"
          icon="cloud_done"
          value="99.9%"
          pct={99.9}
          bar="hsl(var(--primary))"
          status="Operational"
          statusColor="hsl(var(--primary))"
          loading={false}
        />
        <HealthCard
          label="Database Storage"
          icon="storage"
          value={healthLoading ? '—' : `${dbSizeMB.toFixed(1)} MB / ${dbLimitMB} MB`}
          pct={dbPct}
          bar={dbBar}
          status={dbStatus}
          statusColor={dbBar}
          loading={healthLoading}
        />
        <HealthCard
          label="Active Connections"
          icon="hub"
          value={healthLoading ? '—' : `${conns} active`}
          pct={connPct}
          bar={connBar}
          status={connStatus}
          statusColor={connBar}
          loading={healthLoading}
        />
      </div>

      {/* ── Audit Log ──────────────────────────────────────────────────────── */}
      <div className="panel" style={{ overflow: 'hidden', marginBottom: 24 }}>
        {/* Toolbar */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'hsl(var(--container-low))',
          }}
        >
          <input
            id="audit-search"
            name="auditSearch"
            type="text"
            placeholder="Search action or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputSt, flex: 1, minWidth: 160 }}
          />
          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value as Severity | 'all')}
            style={inputSt}
          >
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <SortToggle value={sortDir} onChange={setSortDir} label="Date" />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {['Timestamp', 'Action', 'User', 'Severity'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {[70, 55, 40, 25].map((w, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            height: 11,
                            background: 'hsl(var(--container-low))',
                            borderRadius: 2,
                            width: `${w}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '60px 16px',
                      textAlign: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {search || sevFilter !== 'all'
                      ? 'No matching events.'
                      : 'No audit events recorded yet.'}
                  </td>
                </tr>
              ) : (
                pageLogs.map((log) => {
                  const sev = SEV[log.severity]
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border))',
                        background: sev.row,
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 16px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(log.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {log.action}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {log.user_name}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className={sev.pill}>{sev.label}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!logsLoading && filtered.length > PAGE_SIZE && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'hsl(var(--container-low))',
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {filtered.length} events · Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_left
                </span>
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cross-link to Settings audit ────────────────────────────────────── */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Link
            to="/admin/settings?tab=audit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--primary))',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            View admin activity log
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              arrow_forward
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TSC**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/it/ITSystem.tsx
git commit -m "feat(it): add IT System Monitor page with health cards and audit log"
```

---

## Task 3: Nav Item + Route

**Files:**

- Modify: `src/pages/admin/it/ITDepartmentLayout.tsx`
- Modify: `src/routes.tsx`

- [ ] **Step 1: Add System to `IT_NAV` in `ITDepartmentLayout.tsx`**

Find the `IT_NAV` array. Add as the second-to-last entry (before Hierarchy):

```ts
{ to: '/admin/it-department/system', icon: 'shield', label: 'System' },
```

The full array should read:

```ts
const IT_NAV = [
  { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
  { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
  { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
  { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
  { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
  { to: '/admin/it-department/security-protocols', icon: 'security', label: 'Security Protocols' },
  { to: '/admin/it-department/system', icon: 'shield', label: 'System' },
  { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
]
```

- [ ] **Step 2: Add lazy import in `src/routes.tsx`**

Find the IT\* lazy import block (around line 107). Add after `ITSecurity`:

```tsx
const ITSystem = lazy(() => import('./pages/admin/it/ITSystem'))
```

- [ ] **Step 3: Add route in `src/routes.tsx`**

Find the IT routes children block (around lines 262–268). Add before the hierarchy route:

```tsx
{ path: '/admin/it-department/system', element: <ITSystem /> },
```

The full children block should read:

```tsx
{ path: '/admin/it-department',                    element: <ITDashboard /> },
{ path: '/admin/it-department/tickets',            element: <ITTickets /> },
{ path: '/admin/it-department/projects',           element: <ITProjects /> },
{ path: '/admin/it-department/notes',              element: <ITNotes /> },
{ path: '/admin/it-department/todos',              element: <ITTodos /> },
{ path: '/admin/it-department/security-protocols', element: <ITSecurity /> },
{ path: '/admin/it-department/system',             element: <ITSystem /> },
{ path: '/admin/it-department/hierarchy',          element: <ITDashboard /> },
```

- [ ] **Step 4: Run TSC**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/it/ITDepartmentLayout.tsx src/routes.tsx
git commit -m "feat(it): add System Monitor nav item and route"
```

---

## Task 4: Final Build Check

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: builds successfully, zero errors.

- [ ] **Step 2: Smoke test**

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/admin/it-department/system`
3. Confirm 3 health cards render (API Uptime at 99.9%, DB storage with real value, active connections)
4. Confirm seeded audit log rows appear, color-coded: white=info, amber tint=warning, red tint=critical
5. Type in the search box — rows filter in real time
6. Change severity dropdown — rows filter
7. Sort toggle switches between newest-first and oldest-first
8. "View admin activity log →" link navigates to `/admin/settings?tab=audit`
9. "System" appears in the IT Department sidebar and mobile tab strip

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete IT System Monitor — health indicators, severity audit log, nav"
git push
```
