# Audit: IT Helpdesk

**Date:** 2026-06-03  
**Branch:** `feat/executive-dashboard-finance-approval-chain`  
**PR:** [#4](https://github.com/Styphler17/The-Base-Movement/pull/4)  
**Status:** Open — awaiting review

---

## 1. Scope of Work

Full IT Helpdesk system covering:

1. Database schema — ticket and comment tables with RLS
2. Permission system — new `SUBMIT_IT_TICKET` / `IT_SUPPORT` entry in Roles Manager
3. IT Tickets Kanban page — drag-and-drop (desktop) + status-select list (mobile)
4. Ticket detail slide-out panel — full thread with comments
5. Global submit modal — accessible from AdminLayout top bar
6. IT Dashboard stat card — Pending Tickets count

---

## 2. Database Changes

### `it_tickets` (new table)

| Column         | Type                         | Notes                                                 |
| -------------- | ---------------------------- | ----------------------------------------------------- |
| `id`           | `uuid` PK                    | `gen_random_uuid()`                                   |
| `title`        | `text NOT NULL`              |                                                       |
| `description`  | `text NOT NULL`              |                                                       |
| `priority`     | `text NOT NULL`              | CHECK `low / medium / high`, default `medium`         |
| `status`       | `text NOT NULL`              | CHECK `open / in-progress / resolved`, default `open` |
| `submitted_by` | `uuid FK → public.users(id)` | NOT NULL                                              |
| `assigned_to`  | `uuid FK → public.users(id)` | nullable                                              |
| `created_at`   | `timestamptz`                | `now()`                                               |
| `updated_at`   | `timestamptz`                | auto-updated via trigger                              |

### `it_ticket_comments` (new table)

| Column       | Type                         | Notes               |
| ------------ | ---------------------------- | ------------------- |
| `id`         | `uuid` PK                    | `gen_random_uuid()` |
| `ticket_id`  | `uuid FK → it_tickets(id)`   | ON DELETE CASCADE   |
| `author_id`  | `uuid FK → public.users(id)` | NOT NULL            |
| `body`       | `text NOT NULL`              |                     |
| `created_at` | `timestamptz`                | `now()`             |

### RLS Policies

| Table                | Policy                         | Scope                                                              |
| -------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `it_tickets`         | `it_tickets_staff_all`         | IT staff (`SUPER_ADMIN`, `FOUNDER`) — full SELECT/INSERT/UPDATE    |
| `it_tickets`         | `it_tickets_submitter_insert`  | Any authenticated admin — INSERT where `submitted_by = auth.uid()` |
| `it_tickets`         | `it_tickets_submitter_select`  | SELECT own tickets (`submitted_by = auth.uid()`)                   |
| `it_ticket_comments` | `it_comments_staff_all`        | IT staff — full SELECT/INSERT                                      |
| `it_ticket_comments` | `it_comments_submitter_insert` | INSERT comment on own ticket only                                  |
| `it_ticket_comments` | `it_comments_submitter_select` | SELECT comments on own tickets only                                |

### Migrations

| File                                                                       | Purpose                                                         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `supabase/migrations/20260603000100_create_it_helpdesk.sql`                | Tables, trigger, RLS                                            |
| `supabase/migrations/20260603000200_fix_it_tickets_fk_to_public_users.sql` | Repoints FKs from `admins` → `users` for PostgREST join support |

---

## 3. Permission System Changes

### `src/types/admin.ts`

**1 new `action` value added to `AdminPermission`:**

```
SUBMIT_IT_TICKET
```

**1 new `resource` value added to `AdminPermission`:**

```
IT_SUPPORT
```

### `src/pages/admin/RolesManager.tsx`

New group added to `PERMISSION_GROUPS`:

```ts
{
  label: 'IT Support',
  resource: 'IT_SUPPORT',
  items: [{ action: 'SUBMIT_IT_TICKET', label: 'Submit IT support tickets' }],
}
```

Visible in the Edit Role modal at `/admin/roles`. Any role granted this permission sees the **IT Support** button in the AdminLayout top bar.

IT staff (`SUPER_ADMIN` / `FOUNDER`) always see the button regardless of permission, via a role bypass in `canSubmitTicket`.

---

## 4. New Files

| File                                         | Responsibility                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `src/pages/admin/it/ITTickets.tsx`           | Kanban page — data fetching, KPI strip, board, mobile list, panel trigger |
| `src/pages/admin/it/ITTicketPanel.tsx`       | Slide-out drawer — ticket detail, comment thread, comment input           |
| `src/pages/admin/it/itTicketUtils.ts`        | Shared `TICKET_COLUMNS` config and `relativeTime` helper                  |
| `src/components/admin/SubmitTicketModal.tsx` | Submit form modal — title, description, priority toggle                   |

---

## 5. Modified Files

| File                                        | Change                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/types/admin.ts`                        | +`SUBMIT_IT_TICKET` action, +`IT_SUPPORT` resource                                |
| `src/pages/admin/RolesManager.tsx`          | +IT Support permission group                                                      |
| `src/pages/admin/it/ITDepartmentLayout.tsx` | +Helpdesk nav item (`confirmation_number` icon)                                   |
| `src/pages/admin/it/ITDashboard.tsx`        | +4th KPI tile: Pending Tickets (red bar, links to `/tickets`)                     |
| `src/routes.tsx`                            | +lazy import `ITTickets`, +route `/admin/it-department/tickets`                   |
| `src/components/layouts/AdminLayout.tsx`    | +`canSubmitTicket` computed flag, +IT Support button, +`SubmitTicketModal` render |

---

## 6. Key Design Decisions

### FK points to `public.users`, not `public.admins`

Admin names (`full_name`) live in `public.users`, not `public.admins` (admins table only has `id`, `role`, `permissions`, `assigned_region`). FKs were initially set to `admins` — corrected in the fix migration. PostgREST can only follow FK joins within the `public` schema, and `users` is the correct source for profile data. `admins.id = users.id = auth.uid()` — RLS is unaffected.

### Assign dropdown uses `createPortal` + `position: fixed`

The Kanban card's `.panel` container clips absolutely-positioned children. The dropdown is portalled to `document.body` and positioned using `getBoundingClientRect()` on the Assign button at click time.

### Responsive strategy

`useIsMobile()` switches between the full `@dnd-kit` Kanban board (desktop) and a stacked card list with a `<select>` per card (mobile). Both views share the same data layer and `updateStatus` handler.

### Comments access

Both IT staff and the original ticket submitter can post comments. Anyone else sees a read-only note. Enforced both in the UI (`canComment` flag) and at the database level via RLS `WITH CHECK`.

---

## 7. Known Limitations

- No email/push notification on ticket assignment or new comment — would require an edge function trigger.
- No ticket editing after submission — by design (tickets are treated as audit records).
- Drag-and-drop does not support intra-column reordering — only cross-column status changes.
- `SUPER_ADMIN` and `FOUNDER` are the only roles that can view and manage the full ticket list. A dedicated `IT_MANAGER` role is not yet in the system.

---

## 8. Post-Merge Checklist

- [ ] Grant `SUBMIT_IT_TICKET` to relevant roles at `/admin/roles`
- [ ] Verify IT staff can view, assign, and update ticket status
- [ ] Verify a non-IT admin can submit a ticket and see it appear in their own view
- [ ] Confirm comments post correctly from both IT staff and submitter
- [ ] Confirm Pending Tickets tile on IT Dashboard counts correctly and link works
