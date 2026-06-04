# IT Licenses — Design Spec

**Date:** 2026-06-04
**Route:** `/admin/it-department/licenses`
**Access:** `SUPER_ADMIN`, `FOUNDER` (matches existing `IT_ALLOWED_ROLES`)

---

## Overview

A single page inside the IT Department section that lets the IT team track all software subscriptions, domain registrations, hosting plans, and API subscriptions. Surfaces upcoming renewals visually and gives a financial overview of recurring IT spend.

---

## Database

### Table: `public.it_licenses`

| Column          | Type            | Constraints                                                            |
| --------------- | --------------- | ---------------------------------------------------------------------- |
| `id`            | `uuid`          | PK, default `gen_random_uuid()`                                        |
| `software_name` | `text`          | NOT NULL                                                               |
| `vendor`        | `text`          | NOT NULL                                                               |
| `category`      | `text`          | NOT NULL — `'Domain' \| 'Hosting' \| 'SaaS' \| 'API'`                  |
| `cost`          | `numeric(10,2)` | NOT NULL                                                               |
| `billing_cycle` | `text`          | NOT NULL — `'Monthly' \| 'Yearly'`                                     |
| `renewal_date`  | `date`          | NOT NULL                                                               |
| `auto_renew`    | `boolean`       | NOT NULL, default `false`                                              |
| `status`        | `text`          | NOT NULL, default `'Active'` — `'Active' \| 'Inactive' \| 'Cancelled'` |
| `url`           | `text`          | nullable                                                               |
| `notes`         | `text`          | nullable                                                               |
| `created_at`    | `timestamptz`   | default `now()`                                                        |

No foreign keys needed — licenses are IT team-managed records, not linked to individual users.

**RLS:** `SUPER_ADMIN` and `FOUNDER` can SELECT/INSERT/UPDATE/DELETE. No public access.

---

## KPI Tiles (4-column strip)

| Tile           | Value                                                           | Bar colour |
| -------------- | --------------------------------------------------------------- | ---------- |
| Total Licenses | count of Active + Inactive rows                                 | charcoal   |
| Monthly Spend  | sum of monthly costs (yearly ÷ 12 + monthly as-is), Active only | green      |
| Annual Spend   | normalised annual total (monthly × 12 + yearly), Active only    | gold       |
| Expiring Soon  | count of Active licenses with `renewal_date` within 30 days     | red        |

---

## Category Donut Chart

Shows cost distribution by category (Domain / Hosting / SaaS / API) for **Active** licenses only. Uses annual-normalised cost so monthly and yearly subscriptions are comparable. Same donut + legend pattern as the Finance Dashboard.

---

## CRUD Table

### Columns

| Column       | Notes                                                    |
| ------------ | -------------------------------------------------------- |
| Software     | Name + vendor as subtitle                                |
| Category     | Pill badge                                               |
| Cost         | Formatted with cycle (e.g. `GH₵ 120.00 / yr`)            |
| Renewal Date | Date; red + warning icon if ≤ 30 days away               |
| Auto-renew   | Checkbox icon (check_circle / cancel)                    |
| Status       | Pill: Active (green) / Inactive (mute) / Cancelled (red) |
| Actions      | Edit · Delete dropdown                                   |

### Renewal Alert Logic

- `daysUntilRenewal = differenceInDays(renewal_date, today)`
- `≤ 30 days`: date cell turns red, shows `warning` Material Symbol
- `≤ 7 days`: additionally shows `pill-err` badge "Expires soon"
- Cancelled / Inactive licenses never show alerts regardless of date

### Filters

- Status filter tabs: All / Active / Inactive / Cancelled
- Category filter dropdown

### Add / Edit Modal

Full-screen portal modal (same `createPortal` pattern as rest of admin). Fields:

- Software Name (text, required)
- Vendor (text, required)
- Category (select: Domain / Hosting / SaaS / API, required)
- URL (text, optional)
- Cost (number, required)
- Billing Cycle (select: Monthly / Yearly, required)
- Renewal Date (date input, required)
- Auto-renew (checkbox)
- Status (select: Active / Inactive / Cancelled, required)
- Notes (textarea, optional)

### Delete

Soft-delete: sets `status = 'Cancelled'` rather than hard DELETE, preserving history. A separate "Permanently delete" action (destructive confirm modal) is available only for already-Cancelled rows.

---

## Navigation

Add `{ to: '/admin/it-department/licenses', icon: 'license', label: 'Licenses' }` to `IT_NAV` in `ITDepartmentLayout.tsx`.

---

## File Structure

```
src/pages/admin/it/
  ITLicenses.tsx          ← new page
supabase/migrations/
  20260604000100_create_it_licenses.sql
```

No new service file needed — Supabase queries are simple enough to inline in the page component, consistent with `ITSystem.tsx` and `ITSecurity.tsx`.

---

## Data Flow

1. `loadLicenses()` — `SELECT * FROM it_licenses ORDER BY renewal_date ASC`
2. KPIs and chart data derived client-side from the fetched array (no extra RPC needed)
3. Add → `INSERT`, Edit → `UPDATE`, Soft-delete → `UPDATE status='Cancelled'`, Hard-delete → `DELETE`
4. All mutations re-call `loadLicenses()` on success

---

## Out of Scope

- Email/push notifications for renewals (can be a follow-up cron)
- Assigning a license to a specific team member
- Licence key / credential storage
