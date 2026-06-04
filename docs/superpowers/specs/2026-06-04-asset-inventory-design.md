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

## 8. Out of Scope (this phase)

- Bulk asset import / CSV upload.
- Asset depreciation or financial tracking.
- QR code / barcode scanning.
- Email notifications on check-out.
