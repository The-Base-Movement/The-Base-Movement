# IT Helpdesk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an IT Helpdesk with a Kanban board for IT staff and a global submit modal for any admin role granted the `SUBMIT_IT_TICKET` permission.

**Architecture:** Two Supabase tables (`it_tickets`, `it_ticket_comments`) with RLS scoped to IT staff and ticket submitters. The Kanban page lives inside the existing `ITDepartmentLayout`. The submit modal is injected into `AdminLayout`'s top bar, gated by a permission flag on the current user's role record.

**Tech Stack:** React 18, TypeScript, Supabase JS v2, `@dnd-kit/core`, `@dnd-kit/sortable`, existing `useIsMobile` hook, `sonner` toasts, `createPortal`, Material Symbols icons.

---

## File Map

| Action     | Path                                                        |
| ---------- | ----------------------------------------------------------- |
| **Create** | `supabase/migrations/20260603000100_create_it_helpdesk.sql` |
| **Create** | `src/pages/admin/it/ITTickets.tsx`                          |
| **Create** | `src/pages/admin/it/ITTicketPanel.tsx`                      |
| **Create** | `src/components/admin/SubmitTicketModal.tsx`                |
| **Modify** | `src/types/admin.ts`                                        |
| **Modify** | `src/pages/admin/RolesManager.tsx`                          |
| **Modify** | `src/pages/admin/it/ITDepartmentLayout.tsx`                 |
| **Modify** | `src/pages/admin/it/ITDashboard.tsx`                        |
| **Modify** | `src/routes.tsx`                                            |
| **Modify** | `src/components/layouts/AdminLayout.tsx`                    |

---

## Task 1: Database Migration

**Files:**

- Create: `supabase/migrations/20260603000100_create_it_helpdesk.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260603000100_create_it_helpdesk.sql

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.it_tickets (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  priority      TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low','medium','high')),
  status        TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','in-progress','resolved')),
  submitted_by  UUID        NOT NULL REFERENCES public.admins(id),
  assigned_to   UUID        REFERENCES public.admins(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.it_ticket_comments (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID        NOT NULL REFERENCES public.it_tickets(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.admins(id),
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.it_tickets_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER it_tickets_updated_at
  BEFORE UPDATE ON public.it_tickets
  FOR EACH ROW EXECUTE FUNCTION public.it_tickets_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.it_tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_ticket_comments ENABLE ROW LEVEL SECURITY;

-- it_tickets: IT staff full access
CREATE POLICY "it_tickets_staff_all"
  ON public.it_tickets FOR ALL TO authenticated
  USING      ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'))
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

-- it_tickets: any admin can insert their own ticket
CREATE POLICY "it_tickets_submitter_insert"
  ON public.it_tickets FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- it_tickets: submitter can read their own tickets
CREATE POLICY "it_tickets_submitter_select"
  ON public.it_tickets FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- it_ticket_comments: IT staff full access
CREATE POLICY "it_comments_staff_all"
  ON public.it_ticket_comments FOR ALL TO authenticated
  USING      ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'))
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));

-- it_ticket_comments: submitter can insert comment on their own ticket
CREATE POLICY "it_comments_submitter_insert"
  ON public.it_ticket_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.it_tickets t
      WHERE t.id = ticket_id AND t.submitted_by = auth.uid()
    )
  );

-- it_ticket_comments: submitter can read comments on their own tickets
CREATE POLICY "it_comments_submitter_select"
  ON public.it_ticket_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.it_tickets t
      WHERE t.id = ticket_id AND t.submitted_by = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with the SQL above.

- [ ] **Step 3: Verify tables exist**

Use `mcp__supabase__list_tables` and confirm `it_tickets` and `it_ticket_comments` appear.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260603000100_create_it_helpdesk.sql
git commit -m "feat(db): add it_tickets and it_ticket_comments tables with RLS"
```

---

## Task 2: TypeScript Types

**Files:**

- Modify: `src/types/admin.ts`

- [ ] **Step 1: Add `SUBMIT_IT_TICKET` to the action union**

Find the `action` union inside `AdminPermission`. It currently ends with something like `'VIEW_PARTY_OFFICIALS'`. Add `| 'SUBMIT_IT_TICKET'` to the union.

- [ ] **Step 2: Add `IT_SUPPORT` to the resource union**

Find the `resource` union inside `AdminPermission`. It currently ends with `'ADMINS'`. Add `| 'IT_SUPPORT'` to the union.

After both edits the relevant section of `AdminPermission` should look like:

```ts
export interface AdminPermission {
  action:
    | 'VERIFY_MEMBER'
    | 'DELETE_MEMBER'
    | 'MANAGE_CHAPTER'
    | 'MANAGE_POLLS'
    | 'MANAGE_INVENTORY'
    | 'VIEW_AUDIT_LOGS'
    | 'APPOINT_LEAD'
    | 'MANAGE_BLOGS'
    | 'MANAGE_DONATIONS'
    | 'VIEW_MEMBER_DIRECTORY'
    | 'VIEW_POLLS'
    | 'VIEW_FINANCE'
    | 'VIEW_WAR_ROOM'
    | 'VIEW_DEPLOYMENT_METRICS'
    | 'VIEW_CONSTITUENCY_OPS'
    | 'VIEW_POLLING_STATIONS'
    | 'VIEW_MASS_MOBILIZATION'
    | 'VIEW_DIRECTIVES'
    | 'VIEW_DEPLOY_ASSET'
    | 'VIEW_STRATEGIC_FOCUS'
    | 'VIEW_MISSION_PLAN'
    | 'VIEW_ROADMAP'
    | 'VIEW_PARTY_OFFICIALS'
    | 'VIEW_ADMINS'
    | 'SUBMIT_IT_TICKET' // ← new
  resource:
    | 'MEMBERS'
    | 'CHAPTERS'
    | 'POLLS'
    | 'STORE'
    | 'BLOGS'
    | 'DONATIONS'
    | 'SYSTEM'
    | 'FINANCE'
    | 'OPERATIONS'
    | 'STRATEGY'
    | 'PARTY'
    | 'ADMINS'
    | 'IT_SUPPORT' // ← new
}
```

- [ ] **Step 3: Run TSC to confirm no type errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/admin.ts
git commit -m "feat(types): add SUBMIT_IT_TICKET permission and IT_SUPPORT resource"
```

---

## Task 3: Roles Manager — IT Support Permission Group

**Files:**

- Modify: `src/pages/admin/RolesManager.tsx`

- [ ] **Step 1: Add the IT Support group to `PERMISSION_GROUPS`**

Find the `PERMISSION_GROUPS` array (around line 13). Add the following object as the last entry, just before the closing `]`:

```ts
  {
    label: 'IT Support',
    resource: 'IT_SUPPORT',
    items: [{ action: 'SUBMIT_IT_TICKET', label: 'Submit IT support tickets' }],
  },
```

- [ ] **Step 2: Verify the UI renders the new group**

Start the dev server (`npm run dev`), navigate to `http://localhost:3000/admin/roles`, open any role's Edit modal, and confirm the "IT Support" group appears at the bottom of the permissions list with a single checkbox "Submit IT support tickets".

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/RolesManager.tsx
git commit -m "feat(roles): add IT Support permission group to roles manager"
```

---

## Task 4: Install @dnd-kit

- [ ] **Step 1: Install packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

- [ ] **Step 2: Confirm installation**

```bash
cat package.json | grep dnd-kit
```

Expected output includes `"@dnd-kit/core"` and `"@dnd-kit/sortable"`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): install @dnd-kit/core and @dnd-kit/sortable"
```

---

## Task 5: ITTickets — Scaffold, Types, and KPI Strip

**Files:**

- Create: `src/pages/admin/it/ITTickets.tsx`

- [ ] **Step 1: Create the file with types, data fetching, and KPI strip**

```tsx
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { ITTicketPanel } from './ITTicketPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in-progress' | 'resolved'

export interface ITTicket {
  id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  submitted_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  submitter_name: string
  assignee_name: string | null
}

interface AdminStub {
  id: string
  name: string
}

// ─── Column config ────────────────────────────────────────────────────────────

export const TICKET_COLUMNS: { status: TicketStatus; label: string; bar: string }[] = [
  { status: 'open', label: 'Open', bar: 'hsl(var(--on-surface))' },
  { status: 'in-progress', label: 'In Progress', bar: 'hsl(var(--accent))' },
  { status: 'resolved', label: 'Resolved', bar: 'hsl(var(--primary))' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ITTickets() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()
  const currentUser = adminService.getCurrentUser()

  useEffect(() => {
    setCurrentLabel('IT Helpdesk')
  }, [setCurrentLabel])

  const [tickets, setTickets] = useState<ITTicket[]>([])
  const [itStaff, setItStaff] = useState<AdminStub[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: rawTickets }, { data: staff }] = await Promise.all([
        supabase
          .from('it_tickets')
          .select('*, submitter:admins!submitted_by(name), assignee:admins!assigned_to(name)')
          .order('created_at', { ascending: false }),
        supabase.from('admins').select('id, name').in('role', ['SUPER_ADMIN', 'FOUNDER']),
      ])
      setItStaff((staff ?? []) as AdminStub[])
      setTickets(
        (rawTickets ?? []).map((t: Record<string, unknown>) => ({
          ...(t as Omit<ITTicket, 'submitter_name' | 'assignee_name'>),
          submitter_name: (t.submitter as { name: string } | null)?.name ?? 'Unknown',
          assignee_name: (t.assignee as { name: string } | null)?.name ?? null,
        }))
      )
    } catch (err) {
      console.error('[ITTickets] load error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
    const { error } = await supabase
      .from('it_tickets')
      .update({ status: newStatus })
      .eq('id', ticketId)
    if (error) {
      toast.error('Failed to update status')
      load()
    }
  }

  const assignTicket = async (ticketId: string, adminId: string | null) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t
        const staff = itStaff.find((s) => s.id === adminId)
        return { ...t, assigned_to: adminId, assignee_name: staff?.name ?? null }
      })
    )
    const { error } = await supabase
      .from('it_tickets')
      .update({ assigned_to: adminId })
      .eq('id', ticketId)
    if (error) {
      toast.error('Failed to assign ticket')
      load()
    }
  }

  // ── KPI counts ───────────────────────────────────────────────────────────────

  const totalCount = tickets.length
  const openCount = tickets.filter((t) => t.status === 'open').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length

  const kpis = [
    { label: 'Total Tickets', value: totalCount, bar: 'hsl(var(--on-surface))' },
    { label: 'Open', value: openCount, bar: 'hsl(var(--destructive))' },
    { label: 'Resolved', value: resolvedCount, bar: 'hsl(var(--primary))' },
  ]

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null

  return (
    <div>
      <AdminPageHeader
        title="IT Helpdesk"
        icon="confirmation_number"
        description="Manage support tickets from the team."
      />

      {/* KPI Strip */}
      <div className="kpis" style={{ marginBottom: 28 }}>
        {kpis.map((kpi) => (
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
              {loading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Board / List — added in Tasks 6 & 7 */}
      {loading ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Loading tickets…
        </div>
      ) : isMobile ? (
        <MobileTicketList
          tickets={tickets}
          onStatusChange={updateStatus}
          onSelect={setSelectedId}
        />
      ) : (
        <KanbanBoard
          tickets={tickets}
          itStaff={itStaff}
          onStatusChange={updateStatus}
          onAssign={assignTicket}
          onSelect={setSelectedId}
        />
      )}

      {/* Slide-out panel */}
      {selectedTicket && (
        <ITTicketPanel
          ticket={selectedTicket}
          currentUserId={currentUser?.id ?? ''}
          isItStaff={currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'FOUNDER'}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
    </div>
  )
}

// ─── Placeholder stubs (filled in Tasks 6 & 7) ────────────────────────────────

function KanbanBoard(_props: {
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 13 }}>
      Kanban — coming in Task 6
    </div>
  )
}

function MobileTicketList(_props: {
  tickets: ITTicket[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 13 }}>
      Mobile list — coming in Task 7
    </div>
  )
}
```

- [ ] **Step 2: Create a temporary stub for ITTicketPanel** (so the import resolves)

Create `src/pages/admin/it/ITTicketPanel.tsx` with:

```tsx
import type { ITTicket } from './ITTickets'

interface Props {
  ticket: ITTicket
  currentUserId: string
  isItStaff: boolean
  onClose: () => void
  onUpdated: () => void
}

export function ITTicketPanel({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 400,
          background: '#fff',
          borderLeft: '1px solid hsl(var(--border))',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13 }}>
          Panel stub — filled in Task 8
        </p>
        <button className="btn btn-outline btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run TSC**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/it/ITTickets.tsx src/pages/admin/it/ITTicketPanel.tsx
git commit -m "feat(it): scaffold ITTickets page with KPI strip and types"
```

---

## Task 6: Kanban Board (Desktop)

**Files:**

- Modify: `src/pages/admin/it/ITTickets.tsx` — replace the `KanbanBoard` stub

- [ ] **Step 1: Add dnd-kit imports at top of `ITTickets.tsx`**

Add after the existing imports:

```tsx
import {
  DndContext,
  DragEndEvent,
  useDroppable,
  useDraggable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
```

- [ ] **Step 2: Replace the `KanbanBoard` stub with the full implementation**

Replace the entire `KanbanBoard` function with:

```tsx
function KanbanBoard({
  tickets,
  itStaff,
  onStatusChange,
  onAssign,
  onSelect,
}: {
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggingId(null)
    if (!over || active.id === over.id) return
    const newStatus = over.id as TicketStatus
    const ticket = tickets.find((t) => t.id === active.id)
    if (ticket && ticket.status !== newStatus) {
      onStatusChange(active.id as string, newStatus)
    }
  }

  const draggingTicket = tickets.find((t) => t.id === draggingId) ?? null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDraggingId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {TICKET_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            column={col}
            tickets={tickets.filter((t) => t.status === col.status)}
            itStaff={itStaff}
            onAssign={onAssign}
            onSelect={onSelect}
          />
        ))}
      </div>
      <DragOverlay>
        {draggingTicket && (
          <TicketCard
            ticket={draggingTicket}
            itStaff={itStaff}
            onAssign={onAssign}
            onSelect={onSelect}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  column,
  tickets,
  itStaff,
  onAssign,
  onSelect,
}: {
  column: (typeof TICKET_COLUMNS)[number]
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status })

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? 'hsl(var(--container-low))' : 'transparent',
        borderRadius: 'var(--radius-md)',
        minHeight: 200,
        transition: 'background 0.15s',
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: `3px solid ${column.bar}`,
          marginBottom: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {column.label}
        </p>
        <span
          style={{
            padding: '2px 7px',
            borderRadius: 'var(--radius-pill)',
            background: column.bar,
            color: '#fff',
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px 8px' }}>
        {tickets.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 11,
              padding: '20px 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            No tickets
          </p>
        ) : (
          tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              itStaff={itStaff}
              onAssign={onAssign}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TicketCard({
  ticket,
  itStaff,
  onAssign,
  onSelect,
  isDragging = false,
}: {
  ticket: ITTicket
  itStaff: AdminStub[]
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: ticket.id })
  const [assignOpen, setAssignOpen] = useState(false)

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const priorityPill: Record<TicketPriority, string> = {
    high: 'pill pill-err',
    medium: 'pill pill-warn',
    low: 'pill pill-mute',
  }

  return (
    <div ref={setNodeRef} style={{ ...style, position: 'relative' }}>
      <div className="panel" style={{ padding: '12px 14px', cursor: 'pointer' }}>
        {/* Drag handle + title row */}
        <div
          {...attributes}
          {...listeners}
          style={{ marginBottom: 8 }}
          onClick={() => onSelect(ticket.id)}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {ticket.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className={priorityPill[ticket.priority]}>{ticket.priority}</span>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {ticket.submitter_name}
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginLeft: 'auto',
              }}
            >
              {relativeTime(ticket.created_at)}
            </span>
          </div>
        </div>

        {/* Assign row */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
          >
            person
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface-muted))',
              flex: 1,
            }}
          >
            {ticket.assignee_name ?? 'Unassigned'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '0 6px', fontSize: 10 }}
            onClick={(e) => {
              e.stopPropagation()
              setAssignOpen((v) => !v)
            }}
          >
            Assign
          </button>
          {assignOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setAssignOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  zIndex: 50,
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  minWidth: 160,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }}
              >
                {itStaff.map((s) => (
                  <button
                    key={s.id}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      onAssign(ticket.id, s.id)
                      setAssignOpen(false)
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 14px',
                    background: 'none',
                    border: 'none',
                    borderTop: '1px solid hsl(var(--border))',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    onAssign(ticket.id, null)
                    setAssignOpen(false)
                  }}
                >
                  Unassign
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/it/ITTickets.tsx
git commit -m "feat(it): add Kanban board with drag-and-drop for desktop"
```

---

## Task 7: Mobile Ticket List

**Files:**

- Modify: `src/pages/admin/it/ITTickets.tsx` — replace the `MobileTicketList` stub

- [ ] **Step 1: Replace the `MobileTicketList` stub**

Replace the entire `MobileTicketList` function with:

```tsx
function MobileTicketList({
  tickets,
  onStatusChange,
  onSelect,
}: {
  tickets: ITTicket[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onSelect: (id: string) => void
}) {
  const priorityPill: Record<TicketPriority, string> = {
    high: 'pill pill-err',
    medium: 'pill pill-warn',
    low: 'pill pill-mute',
  }

  if (tickets.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        No tickets yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="panel"
          style={{ padding: '14px 16px', cursor: 'pointer' }}
          onClick={() => onSelect(ticket.id)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 8,
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
              }}
            >
              {ticket.title}
            </p>
            <span className={priorityPill[ticket.priority]}>{ticket.priority}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                flex: 1,
              }}
            >
              {ticket.submitter_name} · {relativeTime(ticket.created_at)}
            </span>
            <select
              value={ticket.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
              style={{
                fontSize: 11,
                fontFamily: "'Public Sans', sans-serif",
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 6px',
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface))',
                cursor: 'pointer',
              }}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/it/ITTickets.tsx
git commit -m "feat(it): add mobile ticket list with status select"
```

---

## Task 8: Ticket Detail Panel with Comments

**Files:**

- Modify: `src/pages/admin/it/ITTicketPanel.tsx` — replace the stub with the full implementation

- [ ] **Step 1: Replace the stub with the full panel**

```tsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ITTicket, TicketPriority, TicketStatus } from './ITTickets'

interface Comment {
  id: string
  body: string
  created_at: string
  author_id: string
  admins: { name: string } | null
}

interface Props {
  ticket: ITTicket
  currentUserId: string
  isItStaff: boolean
  onClose: () => void
  onUpdated: () => void
}

const priorityPill: Record<TicketPriority, string> = {
  high: 'pill pill-err',
  medium: 'pill pill-warn',
  low: 'pill pill-mute',
}

const statusPill: Record<TicketStatus, string> = {
  open: 'pill pill-err',
  'in-progress': 'pill pill-warn',
  resolved: 'pill pill-ok',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ITTicketPanel({ ticket, currentUserId, isItStaff, onClose, onUpdated }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingCmts, setLoadingCmts] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const canComment = isItStaff || ticket.submitted_by === currentUserId

  useEffect(() => {
    let cancelled = false
    async function fetchComments() {
      setLoadingCmts(true)
      const { data } = await supabase
        .from('it_ticket_comments')
        .select('id, body, created_at, author_id, admins!author_id(name)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })
      if (!cancelled) {
        setComments((data ?? []) as Comment[])
        setLoadingCmts(false)
      }
    }
    fetchComments()
    return () => {
      cancelled = true
    }
  }, [ticket.id])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const postComment = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setPosting(true)
    const { error } = await supabase
      .from('it_ticket_comments')
      .insert({ ticket_id: ticket.id, author_id: currentUserId, body: trimmed })
    if (error) {
      toast.error('Failed to post comment')
    } else {
      setBody('')
      const { data } = await supabase
        .from('it_ticket_comments')
        .select('id, body, created_at, author_id, admins!author_id(name)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })
      setComments((data ?? []) as Comment[])
      onUpdated()
    }
    setPosting(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100vw',
          background: '#fff',
          borderLeft: '1px solid hsl(var(--border))',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          fontFamily: "'Public Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                flex: 1,
                lineHeight: 1.4,
              }}
            >
              {ticket.title}
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--on-surface-muted))',
                flexShrink: 0,
                display: 'flex',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                close
              </span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={priorityPill[ticket.priority]}>{ticket.priority}</span>
            <span className={statusPill[ticket.status]}>{ticket.status}</span>
          </div>
        </div>

        {/* Meta */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          {[
            { icon: 'person', label: 'Submitted by', value: ticket.submitter_name },
            {
              icon: 'engineering',
              label: 'Assigned to',
              value: ticket.assignee_name ?? 'Unassigned',
            },
            { icon: 'schedule', label: 'Created', value: relativeTime(ticket.created_at) },
          ].map((row) => (
            <div
              key={row.label}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
              >
                {row.icon}
              </span>
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', width: 80 }}>
                {row.label}
              </span>
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface))' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Description
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.description}
          </p>
        </div>

        {/* Comments thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Comments
          </p>
          {loadingCmts ? (
            <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}>
              No comments yet.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                style={{
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {c.admins?.name ?? 'Unknown'}
                  </span>
                  <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                    {relativeTime(c.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {c.body}
                </p>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input */}
        <div
          style={{ padding: '14px 20px', borderTop: '1px solid hsl(var(--border))', flexShrink: 0 }}
        >
          {canComment ? (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--container-low))',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: 8,
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={posting || !body.trim()}
                onClick={postComment}
              >
                {posting ? 'Posting…' : 'Add comment'}
              </button>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Only IT staff and the ticket submitter can comment.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/it/ITTicketPanel.tsx
git commit -m "feat(it): add ticket detail slide-out panel with comments"
```

---

## Task 9: Submit IT Support Ticket Modal

**Files:**

- Create: `src/components/admin/SubmitTicketModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { TicketPriority } from '@/pages/admin/it/ITTickets'

interface Props {
  userId: string
  onClose: () => void
}

const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
  color: 'hsl(var(--on-surface))',
}

export function SubmitTicketModal({ userId, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDesc] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const t = title.trim()
    const d = description.trim()
    if (!t) {
      setError('Title is required.')
      return
    }
    if (t.length > 120) {
      setError('Title must be 120 characters or fewer.')
      return
    }
    if (!d) {
      setError('Description is required.')
      return
    }
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase
      .from('it_tickets')
      .insert({ title: t, description: d, priority, submitted_by: userId })
    if (err) {
      setError('Failed to submit ticket. Please try again.')
    } else {
      toast.success('Ticket submitted. The IT team will be in touch.')
      onClose()
    }
    setSubmitting(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              support_agent
            </span>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Submit IT Support Ticket
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={120}
              style={{ ...inputSt, height: 38 }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the issue in detail…"
              rows={4}
              style={{ ...inputSt, padding: '8px 12px', resize: 'vertical' }}
            />
          </div>

          {/* Priority toggle */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              Priority
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={priority === p ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                  onClick={() => setPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--destructive))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            className="btn btn-outline btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/SubmitTicketModal.tsx
git commit -m "feat(it): add SubmitTicketModal for non-IT staff"
```

---

## Task 10: AdminLayout — IT Support Button

**Files:**

- Modify: `src/components/layouts/AdminLayout.tsx`

- [ ] **Step 1: Add import for SubmitTicketModal**

At the top of `AdminLayout.tsx`, add to the existing import block:

```tsx
import { SubmitTicketModal } from '@/components/admin/SubmitTicketModal'
```

- [ ] **Step 2: Add `submitTicketOpen` state**

Find the existing `useState` declarations (around line 49–72). Add:

```tsx
const [submitTicketOpen, setSubmitTicketOpen] = useState(false)
```

- [ ] **Step 3: Add the `canSubmitTicket` computed value**

Directly after the `user` state declaration line, add (this reads cleanly from the `user` state already used in the layout):

```tsx
const canSubmitTicket =
  user?.role === 'SUPER_ADMIN' ||
  user?.role === 'FOUNDER' ||
  (user?.permissions ?? []).some(
    (p) => p.action === 'SUBMIT_IT_TICKET' && p.resource === 'IT_SUPPORT'
  )
```

- [ ] **Step 4: Insert the IT Support button**

Find the comment `{/* Right: notifications + divider + user */}` (line ~1125). Inside the wrapping flex `<div>`, add the button **before** the notification bell `<div style={{ position: 'relative' }}>`:

```tsx
{
  /* IT Support */
}
{
  canSubmitTicket && (
    <button
      className="btn btn-outline btn-sm"
      onClick={() => setSubmitTicketOpen(true)}
      style={{ gap: 6, padding: '0 10px', flexShrink: 0 }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        support_agent
      </span>
      <span className="desktop-only">IT Support</span>
    </button>
  )
}
```

- [ ] **Step 5: Render the modal at the bottom of the component's return**

Just before the closing `</div>` of the root element in `AdminLayout`'s return, add:

```tsx
{
  submitTicketOpen && user && (
    <SubmitTicketModal userId={user.id} onClose={() => setSubmitTicketOpen(false)} />
  )
}
```

- [ ] **Step 6: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/components/layouts/AdminLayout.tsx
git commit -m "feat(it): add IT Support ticket button to admin top bar"
```

---

## Task 11: ITDepartmentLayout Nav Item + Routes

**Files:**

- Modify: `src/pages/admin/it/ITDepartmentLayout.tsx`
- Modify: `src/routes.tsx`

- [ ] **Step 1: Add Helpdesk to `IT_NAV` in `ITDepartmentLayout.tsx`**

Find `IT_NAV` (line 8). Add as the second entry (after Overview):

```ts
{ to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
```

The array should read:

```ts
const IT_NAV = [
  { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
  { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
  { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
  { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
  { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
  { to: '/admin/it-department/security-protocols', icon: 'security', label: 'Security Protocols' },
  { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
]
```

- [ ] **Step 2: Add lazy import in `src/routes.tsx`**

Find the IT\* lazy imports block (lines 102–107). Add after line 107:

```tsx
const ITTickets = lazy(() => import('./pages/admin/it/ITTickets'))
```

- [ ] **Step 3: Add the route in `src/routes.tsx`**

Find the IT routes block (lines 261–266). Add as the first child after the dashboard route:

```tsx
{ path: '/admin/it-department/tickets', element: <ITTickets /> },
```

The block should look like:

```tsx
{ path: '/admin/it-department',                    element: <ITDashboard /> },
{ path: '/admin/it-department/tickets',            element: <ITTickets /> },
{ path: '/admin/it-department/projects',           element: <ITProjects /> },
{ path: '/admin/it-department/notes',              element: <ITNotes /> },
{ path: '/admin/it-department/todos',              element: <ITTodos /> },
{ path: '/admin/it-department/security-protocols', element: <ITSecurity /> },
{ path: '/admin/it-department/hierarchy',          element: <ITDashboard /> },
```

- [ ] **Step 4: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/it/ITDepartmentLayout.tsx src/routes.tsx
git commit -m "feat(it): add Helpdesk nav item and route"
```

---

## Task 12: IT Dashboard — Pending Tickets Stat Card

**Files:**

- Modify: `src/pages/admin/it/ITDashboard.tsx`

- [ ] **Step 1: Add pending tickets to the stats fetch in `ITDashboard.tsx`**

Find the `load` function (around line 57). Expand the `Promise.all` to include a fourth query:

```ts
const [{ count: total }, { count: completed }, { count: activeTodos }, { count: pendingTickets }] =
  await Promise.all([
    supabase.from('it_projects').select('*', { count: 'exact', head: true }),
    supabase
      .from('it_projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('it_todos').select('*', { count: 'exact', head: true }).neq('status', 'done'),
    supabase
      .from('it_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in-progress']),
  ])

setStats({
  totalProjects: total ?? 0,
  completedProjects: completed ?? 0,
  activeTodos: activeTodos ?? 0,
  pendingTickets: pendingTickets ?? 0,
})
```

- [ ] **Step 2: Add `pendingTickets` to the `ITStats` interface**

Find the `interface ITStats` (line 8) and add:

```ts
interface ITStats {
  totalProjects: number
  completedProjects: number
  activeTodos: number
  pendingTickets: number
}
```

- [ ] **Step 3: Add the KPI tile to the `kpis` array**

Find the `kpis` array (around line 86) and add a fourth entry:

```ts
{
  label: 'Pending Tickets',
  value: stats?.pendingTickets,
  icon: 'confirmation_number',
  bar: 'hsl(var(--destructive))',
  sub: 'Open and in-progress tickets',
  to: '/admin/it-department/tickets',
},
```

- [ ] **Step 4: Wrap the Pending Tickets tile in a `<Link>`**

The existing tiles are plain `<div>` elements. For the fourth tile, replace the wrapping `<div className="panel" ...>` with a `<Link to="/admin/it-department/tickets" className="panel" style={{ ..., textDecoration: 'none', display: 'block' }}>`.

Since only the new tile needs to be a link, the simplest implementation is to check `kpi.to` in the map:

```tsx
{
  kpis.map((kpi) => {
    const inner = (
      <div
        className="panel"
        style={{
          padding: '16px 18px 16px 22px',
          position: 'relative',
          overflow: 'hidden',
          cursor: kpi.to ? 'pointer' : undefined,
        }}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 10,
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
            {kpi.label}
          </p>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: kpi.bar, opacity: 0.55 }}
          >
            {kpi.icon}
          </span>
        </div>
        <p
          style={{
            fontSize: 'var(--kpi-num-size)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
          }}
        >
          {loading ? '—' : (kpi.value ?? 0)}
        </p>
        <p
          style={{
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {kpi.sub}
        </p>
      </div>
    )
    return kpi.to ? (
      <Link key={kpi.label} to={kpi.to} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    ) : (
      <div key={kpi.label}>{inner}</div>
    )
  })
}
```

Make sure `Link` is imported from `react-router-dom` — it already is in `ITDashboard.tsx` (line 2).

- [ ] **Step 5: Add `to?: string` to the kpi object shape** (TypeScript will infer it, but make the intent clear by typing the array inline or via an interface if the existing code uses one).

- [ ] **Step 6: Run TSC**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/it/ITDashboard.tsx
git commit -m "feat(it): add Pending Tickets stat card to IT dashboard"
```

---

## Task 13: Final TSC + Build Check

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Vite build check**

```bash
npm run build
```

Expected: builds successfully with no type errors or import failures.

- [ ] **Step 3: Smoke test manually**

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/admin/it-department/tickets` — Kanban renders with 3 columns.
3. Navigate to `http://localhost:3000/admin/it-department` — 4 KPI tiles visible, "Pending Tickets" links to `/tickets`.
4. Check the top bar — "IT Support" button visible for `SUPER_ADMIN`/`FOUNDER`.
5. Click "IT Support" — modal opens, submit a test ticket, toast appears.
6. Return to Helpdesk — ticket appears in Open column.
7. Drag ticket to "In Progress" — status updates instantly.
8. Click ticket — slide-out panel opens, comments load, post a comment.
9. Navigate to `http://localhost:3000/admin/roles` — Edit any role, confirm "IT Support" group is visible with the `SUBMIT_IT_TICKET` checkbox.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete IT Helpdesk — Kanban, submit modal, permissions, and dashboard stat"
```
