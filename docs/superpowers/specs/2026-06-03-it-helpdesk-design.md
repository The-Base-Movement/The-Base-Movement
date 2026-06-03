# IT Helpdesk — Design Spec

**Date:** 2026-06-03  
**Branch:** feat/executive-dashboard-finance-approval-chain  
**Status:** Approved

---

## Overview

Build an IT Helpdesk system for The Base Movement admin platform. IT staff manage tickets via a Kanban board. Any admin role with the `SUBMIT_IT_TICKET` permission can raise tickets from a global modal in the admin layout. Ticket threads support comments from both IT staff and the original submitter.

---

## 1. Database Schema

### `it_tickets`

| Column         | Type          | Constraints                                                              |
| -------------- | ------------- | ------------------------------------------------------------------------ |
| `id`           | `uuid`        | PK, `gen_random_uuid()`                                                  |
| `title`        | `text`        | NOT NULL                                                                 |
| `description`  | `text`        | NOT NULL                                                                 |
| `priority`     | `text`        | NOT NULL, CHECK `IN ('low','medium','high')`, default `'medium'`         |
| `status`       | `text`        | NOT NULL, CHECK `IN ('open','in-progress','resolved')`, default `'open'` |
| `submitted_by` | `uuid`        | FK → `public.users(id)`, NOT NULL                                        |
| `assigned_to`  | `uuid`        | FK → `public.users(id)`, nullable                                        |
| `created_at`   | `timestamptz` | default `now()`                                                          |
| `updated_at`   | `timestamptz` | default `now()`, auto-updated via trigger                                |

### `it_ticket_comments`

| Column       | Type          | Constraints                                       |
| ------------ | ------------- | ------------------------------------------------- |
| `id`         | `uuid`        | PK, `gen_random_uuid()`                           |
| `ticket_id`  | `uuid`        | FK → `it_tickets(id)` ON DELETE CASCADE, NOT NULL |
| `author_id`  | `uuid`        | FK → `public.users(id)`, NOT NULL                 |
| `body`       | `text`        | NOT NULL                                          |
| `created_at` | `timestamptz` | default `now()`                                   |

### RLS Policies

- **IT staff** (`SUPER_ADMIN`, `FOUNDER`): full SELECT / INSERT / UPDATE on `it_tickets`; full SELECT / INSERT on `it_ticket_comments`.
- **Authenticated users (submitters)**: INSERT on `it_tickets` where `submitted_by = auth.uid()`; SELECT on tickets they submitted; INSERT comment on tickets they submitted.
- No DELETE exposed to any role via client (soft approach — tickets are audit records).

### Migration file

`supabase/migrations/20260603000100_create_it_helpdesk.sql`

---

## 2. Permissions & Roles Manager

### New permission entry

Add to `PERMISSION_GROUPS` in `src/pages/admin/RolesManager.tsx`:

```ts
{
  label: 'IT Support',
  resource: 'IT_SUPPORT',
  items: [
    { action: 'SUBMIT_IT_TICKET', label: 'Submit IT support tickets' },
  ],
}
```

Add `'SUBMIT_IT_TICKET'` to the `action` union in `AdminPermission` (`src/types/admin.ts`).  
Add `'IT_SUPPORT'` to the `resource` union in `AdminPermission`.

### Runtime permission check

- The `AdminLayout` (or a new `useITPermission` hook) reads the current user's role record from `roleService.getRoles()` / `adminService.getCurrentUser()`.
- If `permissions` includes `{ action: 'SUBMIT_IT_TICKET', resource: 'IT_SUPPORT' }`, the **IT Support** button is rendered in the top bar.
- `SUPER_ADMIN` and `FOUNDER` always have full ticket management access (bypasses permission check for the IT tickets page itself).

---

## 3. IT Tickets Page

**Route:** `/admin/it-department/tickets`  
**File:** `src/pages/admin/it/ITTickets.tsx`  
**Layout:** Rendered inside existing `ITDepartmentLayout` (inherits sidebar, role guard).

### Navigation

Add to `IT_NAV` in `ITDepartmentLayout.tsx`:

```ts
{ to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' }
```

Add lazy import + route entry to `src/routes.tsx`.

### KPI Strip

Three tiles at the top of the page (existing KPI tile pattern):

- **Total Tickets** — charcoal bar — count of all `it_tickets`
- **Open** — destructive (red) bar — count where `status = 'open'`
- **Resolved** — primary (green) bar — count where `status = 'resolved'`

### Kanban Board (desktop — `useIsMobile() === false`)

Three columns rendered with `@dnd-kit/core`:

| Column      | Status value  | Bar / accent |
| ----------- | ------------- | ------------ |
| Open        | `open`        | charcoal     |
| In Progress | `in-progress` | gold         |
| Resolved    | `resolved`    | green        |

Each column header shows the column label + a count badge.

**Ticket card** displays:

- Title (truncated to 2 lines)
- Priority pill: `pill-err` (high) / `pill-warn` (medium) / `pill-mute` (low)
- Submitter name
- Assigned-to name (or "Unassigned")
- Created date (relative, e.g. "2 days ago")

**Drag behaviour:** `DndContext` + `useDroppable` per column. On `onDragEnd`, if the card was dropped in a different column, call `supabase.from('it_tickets').update({ status })` immediately. Show a toast on error and revert optimistically.

**Assign dropdown:** Small "Assign" button on each card opens a dropdown listing IT staff (users with role `SUPER_ADMIN` or `FOUNDER`). Selecting one updates `assigned_to`.

### Mobile view (`useIsMobile() === true`)

Cards stacked in a single list, sorted by `created_at` desc. Each card shows the same fields plus a `<select>` element pre-set to the current status. On change, update `status` in Supabase.

### Ticket Detail Slide-Out Panel

Triggered by clicking anywhere on a card (except the assign dropdown).

- Right-side drawer, 400px wide, `position: fixed`, `right: 0`, `top: 0`, `bottom: 0`, `zIndex: 80`.
- Semi-transparent overlay backdrop covers the rest of the screen; clicking it closes the panel.
- Rendered via `createPortal`.

**Panel sections:**

1. Header — title, close button, priority pill, status pill
2. Meta row — submitter, assigned-to, created date
3. Description — full text
4. Comments thread — scrollable list of comments (author name, timestamp, body)
5. Comment input — textarea + "Add comment" `btn-primary btn-sm` button; accessible to IT staff and the original submitter (checked by comparing `author_id === current user id`); others see a read-only note.

---

## 4. Submit IT Support Ticket Modal

### Trigger

A `btn-outline btn-sm` button with icon `support_agent` and label "IT Support" added to the right side of the `AdminLayout` top bar. Visibility gated by the `SUBMIT_IT_TICKET` permission check (see Section 2). IT staff (`SUPER_ADMIN` / `FOUNDER`) also see it for testing purposes.

**File:** `src/components/admin/SubmitTicketModal.tsx` (standalone modal component)

### Form fields

| Field       | Control                               | Validation              |
| ----------- | ------------------------------------- | ----------------------- |
| Title       | text input                            | required, max 120 chars |
| Description | textarea (4 rows)                     | required                |
| Priority    | 3-button toggle (Low / Medium / High) | default Medium          |

### Submit behaviour

1. Insert into `it_tickets` with `submitted_by = current user auth uid`, `status = 'open'`.
2. On success: close modal, show toast "Ticket submitted. The IT team will be in touch."
3. On error: show inline error message, keep modal open.

---

## 5. IT Dashboard Stat Card

**File:** `src/pages/admin/it/ITDashboard.tsx`

Add a fourth KPI tile to the existing `kpis` grid:

- **Label:** "Pending Tickets"
- **Value:** count of `it_tickets` where `status IN ('open', 'in-progress')`
- **Bar color:** `hsl(var(--destructive))` (red)
- **Sub-label:** "Open and in-progress tickets"
- Clicking the tile navigates to `/admin/it-department/tickets` (wrap in `<Link>` or add `onClick` with `navigate`).

---

## 6. New Files

| File                                                        | Purpose                           |
| ----------------------------------------------------------- | --------------------------------- |
| `supabase/migrations/20260603000100_create_it_helpdesk.sql` | Schema + RLS + trigger            |
| `src/pages/admin/it/ITTickets.tsx`                          | Main Kanban page                  |
| `src/pages/admin/it/ITTicketPanel.tsx`                      | Slide-out detail + comments panel |
| `src/components/admin/SubmitTicketModal.tsx`                | Global submit modal               |

## 7. Modified Files

| File                                        | Change                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `src/types/admin.ts`                        | Add `SUBMIT_IT_TICKET` action + `IT_SUPPORT` resource to `AdminPermission` |
| `src/pages/admin/RolesManager.tsx`          | Add IT Support permission group                                            |
| `src/pages/admin/it/ITDepartmentLayout.tsx` | Add Helpdesk nav item                                                      |
| `src/pages/admin/it/ITDashboard.tsx`        | Add Pending Tickets KPI tile                                               |
| `src/routes.tsx`                            | Add `/admin/it-department/tickets` route + lazy import                     |
| `src/components/layouts/AdminLayout.tsx`    | Add IT Support button + permission check                                   |

---

## 8. Dependencies

- `@dnd-kit/core` — drag-and-drop engine
- `@dnd-kit/sortable` — sortable utilities (used for card ordering within a column if needed)

Install: `npm install @dnd-kit/core @dnd-kit/sortable`
