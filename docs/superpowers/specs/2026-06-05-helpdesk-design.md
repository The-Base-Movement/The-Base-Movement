# Helpdesk Tickets — Design Spec

_Date: 2026-06-05_

## Overview

A reusable `<Helpdesk departmentId>` component for the admin side and a `<MyTickets>` member portal on the dashboard. Members submit tickets by choosing a department; each department's queue is managed independently by the roles assigned to it. Department → role mappings are DB-driven so new custom roles work without a redeploy.

---

## 1. New / Updated AdminRole Values

Add the following to the `AdminRole` union in `src/types/admin.ts` to match the full Roles Manager:

```ts
| 'CHAPTER_LEAD'
| 'CHAPTER_SECRETARY'
| 'FIELD_AGENT'
| 'COMMUNICATIONS_OFFICER'
| 'INTELLIGENCE_ANALYST'
| 'STORE_MANAGER'
| 'YOUTH_LEADER'
| 'MOVEMENT_LEADER'
```

---

## 2. File Structure

```
src/components/admin/Helpdesk/
  index.tsx                  — <Helpdesk departmentId> entry point; role gate, toolbar, table
  TicketTable.tsx            — sortable ticket list with priority/status pills
  TicketDetailPanel.tsx      — slide-out drawer: Thread + Details tabs
  TicketFilters.tsx          — status tabs + priority filter
  useHelpdesk.ts             — all Supabase queries and mutations
  types.ts                   — shared TS types

src/components/member/
  MyTickets.tsx              — member-facing page: own ticket list + submit button
  SubmitTicketModal.tsx      — department picker + form fields + file upload

src/pages/admin/it/
  ITHelpdesk.tsx             — mounts <Helpdesk departmentId="it"> (replaces ITTickets nav entry)
```

The existing `ITTickets.tsx` and `it_tickets` / `it_ticket_comments` tables are **not modified**. The new system is additive. Migration of old IT tickets is out of scope for this phase.

---

## 3. Database Schema

### `helpdesk_departments`

DB-driven config table. Seeded with all departments on first migration.

| Column                       | Type    | Notes                                                            |
| ---------------------------- | ------- | ---------------------------------------------------------------- |
| `id`                         | text PK | Slug: `'it'`, `'membership'`, `'chapter'`, etc.                  |
| `name`                       | text    | Display name e.g. "IT Support"                                   |
| `handler_roles`              | text[]  | Roles that can manage this queue                                 |
| `restricted_submitter_roles` | text[]  | NULL = any member can submit. Set only for Movement Leader queue |
| `icon`                       | text    | Material Symbol name                                             |
| `sort_order`                 | int     | Order in member department picker                                |
| `active`                     | boolean | Default true. Soft-disable without deleting                      |

**Seed data:**

| id              | name                   | handler_roles                                   | restricted_submitter_roles              | icon            |
| --------------- | ---------------------- | ----------------------------------------------- | --------------------------------------- | --------------- |
| it              | IT Support             | IT_MANAGER, SUPER_ADMIN, FOUNDER                | null                                    | computer        |
| membership      | Membership             | VERIFIER, ADMIN, FIELD_AGENT, CHAPTER_SECRETARY | null                                    | badge           |
| constituency    | Constituency Office    | CONSTITUENCY_LEAD, REGIONAL_DIRECTOR            | null                                    | location_city   |
| chapter         | Chapter Support        | CHAPTER_LEAD, CHAPTER_SECRETARY                 | null                                    | groups          |
| finance         | Finance                | FINANCE_OFFICER                                 | null                                    | account_balance |
| media           | Media & Communications | CHIEF_EDITOR, COMMUNICATIONS_OFFICER            | null                                    | campaign        |
| store           | Store & Logistics      | STORE_MANAGER                                   | null                                    | storefront      |
| youth           | Youth Affairs          | YOUTH_LEADER                                    | null                                    | diversity_3     |
| executive       | Executive              | EXECUTIVE, ORGANIZER                            | null                                    | star            |
| movement_leader | Movement Leader        | MOVEMENT_LEADER, FOUNDER                        | SUPER_ADMIN, EXECUTIVE, FINANCE_OFFICER | shield_person   |

### `helpdesk_tickets`

| Column          | Type                                   | Notes                                     |
| --------------- | -------------------------------------- | ----------------------------------------- |
| `id`            | uuid PK DEFAULT gen_random_uuid()      |                                           |
| `department_id` | text FK → helpdesk_departments         |                                           |
| `subject`       | text NOT NULL                          |                                           |
| `description`   | text NOT NULL                          |                                           |
| `priority`      | enum: low/medium/high/urgent           | `urgent` is handler-assignable only       |
| `status`        | enum: open/in-progress/resolved/closed |                                           |
| `submitted_by`  | uuid FK → users                        |                                           |
| `assigned_to`   | uuid FK → users                        | nullable                                  |
| `created_at`    | timestamptz DEFAULT now()              |                                           |
| `updated_at`    | timestamptz DEFAULT now()              | Auto-updated by trigger on comment insert |

### `helpdesk_comments`

| Column        | Type                                         | Notes                                |
| ------------- | -------------------------------------------- | ------------------------------------ |
| `id`          | uuid PK DEFAULT gen_random_uuid()            |                                      |
| `ticket_id`   | uuid FK → helpdesk_tickets ON DELETE CASCADE |                                      |
| `author_id`   | uuid FK → users                              |                                      |
| `body`        | text NOT NULL                                |                                      |
| `is_internal` | boolean DEFAULT false                        | Internal notes hidden from submitter |
| `created_at`  | timestamptz DEFAULT now()                    |                                      |

### `helpdesk_attachments`

| Column        | Type                                         | Notes                       |
| ------------- | -------------------------------------------- | --------------------------- |
| `id`          | uuid PK DEFAULT gen_random_uuid()            |                             |
| `ticket_id`   | uuid FK → helpdesk_tickets ON DELETE CASCADE |                             |
| `uploaded_by` | uuid FK → users                              |                             |
| `file_url`    | text NOT NULL                                | Supabase Storage public URL |
| `file_name`   | text NOT NULL                                | Original filename           |
| `file_size`   | int                                          | Bytes                       |
| `created_at`  | timestamptz DEFAULT now()                    |                             |

### DB automation

- **`updated_at` trigger** — fires AFTER INSERT on `helpdesk_comments`, sets `helpdesk_tickets.updated_at = now()` for that ticket.
- **Storage bucket** — `helpdesk-attachments` (public read, authenticated insert).

---

## 4. RLS Policies

### `helpdesk_departments`

- SELECT: authenticated (all members and admins can read the department list).
- INSERT/UPDATE/DELETE: SUPER_ADMIN, FOUNDER only.

### `helpdesk_tickets`

- SELECT: `submitted_by = auth.uid()` OR current role is in the department's `handler_roles` OR role is SUPER_ADMIN/FOUNDER.
- INSERT: `submitted_by = auth.uid()` AND (department has no `restricted_submitter_roles` OR current role is in `restricted_submitter_roles`).
- UPDATE: current role is in the department's `handler_roles` OR role is SUPER_ADMIN/FOUNDER.

### `helpdesk_comments`

- SELECT (non-internal): `ticket.submitted_by = auth.uid()` OR handler.
- SELECT (internal, `is_internal = true`): handler only.
- INSERT: `ticket.submitted_by = auth.uid()` OR handler.

### `helpdesk_attachments`

- SELECT: same as ticket SELECT.
- INSERT: authenticated (any ticket participant).

---

## 5. Props

```ts
// Admin component
interface HelpdeskProps {
  departmentId: string
}

// Member component — no props, reads auth.uid() internally
// MyTickets.tsx is a standalone page
```

---

## 6. Admin UI — `<Helpdesk departmentId>`

### Role gate

Reads `adminService.currentUser.role`. If role is not in `handler_roles` for the department AND not SUPER_ADMIN/FOUNDER → shows "Access Restricted" message.

### Toolbar

- Status filter tabs: **All · Open · In Progress · Resolved · Closed** (`.btn-active-tab` / `.btn-inactive-tab`)
- Priority filter: dropdown (All / Low / Medium / High / Urgent)
- Export CSV button (handlers only) — respects active filters

### Ticket table

Columns: **Priority** | **Subject** | **Submitted by** | **Assigned to** | **Status** | **Last Updated** | **⋮**

- Priority: `.pill-err` (urgent/high), `.pill-warn` (medium), `.pill-mute` (low)
- Status: `.pill-err` (open), `.pill-warn` (in-progress), `.pill-ok` (resolved), `.pill-mute` (closed)
- Row click opens detail panel
- ⋮ kebab: Close ticket, Delete ticket (handler only)

### Detail panel (slide-out, 480px, right side)

**Thread tab:**

- Description block at top
- Comment thread (chronological, newest at bottom)
- Internal notes shown with a distinct background (muted yellow) and "Internal" label — hidden from member view
- Comment box with "Internal note" toggle for handlers

**Details tab:**

- Status select (handler only)
- Priority select (handler only — can set Urgent)
- Assign to dropdown (shows only members whose role is in `handler_roles` for this dept)
- Submitted by (read-only)
- Department (read-only)
- Created / Last updated (read-only)
- Attachments list with download links

---

## 7. Member UI — `<MyTickets>`

### Ticket list

Columns: Subject | Department badge | Status pill | Last Updated | →

Empty state: "You haven't submitted any tickets yet."

### Submit Ticket button → `SubmitTicketModal`

Steps:

1. **Department picker** — grid of department cards (icon + name). Restricted departments only shown to members with the required role.
2. **Ticket form:**
   - Subject (text input, required)
   - Description (textarea, required)
   - Priority: Low / Medium / High (member cannot set Urgent)
   - Attachments: drag-and-drop or browse, multiple files, max 10MB each
3. Submit → INSERT into `helpdesk_tickets` + INSERT into `helpdesk_attachments` for each file

### Ticket detail (read-only panel)

- Shows subject, description, status, priority, department
- Shows comment thread (excluding internal notes)
- Member can add a comment if ticket is not closed
- Shows attachments with download links

---

## 8. Notifications

On `status` change to `resolved` or `closed` by a handler: insert into the existing in-app notifications table for `submitted_by` user.

On new handler comment (non-internal) added to member's ticket: insert notification for `submitted_by`.

---

## 9. ITHelpdesk page

`src/pages/admin/it/ITHelpdesk.tsx` mounts `<Helpdesk departmentId="it" />`. The existing IT nav item "Helpdesk" is updated to point here. `ITTickets.tsx` remains unchanged (no data migration this phase).

---

## 10. Dashboard route

Add `/dashboard/tickets` route pointing to `MyTickets.tsx`. Add "My Tickets" nav item to `DashboardLayout.tsx` sidebar.

---

## 11. Out of Scope (this phase)

- Migration of existing `it_tickets` data to `helpdesk_tickets`.
- Email or SMS notifications (in-app only).
- Ticket merging or linking.
- SLA tracking / due dates.
- Bulk actions on tickets.
