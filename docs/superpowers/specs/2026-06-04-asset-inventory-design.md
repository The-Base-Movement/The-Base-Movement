# Asset Inventory — Design Spec

_Date: 2026-06-04_

## Overview

A reusable `<AssetInventory departmentId={string} viewMode="department" | "master" />` component that any admin department page can drop in. Each department sees only its own assets. `IT_MANAGER` and `SUPER_ADMIN`/`FOUNDER` can switch to master mode to see and filter across all departments.

---

## 1. New Role

Add `IT_MANAGER` to the `AdminRole` union in `src/types/admin.ts`. This role grants:

- Write access to asset inventory (add/edit/delete assets, categories, assignments, maintenance logs)
- Access to `viewMode="master"` (all departments + department filter)

All other roles are read-only within their own department.

---

## 2. File Structure

```
src/components/admin/AssetInventory/
  index.tsx                  — <AssetInventory> entry point; reads props + role, renders table + panel
  AssetTable.tsx             — sortable table; condition pills; row click + kebab menu
  AssetDetailPanel.tsx       — slide-out drawer; tab switcher (Overview / Maintenance / Checkout)
  MaintenanceTimeline.tsx    — vertical timeline of maintenance log entries, newest first
  CheckoutHistory.tsx        — assignment history table + "Check Out" action
  ConditionUpdateForm.tsx    — condition select + note textarea; calls updateCondition RPC
  AddCategoryModal.tsx       — name field; sets department_id from prop
  AddAssetModal.tsx          — name, category, serial number, description, initial condition
  useAssetInventory.ts       — all Supabase queries and mutations; exposes state + handlers
  types.ts                   — local TS types mirroring DB schema
```

---

## 3. Props & Role Gate

```ts
interface AssetInventoryProps {
  departmentId: string
  viewMode: 'department' | 'master'
}
```

- `viewMode="master"` is only rendered for `IT_MANAGER`, `SUPER_ADMIN`, or `FOUNDER`. Any other role accessing master mode sees a permission-denied message.
- Role is read from `adminService.currentUser.role`.

---

## 4. Data Flow

### List query (useAssetInventory)

- Fetches `assets` joined to `asset_categories` (name).
- Joins the latest `asset_assignments` row where `checked_in_at IS NULL` → `assigned_to` → `users.full_name`.
- Department mode: filters `assets.department_id = departmentId`.
- Master mode: no department filter; exposes a `filterDept` state for the dropdown.

### Detail panel (lazy, on row click)

- Full asset row.
- `asset_maintenance_logs` ordered `created_at DESC`.
- `asset_assignments` ordered `checked_out_at DESC`.

### Condition update (atomic via RPC)

A Supabase RPC `update_asset_condition(asset_id, new_condition, note, logged_by)` runs both writes in one transaction:

```sql
UPDATE assets SET condition = new_condition WHERE id = asset_id;
INSERT INTO asset_maintenance_logs (asset_id, logged_by, note, condition_after) VALUES (...);
```

Hook re-fetches list and detail panel data on success.

### Check-out

`INSERT INTO asset_assignments (asset_id, assigned_to, notes)` — `checked_in_at` left null.

### Check-in

`UPDATE asset_assignments SET checked_in_at = now() WHERE id = $id AND checked_in_at IS NULL`.

---

## 5. UI

### Asset Table

Columns: **Name** | **Category** | **Condition** | **Assigned To** | **Last Updated** | **⋮**

- Condition uses `.pill`: `pill-ok` (Good), `pill-warn` (Fair), `pill-err` (Damaged).
- "Assigned To" shows `full_name` of current assignee, or "—" if unassigned.
- Master mode adds a **Department** filter `<select>` above the table.
- Top-right toolbar: **Add Category** (department mode only) + **Add Asset** (authorized roles only).
- ⋮ kebab: Edit asset, Delete asset (authorized roles only).

### Detail Panel

Slides in from the right; fixed overlay ~480px wide. Clicking outside closes it.

**Overview tab**

- Fields: Name, Category, Serial Number, Description, Condition pill, Department, Created.
- Condition Update form (authorized roles only): condition `<select>` + note `<textarea>` + "Update Condition" `.btn-primary` button.

**Maintenance Log tab**

- Vertical timeline, newest entry first.
- Each entry: date/time, logged-by name, note text, condition-after pill.
- Empty state: "No maintenance records yet."

**Check-in / Check-out tab**

- "Check Out" button (authorized roles only) → member-picker dropdown (fetches `users`) + notes field + confirm.
- History table: Assignee | Checked Out | Checked In (or "Currently out" `pill-warn`).

### Add Category Modal

Fields: Category Name. `department_id` is set automatically from the `departmentId` prop.

### Add Asset Modal

Fields: Name, Category (dropdown from `asset_categories` for this dept + global), Serial Number, Description, Condition (default: Good).

---

## 6. Supabase RPC Required

```sql
create or replace function update_asset_condition(
  p_asset_id uuid,
  p_condition asset_condition,
  p_note text,
  p_logged_by uuid
) returns void language plpgsql security definer as $$
begin
  update assets set condition = p_condition where id = p_asset_id;
  insert into asset_maintenance_logs (asset_id, logged_by, note, condition_after)
  values (p_asset_id, p_logged_by, p_note, p_condition);
end;
$$;
```

This function lives in a non-exposed schema or is gated via RLS on the underlying tables (already in place).

---

## 7. Design System Conventions

- All layout via `.panel`, `.ph`, inline styles — no shadcn/lucide.
- Icons: Material Symbols only.
- Buttons: `.btn .btn-primary`, `.btn .btn-outline`, `.btn .btn-dest`.
- Border radius: `var(--radius-xs/sm/md/lg)` — no hardcoded px.
- Typography: `fontFamily: "'Public Sans', sans-serif"`, weight via `var(--font-weight-medium, 500)`.
- Slide-out panel uses the modal overlay pattern from CLAUDE.md but anchored right instead of centred.

---

## 8. Out of Scope (Phase B–D)

- Bulk asset import / CSV upload.
- QR code / barcode scanning.
- Email notifications on check-out.

---

## 9. Phase A Extension — Additional Schema (2026-06-05)

### New columns on `assets`

| Column           | Type          | Notes                                             |
| ---------------- | ------------- | ------------------------------------------------- |
| `purchase_price` | decimal(10,2) | nullable                                          |
| `purchase_date`  | date          | nullable                                          |
| `asset_tag`      | text UNIQUE   | auto-generated by DB trigger: `TBM-{DEPT}-{0042}` |
| `qr_code_url`    | text          | Supabase Storage URL set after QR generation      |

### New column on `asset_categories`

| Column           | Type    | Default |
| ---------------- | ------- | ------- |
| `lifespan_years` | integer | 3       |

Used for straight-line depreciation in Phase H.

### `asset_requests` table

Handles the request-and-approval flow for non-IT staff.

| Column                 | Type                          | Notes           |
| ---------------------- | ----------------------------- | --------------- |
| `id`                   | uuid PK                       |                 |
| `asset_id`             | uuid FK → assets              |                 |
| `requested_by`         | uuid FK → users               |                 |
| `department_id`        | text                          |                 |
| `reason`               | text                          |                 |
| `status`               | enum: pending/approved/denied | default pending |
| `reviewed_by`          | uuid FK → users               | nullable        |
| `review_note`          | text                          | nullable        |
| `expected_return_date` | date                          | nullable        |
| `created_at`           | timestamptz                   |                 |

### `asset_alerts` table

Stores overdue / damaged / missing flags.

| Column          | Type                          | Notes         |
| --------------- | ----------------------------- | ------------- |
| `id`            | uuid PK                       |               |
| `asset_id`      | uuid FK → assets              |               |
| `assignment_id` | uuid FK → asset_assignments   | nullable      |
| `alert_type`    | enum: overdue/damaged/missing |               |
| `resolved`      | boolean                       | default false |
| `created_at`    | timestamptz                   |               |

### DB automation

- **`generate_asset_tag(dept_id)`** — generates `TBM-{DEPT_3CHAR}-{SEQ_4DIGIT}` from a global sequence.
- **`trg_asset_tag`** — BEFORE INSERT trigger on `assets` that calls `generate_asset_tag`.
- **`flag_overdue_asset_assignments()`** — RPC that inserts `overdue` alerts for assignments past `expected_return_date` with no existing unresolved alert.
- **pg_cron** — `flag-overdue-assets` runs daily at 07:00 UTC.

---

## 10. Phase E — Asset Request Flow

### Who sees what

- **Non-admin members** (all roles except IT_MANAGER, SUPER_ADMIN, FOUNDER): see "Request Asset" button; cannot check out directly.
- **IT_MANAGER / SUPER_ADMIN / FOUNDER**: see a "Requests" tab in the component with a pending count badge; can Approve or Deny with a note.

### Request flow

1. Member clicks "Request Asset" → `RequestAssetModal`: searchable asset dropdown (available assets only), reason textarea, optional expected return date.
2. On submit: `INSERT INTO asset_requests`.
3. On approve: `INSERT INTO asset_assignments` (auto checkout) + mark request `approved` + create in-app notification for requester.
4. On deny: mark request `denied` + set `review_note` + create in-app notification for requester.

### Notifications

Uses existing in-app notification system (`adminService` notifications pattern). No email/SMS.

### New files

```
src/components/admin/AssetInventory/
  RequestAssetModal.tsx      — asset picker + reason + return date
  RequestsQueue.tsx          — table of pending requests, Approve/Deny actions
```

Hook additions to `useAssetInventory`:

- `pendingRequests: AssetRequest[]`
- `submitRequest(payload) → Promise<boolean>`
- `approveRequest(id, note) → Promise<boolean>`
- `denyRequest(id, note) → Promise<boolean>`

---

## 11. Phase F — Overdue & Missing Alerts

### Alert creation

- `flag_overdue_asset_assignments()` runs via pg_cron daily at 07:00 UTC.
- On component mount, also called client-side via `supabase.rpc('flag_overdue_asset_assignments')` to catch same-day overdue cases.

### UI

- Asset table rows with unresolved `overdue` or `missing` alerts show a red `⚠` warning icon beside the asset name.
- IT Dashboard adds an "Asset Alerts" KPI tile (count of unresolved alerts) linking to `/admin/it-department/assets`.
- Inside the detail panel Overview tab: an Alerts section (IT_MANAGER+ only) listing active alerts with:
  - "Mark Resolved" button → sets `resolved = true`.
  - "Escalate to Missing" button → inserts a new `missing` alert.

### New files

```
src/components/admin/AssetInventory/AlertBadge.tsx   — inline warning icon
src/components/admin/AssetInventory/AlertsPanel.tsx  — alert list inside detail panel
```

Hook additions: `alerts: AssetAlert[]`, `resolveAlert(id)`, `escalateToMissing(assetId, assignmentId)`.

---

## 12. Phase G — QR Code & Asset Tagging

### Generation

- On `addAsset` success: client generates QR code via `qrcode` npm package encoding `https://{domain}/admin/it-department/assets?id={asset_id}`.
- QR image (PNG data URL) is uploaded to Supabase Storage bucket `asset-qr-codes` (public).
- `qr_code_url` column updated on the asset record.

### UI

- Asset detail panel Overview tab shows QR code image (80×80px) beside the asset tag field.
- **"Print Label"** button opens a `PrintLabelView` in a new browser tab/window: asset tag, QR code, asset name, condition — print-optimised layout.

### New files

```
src/components/admin/AssetInventory/PrintLabelView.tsx  — print-optimised label
```

Hook addition: `generateAndSaveQR(assetId, assetTag) → Promise<void>` called automatically after `addAsset`.

### Storage

Bucket: `asset-qr-codes` (public, read-only for anon). Files named `{asset_id}.png`.

---

## 13. Phase H — Export & Depreciation

### Export

- "Export" dropdown (CSV / PDF) appears in the toolbar for IT_MANAGER, SUPER_ADMIN, FOUNDER.
- Export respects active filters (department, condition, category).
- CSV: plain client-side generation using array-to-CSV, downloaded via `<a>` tag.
- PDF: uses `jspdf` + `jspdf-autotable` for a tabular report.
- Columns exported: Asset Tag, Name, Category, Department, Condition, Serial Number, Status, Purchase Price, Purchase Date, Assigned To.

### Depreciation

- Straight-line: `currentValue = purchasePrice × max(0, 1 - (ageInYears / lifespanYears))`.
- Shown in Overview tab as "Estimated Value" when `purchase_price` and `purchase_date` are set.
- Small line chart (Recharts `LineChart`) showing value from purchase date to end-of-life.

### Asset Value Summary (master mode only)

- Shown above the table in master view for IT_MANAGER+.
- Two KPI tiles: **Total Fleet Purchase Value** and **Estimated Current Value** (sum across all assets with price data).

### New files

```
src/components/admin/AssetInventory/ExportMenu.tsx         — dropdown with CSV/PDF handlers
src/components/admin/AssetInventory/DepreciationChart.tsx  — Recharts line chart
src/components/admin/AssetInventory/ValueSummary.tsx       — master-view KPI tiles
```
