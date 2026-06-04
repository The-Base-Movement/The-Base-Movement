# Asset Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `<AssetInventory>` component with department/master modes, a formal check-in/check-out flow, condition tracking, and a maintenance log timeline — wired into the IT Department page.

**Architecture:** A self-contained folder component (`src/components/admin/AssetInventory/`) owns all types, a single data hook, and discrete UI sub-components. All Supabase calls go through `useAssetInventory.ts`; no component touches the DB directly. An atomic Supabase RPC handles condition updates so the asset record and maintenance log are always in sync.

**Tech Stack:** React 18, TypeScript, Supabase JS v2, design system CSS classes (`.panel`, `.btn`, `.pill`), Material Symbols icons, Sonner toasts.

---

## File Map

| Action | Path                                                          | Responsibility                                     |
| ------ | ------------------------------------------------------------- | -------------------------------------------------- |
| Modify | `src/types/admin.ts`                                          | Add `IT_MANAGER` to `AdminRole` union              |
| Modify | `src/pages/admin/it/ITDepartmentLayout.tsx`                   | Allow `IT_MANAGER` role access                     |
| Create | `src/components/admin/AssetInventory/types.ts`                | All shared TS types                                |
| Create | `src/components/admin/AssetInventory/useAssetInventory.ts`    | Data hook — all Supabase calls                     |
| Create | `src/components/admin/AssetInventory/AssetTable.tsx`          | Sortable table with condition/status pills         |
| Create | `src/components/admin/AssetInventory/AddCategoryModal.tsx`    | Department-scoped category creation                |
| Create | `src/components/admin/AssetInventory/AddAssetModal.tsx`       | New asset form                                     |
| Create | `src/components/admin/AssetInventory/ConditionUpdateForm.tsx` | Inline condition update → auto maintenance log     |
| Create | `src/components/admin/AssetInventory/MaintenanceTimeline.tsx` | Vertical log timeline                              |
| Create | `src/components/admin/AssetInventory/CheckOutModal.tsx`       | Searchable member picker + return date + notes     |
| Create | `src/components/admin/AssetInventory/CheckInModal.tsx`        | Close assignment + prompt condition update         |
| Create | `src/components/admin/AssetInventory/CheckoutHistory.tsx`     | Assignment history table + check-out trigger       |
| Create | `src/components/admin/AssetInventory/AssetDetailPanel.tsx`    | Slide-out drawer with 3 tabs                       |
| Create | `src/components/admin/AssetInventory/index.tsx`               | Entry point — role gate, toolbar, wires everything |
| Create | `src/pages/admin/it/ITAssets.tsx`                             | Page wrapper that mounts `<AssetInventory>`        |
| Modify | `src/pages/admin/it/ITDepartmentLayout.tsx`                   | Add Assets nav item                                |
| Modify | `src/routes.tsx`                                              | Add `/admin/it-department/assets` route            |
| Create | `src/test/assetInventory.test.ts`                             | Hook unit tests                                    |

---

## Task 1: DB — Add `expected_return_date` column + create RPC

**Files:**

- Supabase MCP (no local file)

- [ ] **Step 1: Add `expected_return_date` to `asset_assignments`**

Via Supabase MCP `apply_migration`:

```sql
ALTER TABLE public.asset_assignments
  ADD COLUMN expected_return_date date NULL;
```

Migration name: `add_expected_return_date_to_asset_assignments`

- [ ] **Step 2: Create the atomic condition-update RPC**

Via Supabase MCP `apply_migration`:

```sql
create or replace function public.update_asset_condition(
  p_asset_id uuid,
  p_condition asset_condition,
  p_note text,
  p_logged_by uuid
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update assets set condition = p_condition where id = p_asset_id;
  insert into asset_maintenance_logs (asset_id, logged_by, note, condition_after)
  values (p_asset_id, p_logged_by, p_note, p_condition);
end;
$$;
```

Migration name: `create_update_asset_condition_rpc`

- [ ] **Step 3: Verify via Supabase MCP `execute_sql`**

```sql
select routine_name from information_schema.routines
where routine_schema = 'public' and routine_name = 'update_asset_condition';
```

Expected: one row returned.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): add expected_return_date + update_asset_condition RPC"
```

---

## Task 2: Add `IT_MANAGER` role

**Files:**

- Modify: `src/types/admin.ts:586-601`
- Modify: `src/pages/admin/it/ITDepartmentLayout.tsx:10`

- [ ] **Step 1: Add to the AdminRole union in `src/types/admin.ts`**

Find the `AdminRole` type (line ~586) and add `IT_MANAGER`:

```ts
export type AdminRole =
  | 'FOUNDER'
  | 'ORGANIZER'
  | 'EXECUTIVE'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'IT_MANAGER'
  | 'FINANCE_OFFICER'
  | 'REGIONAL_DIRECTOR'
  | 'CONSTITUENCY_LEAD'
  | 'VERIFIER'
  | 'CHIEF_EDITOR'
  | 'SENIOR_EDITOR'
  | 'EDITOR'
  | 'JUNIOR_EDITOR'
  | 'REGIONAL_CORRESPONDENT'
```

- [ ] **Step 2: Update allowed roles in `ITDepartmentLayout.tsx`**

```ts
const IT_ALLOWED_ROLES = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']
```

- [ ] **Step 3: Fix the role badge label in `ITDepartmentLayout.tsx`**

Find the role badge text (currently: `user.role === 'FOUNDER' ? 'Founder' : 'IT Manager'`) and replace:

```tsx
{
  user.role === 'FOUNDER' ? 'Founder' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'IT Manager'
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/admin.ts src/pages/admin/it/ITDepartmentLayout.tsx
git commit -m "feat(roles): add IT_MANAGER admin role"
```

---

## Task 3: Create `types.ts`

**Files:**

- Create: `src/components/admin/AssetInventory/types.ts`

- [ ] **Step 1: Write the file**

```ts
export type AssetCondition = 'good' | 'fair' | 'damaged'
export type ViewMode = 'department' | 'master'

export interface AssetCategory {
  id: string
  name: string
  department_id: string | null
  created_at: string
}

export interface Asset {
  id: string
  name: string
  category_id: string
  department_id: string
  condition: AssetCondition
  serial_number: string | null
  description: string | null
  created_at: string
  // joined
  category_name: string
  assigned_to_id: string | null
  assigned_to_name: string | null
  assignment_id: string | null
}

export interface AssetAssignment {
  id: string
  asset_id: string
  assigned_to: string
  assigned_to_name: string
  checked_out_at: string
  checked_in_at: string | null
  expected_return_date: string | null
  notes: string | null
}

export interface MaintenanceLog {
  id: string
  asset_id: string
  logged_by: string
  logged_by_name: string
  note: string
  condition_after: AssetCondition
  created_at: string
}

export interface AssetDetail {
  asset: Asset
  assignments: AssetAssignment[]
  maintenanceLogs: MaintenanceLog[]
}

export interface AssetInventoryProps {
  departmentId: string
  viewMode: ViewMode
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/types.ts
git commit -m "feat(assets): add AssetInventory types"
```

---

## Task 4: Create `useAssetInventory.ts`

**Files:**

- Create: `src/components/admin/AssetInventory/useAssetInventory.ts`
- Create: `src/test/assetInventory.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/test/assetInventory.test.ts
import { describe, it, expect, vi } from 'vitest'
import { buildAssetFromRow } from '../components/admin/AssetInventory/useAssetInventory'

describe('buildAssetFromRow', () => {
  it('maps joined DB row to Asset shape', () => {
    const row = {
      id: 'a1',
      name: 'MacBook',
      category_id: 'c1',
      department_id: 'it',
      condition: 'good',
      serial_number: 'SN123',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
      asset_categories: { name: 'Laptop' },
      asset_assignments: [
        {
          id: 'aa1',
          assigned_to: 'u1',
          users: { full_name: 'Kwame Asante' },
        },
      ],
    }
    const asset = buildAssetFromRow(row)
    expect(asset.category_name).toBe('Laptop')
    expect(asset.assigned_to_name).toBe('Kwame Asante')
    expect(asset.assigned_to_id).toBe('u1')
    expect(asset.assignment_id).toBe('aa1')
  })

  it('returns null assignee when no open assignment', () => {
    const row = {
      id: 'a2',
      name: 'Projector',
      category_id: 'c2',
      department_id: 'it',
      condition: 'fair',
      serial_number: null,
      description: null,
      created_at: '2026-01-01T00:00:00Z',
      asset_categories: { name: 'AV' },
      asset_assignments: [],
    }
    const asset = buildAssetFromRow(row)
    expect(asset.assigned_to_id).toBeNull()
    expect(asset.assigned_to_name).toBeNull()
    expect(asset.assignment_id).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/assetInventory.test.ts
```

Expected: FAIL — `buildAssetFromRow` not found.

- [ ] **Step 3: Write the hook**

```ts
// src/components/admin/AssetInventory/useAssetInventory.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Asset, AssetCategory, AssetDetail, AssetCondition, ViewMode } from './types'

// ─── Pure mapper (exported for tests) ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildAssetFromRow(row: any): Asset {
  const openAssignment =
    (row.asset_assignments ?? []).find(
      (a: { checked_in_at: string | null }) => a.checked_in_at === null
    ) ?? null
  return {
    id: row.id,
    name: row.name,
    category_id: row.category_id,
    department_id: row.department_id,
    condition: row.condition,
    serial_number: row.serial_number,
    description: row.description,
    created_at: row.created_at,
    category_name: row.asset_categories?.name ?? '',
    assigned_to_id: openAssignment?.assigned_to ?? null,
    assigned_to_name: openAssignment?.users?.full_name ?? null,
    assignment_id: openAssignment?.id ?? null,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAssetInventory(departmentId: string, viewMode: ViewMode) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [filterDept, setFilterDept] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<AssetDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('assets')
      .select(
        `
        id, name, category_id, department_id, condition,
        serial_number, description, created_at,
        asset_categories ( name ),
        asset_assignments ( id, assigned_to, checked_in_at, users ( full_name ) )
      `
      )
      .order('created_at', { ascending: false })

    if (viewMode === 'department') {
      query = query.eq('department_id', departmentId)
    } else if (filterDept) {
      query = query.eq('department_id', filterDept)
    }

    const { data, error } = await query
    if (error) {
      toast.error('Failed to load assets')
      setLoading(false)
      return
    }
    setAssets((data ?? []).map(buildAssetFromRow))
    if (viewMode === 'master') {
      const depts = [
        ...new Set((data ?? []).map((r: { department_id: string }) => r.department_id)),
      ]
      setDepartments(depts)
    }
    setLoading(false)
  }, [departmentId, viewMode, filterDept])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('asset_categories')
      .select('id, name, department_id, created_at')
      .or(`department_id.eq.${departmentId},department_id.is.null`)
      .order('name')
    setCategories(data ?? [])
  }, [departmentId])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('users').select('id, full_name').order('full_name')
    setMembers(data ?? [])
  }, [])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])
  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // ── Detail panel ─────────────────────────────────────────────────────────
  const loadDetail = useCallback(async (assetId: string) => {
    setDetailLoading(true)
    const [assetRes, logsRes, assignRes] = await Promise.all([
      supabase
        .from('assets')
        .select(
          `id, name, category_id, department_id, condition, serial_number, description, created_at, asset_categories(name), asset_assignments(id, assigned_to, checked_in_at, users(full_name))`
        )
        .eq('id', assetId)
        .single(),
      supabase
        .from('asset_maintenance_logs')
        .select('id, asset_id, logged_by, note, condition_after, created_at, users(full_name)')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false }),
      supabase
        .from('asset_assignments')
        .select(
          'id, asset_id, assigned_to, checked_out_at, checked_in_at, expected_return_date, notes, users(full_name)'
        )
        .eq('asset_id', assetId)
        .order('checked_out_at', { ascending: false }),
    ])
    if (assetRes.error) {
      toast.error('Failed to load asset details')
      setDetailLoading(false)
      return
    }
    setDetail({
      asset: buildAssetFromRow(assetRes.data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maintenanceLogs: (logsRes.data ?? []).map((r: any) => ({
        id: r.id,
        asset_id: r.asset_id,
        logged_by: r.logged_by,
        logged_by_name: r.users?.full_name ?? 'Unknown',
        note: r.note,
        condition_after: r.condition_after,
        created_at: r.created_at,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments: (assignRes.data ?? []).map((r: any) => ({
        id: r.id,
        asset_id: r.asset_id,
        assigned_to: r.assigned_to,
        assigned_to_name: r.users?.full_name ?? 'Unknown',
        checked_out_at: r.checked_out_at,
        checked_in_at: r.checked_in_at,
        expected_return_date: r.expected_return_date,
        notes: r.notes,
      })),
    })
    setDetailLoading(false)
  }, [])

  const closeDetail = useCallback(() => setDetail(null), [])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addCategory = useCallback(
    async (name: string) => {
      const { error } = await supabase
        .from('asset_categories')
        .insert({ name, department_id: departmentId })
      if (error) {
        toast.error('Failed to add category')
        return false
      }
      toast.success('Category added')
      await fetchCategories()
      return true
    },
    [departmentId, fetchCategories]
  )

  const addAsset = useCallback(
    async (payload: {
      name: string
      category_id: string
      serial_number: string
      description: string
      condition: AssetCondition
    }) => {
      const { error } = await supabase
        .from('assets')
        .insert({ ...payload, department_id: departmentId })
      if (error) {
        toast.error('Failed to add asset')
        return false
      }
      toast.success('Asset added')
      await fetchAssets()
      return true
    },
    [departmentId, fetchAssets]
  )

  const updateAsset = useCallback(
    async (
      id: string,
      payload: {
        name: string
        category_id: string
        serial_number: string
        description: string
      }
    ) => {
      const { error } = await supabase.from('assets').update(payload).eq('id', id)
      if (error) {
        toast.error('Failed to update asset')
        return false
      }
      toast.success('Asset updated')
      await fetchAssets()
      if (detail?.asset.id === id) await loadDetail(id)
      return true
    },
    [fetchAssets, detail, loadDetail]
  )

  const deleteAsset = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id)
      if (error) {
        toast.error('Failed to delete asset')
        return false
      }
      toast.success('Asset deleted')
      if (detail?.asset.id === id) closeDetail()
      await fetchAssets()
      return true
    },
    [fetchAssets, detail, closeDetail]
  )

  const updateCondition = useCallback(
    async (assetId: string, condition: AssetCondition, note: string, loggedBy: string) => {
      const { error } = await supabase.rpc('update_asset_condition', {
        p_asset_id: assetId,
        p_condition: condition,
        p_note: note,
        p_logged_by: loggedBy,
      })
      if (error) {
        toast.error('Failed to update condition')
        return false
      }
      toast.success('Condition updated')
      await fetchAssets()
      await loadDetail(assetId)
      return true
    },
    [fetchAssets, loadDetail]
  )

  const checkOut = useCallback(
    async (payload: {
      asset_id: string
      assigned_to: string
      expected_return_date: string | null
      notes: string
    }) => {
      const { error } = await supabase.from('asset_assignments').insert(payload)
      if (error) {
        toast.error('Failed to check out asset')
        return false
      }
      toast.success('Asset checked out')
      await fetchAssets()
      await loadDetail(payload.asset_id)
      return true
    },
    [fetchAssets, loadDetail]
  )

  const checkIn = useCallback(
    async (assignmentId: string, assetId: string) => {
      const { error } = await supabase
        .from('asset_assignments')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .is('checked_in_at', null)
      if (error) {
        toast.error('Failed to check in asset')
        return false
      }
      toast.success('Asset checked in')
      await fetchAssets()
      await loadDetail(assetId)
      return true
    },
    [fetchAssets, loadDetail]
  )

  return {
    assets,
    categories,
    members,
    departments,
    filterDept,
    setFilterDept,
    loading,
    detail,
    detailLoading,
    loadDetail,
    closeDetail,
    addCategory,
    addAsset,
    updateAsset,
    deleteAsset,
    updateCondition,
    checkOut,
    checkIn,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/assetInventory.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AssetInventory/useAssetInventory.ts src/test/assetInventory.test.ts
git commit -m "feat(assets): add useAssetInventory hook with tests"
```

---

## Task 5: Create `AssetTable.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/AssetTable.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/AssetTable.tsx
import { useState } from 'react'
import type { Asset, AssetCondition } from './types'

const CONDITION_PILL: Record<AssetCondition, string> = {
  good: 'pill pill-ok',
  fair: 'pill pill-warn',
  damaged: 'pill pill-err',
}

const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

interface Props {
  assets: Asset[]
  loading: boolean
  canWrite: boolean
  onRowClick: (asset: Asset) => void
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export function AssetTable({ assets, loading, canWrite, onRowClick, onEdit, onDelete }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (loading) {
    return (
      <div
        style={{
          padding: '48px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        Loading assets…
      </div>
    )
  }

  if (!assets.length) {
    return (
      <div
        style={{
          padding: '48px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        No assets yet. Add one to get started.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            {['Name', 'Category', 'Condition', 'Status', 'Last Updated', ''].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.id}
              onClick={() => onRowClick(asset)}
              style={{
                borderBottom: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td
                style={{
                  padding: '10px 12px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {asset.name}
              </td>
              <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                {asset.category_name}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span className={CONDITION_PILL[asset.condition]}>
                  {CONDITION_LABEL[asset.condition]}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                {asset.assigned_to_name ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="pill pill-warn" style={{ marginRight: 4 }}>
                      Assigned
                    </span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                      {asset.assigned_to_name}
                    </span>
                  </span>
                ) : (
                  <span className="pill pill-ok">Available</span>
                )}
              </td>
              <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                {new Date(asset.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td
                style={{ padding: '10px 12px', position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                {canWrite && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => setOpenMenuId((v) => (v === asset.id ? null : asset.id))}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        more_vert
                      </span>
                    </button>
                    {openMenuId === asset.id && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 4px)',
                            zIndex: 50,
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            minWidth: 140,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            className="btn btn-ghost"
                            style={{
                              width: '100%',
                              padding: '9px 14px',
                              textAlign: 'left',
                              fontSize: 13,
                              borderRadius: 0,
                            }}
                            onClick={() => {
                              setOpenMenuId(null)
                              onEdit(asset)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{
                              width: '100%',
                              padding: '9px 14px',
                              textAlign: 'left',
                              fontSize: 13,
                              borderRadius: 0,
                              color: 'hsl(var(--destructive))',
                            }}
                            onClick={() => {
                              setOpenMenuId(null)
                              onDelete(asset)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/AssetTable.tsx
git commit -m "feat(assets): add AssetTable component"
```

---

## Task 6: Create `AddCategoryModal.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/AddCategoryModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/AddCategoryModal.tsx
import { useState } from 'react'

interface Props {
  onClose: () => void
  onSubmit: (name: string) => Promise<boolean>
}

export function AddCategoryModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const ok = await onSubmit(name.trim())
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: '0 0 20px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 16,
            color: 'hsl(var(--on-surface))',
          }}
        >
          Add Category
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Category Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptop, AV Equipment"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                background: 'hsl(var(--background))',
                color: 'hsl(var(--on-surface))',
              }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Saving…' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/AddCategoryModal.tsx
git commit -m "feat(assets): add AddCategoryModal"
```

---

## Task 7: Create `AddAssetModal.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/AddAssetModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/AddAssetModal.tsx
import { useState } from 'react'
import type { AssetCategory, AssetCondition, Asset } from './types'

interface Props {
  categories: AssetCategory[]
  editAsset?: Asset | null
  onClose: () => void
  onSubmit: (payload: {
    name: string
    category_id: string
    serial_number: string
    description: string
    condition: AssetCondition
  }) => Promise<boolean>
  onUpdate?: (
    id: string,
    payload: { name: string; category_id: string; serial_number: string; description: string }
  ) => Promise<boolean>
}

export function AddAssetModal({ categories, editAsset, onClose, onSubmit, onUpdate }: Props) {
  const [name, setName] = useState(editAsset?.name ?? '')
  const [categoryId, setCategoryId] = useState(editAsset?.category_id ?? categories[0]?.id ?? '')
  const [serialNumber, setSerialNumber] = useState(editAsset?.serial_number ?? '')
  const [description, setDescription] = useState(editAsset?.description ?? '')
  const [condition, setCondition] = useState<AssetCondition>(editAsset?.condition ?? 'good')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !categoryId) return
    setSaving(true)
    let ok: boolean
    if (editAsset && onUpdate) {
      ok = await onUpdate(editAsset.id, {
        name: name.trim(),
        category_id: categoryId,
        serial_number: serialNumber.trim(),
        description: description.trim(),
      })
    } else {
      ok = await onSubmit({
        name: name.trim(),
        category_id: categoryId,
        serial_number: serialNumber.trim(),
        description: description.trim(),
        condition,
      })
    }
    setSaving(false)
    if (ok) onClose()
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontFamily: "'Public Sans', sans-serif",
    background: 'hsl(var(--background))',
    color: 'hsl(var(--on-surface))',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: '0 0 20px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 16,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {editAsset ? 'Edit Asset' : 'Add Asset'}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro 14"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Serial Number</label>
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>
            {!editAsset && (
              <div>
                <label style={labelStyle}>Initial Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  style={inputStyle}
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !name.trim() || !categoryId}
            >
              {saving ? 'Saving…' : editAsset ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/AddAssetModal.tsx
git commit -m "feat(assets): add AddAssetModal (create + edit)"
```

---

## Task 8: Create `ConditionUpdateForm.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/ConditionUpdateForm.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/ConditionUpdateForm.tsx
import { useState } from 'react'
import type { AssetCondition } from './types'

interface Props {
  currentCondition: AssetCondition
  onUpdate: (condition: AssetCondition, note: string) => Promise<boolean>
}

export function ConditionUpdateForm({ currentCondition, onUpdate }: Props) {
  const [condition, setCondition] = useState<AssetCondition>(currentCondition)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    const ok = await onUpdate(condition, note.trim())
    setSaving(false)
    if (ok) setNote('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontFamily: "'Public Sans', sans-serif",
    background: 'hsl(var(--background))',
    color: 'hsl(var(--on-surface))',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 5,
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        background: 'hsl(var(--container-low))',
        borderRadius: 'var(--radius-md)',
        marginTop: 16,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        Update Condition
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>New Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as AssetCondition)}
            style={inputStyle}
          >
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Note (required)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Screen repaired, charging port replaced"
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !note.trim()}>
          {saving ? 'Saving…' : 'Update Condition'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/ConditionUpdateForm.tsx
git commit -m "feat(assets): add ConditionUpdateForm"
```

---

## Task 9: Create `MaintenanceTimeline.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/MaintenanceTimeline.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/MaintenanceTimeline.tsx
import type { MaintenanceLog, AssetCondition } from './types'

const CONDITION_PILL: Record<AssetCondition, string> = {
  good: 'pill pill-ok',
  fair: 'pill pill-warn',
  damaged: 'pill pill-err',
}
const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

interface Props {
  logs: MaintenanceLog[]
}

export function MaintenanceTimeline({ logs }: Props) {
  if (!logs.length) {
    return (
      <div
        style={{
          padding: '32px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        No maintenance records yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {logs.map((log, i) => (
        <div
          key={log.id}
          style={{ display: 'flex', gap: 14, paddingBottom: i < logs.length - 1 ? 20 : 0 }}
        >
          {/* timeline track */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            {i < logs.length - 1 && (
              <div style={{ width: 1, flex: 1, background: 'hsl(var(--border))', marginTop: 4 }} />
            )}
          </div>
          {/* entry */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                {new Date(log.created_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className={CONDITION_PILL[log.condition_after]}>
                {CONDITION_LABEL[log.condition_after]}
              </span>
            </div>
            <p style={{ margin: '0 0 3px', fontSize: 13, color: 'hsl(var(--on-surface))' }}>
              {log.note}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              Logged by {log.logged_by_name}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/MaintenanceTimeline.tsx
git commit -m "feat(assets): add MaintenanceTimeline"
```

---

## Task 10: Create `CheckOutModal.tsx` (Phase C)

**Files:**

- Create: `src/components/admin/AssetInventory/CheckOutModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/CheckOutModal.tsx
import { useState, useMemo } from 'react'

interface Props {
  assetId: string
  assetName: string
  members: { id: string; full_name: string }[]
  onClose: () => void
  onSubmit: (payload: {
    asset_id: string
    assigned_to: string
    expected_return_date: string | null
    notes: string
  }) => Promise<boolean>
}

export function CheckOutModal({ assetId, assetName, members, onClose, onSubmit }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = useMemo(
    () =>
      members.filter((m) => m.full_name.toLowerCase().includes(search.toLowerCase())).slice(0, 20),
    [members, search]
  )

  const selectedName = members.find((m) => m.id === selectedId)?.full_name ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    const ok = await onSubmit({
      asset_id: assetId,
      assigned_to: selectedId,
      expected_return_date: returnDate || null,
      notes: notes.trim(),
    })
    setSaving(false)
    if (ok) onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontFamily: "'Public Sans', sans-serif",
    background: 'hsl(var(--background))',
    color: 'hsl(var(--on-surface))',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 6,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 16,
            color: 'hsl(var(--on-surface))',
          }}
        >
          Check Out Asset
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          {assetName}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Searchable member picker */}
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Assign To</label>
            <input
              value={selectedId ? selectedName : search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedId('')
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search members…"
              style={inputStyle}
              autoComplete="off"
            />
            {showDropdown && filtered.length > 0 && !selectedId && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setShowDropdown(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: 200,
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {filtered.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '9px 14px',
                        textAlign: 'left',
                        fontSize: 13,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface))',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'hsl(var(--container-low))')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      onClick={() => {
                        setSelectedId(m.id)
                        setSearch('')
                        setShowDropdown(false)
                      }}
                    >
                      {m.full_name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Expected Return Date{' '}
              <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Notes <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !selectedId}
            >
              {saving ? 'Checking out…' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/CheckOutModal.tsx
git commit -m "feat(assets): add CheckOutModal with searchable member picker"
```

---

## Task 11: Create `CheckInModal.tsx` (Phase C)

**Files:**

- Create: `src/components/admin/AssetInventory/CheckInModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/CheckInModal.tsx
import { useState } from 'react'
import type { AssetCondition } from './types'

interface Props {
  assignmentId: string
  assetId: string
  assetName: string
  assigneeName: string
  currentCondition: AssetCondition
  onClose: () => void
  onCheckIn: (assignmentId: string, assetId: string) => Promise<boolean>
  onUpdateCondition: (condition: AssetCondition, note: string) => Promise<boolean>
}

const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

export function CheckInModal({
  assignmentId,
  assetId,
  assetName,
  assigneeName,
  currentCondition,
  onClose,
  onCheckIn,
  onUpdateCondition,
}: Props) {
  const [step, setStep] = useState<'confirm' | 'condition'>('confirm')
  const [condition, setCondition] = useState<AssetCondition>(currentCondition)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCheckIn() {
    setSaving(true)
    const ok = await onCheckIn(assignmentId, assetId)
    setSaving(false)
    if (ok) setStep('condition')
  }

  async function handleConditionUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) {
      onClose()
      return
    }
    setSaving(true)
    await onUpdateCondition(condition, note.trim())
    setSaving(false)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontFamily: "'Public Sans', sans-serif",
    background: 'hsl(var(--background))',
    color: 'hsl(var(--on-surface))',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 6,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={step === 'confirm' ? onClose : undefined}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'confirm' ? (
          <>
            <p
              style={{
                margin: '0 0 8px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Check In Asset
            </p>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.5,
              }}
            >
              Confirm that{' '}
              <strong style={{ color: 'hsl(var(--on-surface))' }}>{assigneeName}</strong> is
              returning <strong style={{ color: 'hsl(var(--on-surface))' }}>{assetName}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleCheckIn}>
                {saving ? 'Processing…' : 'Confirm Check In'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                margin: '0 0 4px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Update Asset Condition
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Asset checked in. How is {assetName} now?
            </p>
            <form
              onSubmit={handleConditionUpdate}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={labelStyle}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  style={inputStyle}
                >
                  {(['good', 'fair', 'damaged'] as AssetCondition[]).map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  Note{' '}
                  <span style={{ textTransform: 'none', letterSpacing: 0 }}>
                    (leave blank to skip)
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any damage, wear, or repairs noted?"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
                  Skip
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving…' : 'Save & Close'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/CheckInModal.tsx
git commit -m "feat(assets): add CheckInModal with two-step confirm + condition update"
```

---

## Task 12: Create `CheckoutHistory.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/CheckoutHistory.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/CheckoutHistory.tsx
import { useState } from 'react'
import type { AssetAssignment, Asset } from './types'
import { CheckOutModal } from './CheckOutModal'
import { CheckInModal } from './CheckInModal'

interface Props {
  asset: Asset
  assignments: AssetAssignment[]
  members: { id: string; full_name: string }[]
  canWrite: boolean
  onCheckOut: (payload: {
    asset_id: string
    assigned_to: string
    expected_return_date: string | null
    notes: string
  }) => Promise<boolean>
  onCheckIn: (assignmentId: string, assetId: string) => Promise<boolean>
  onUpdateCondition: (condition: import('./types').AssetCondition, note: string) => Promise<boolean>
}

export function CheckoutHistory({
  asset,
  assignments,
  members,
  canWrite,
  onCheckOut,
  onCheckIn,
  onUpdateCondition,
}: Props) {
  const [showCheckOut, setShowCheckOut] = useState(false)
  const [checkingIn, setCheckingIn] = useState<AssetAssignment | null>(null)

  const openAssignment = assignments.find((a) => a.checked_in_at === null) ?? null

  return (
    <div>
      {canWrite && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          {openAssignment ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCheckingIn(openAssignment)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                login
              </span>
              Check In
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCheckOut(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                logout
              </span>
              Check Out
            </button>
          )}
        </div>
      )}

      {!assignments.length ? (
        <div
          style={{
            padding: '32px 0',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          No assignment history yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Assignee', 'Checked Out', 'Expected Return', 'Checked In'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '9px 10px', color: 'hsl(var(--on-surface))' }}>
                    {a.assigned_to_name}
                  </td>
                  <td style={{ padding: '9px 10px', color: 'hsl(var(--on-surface-muted))' }}>
                    {new Date(a.checked_out_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '9px 10px', color: 'hsl(var(--on-surface-muted))' }}>
                    {a.expected_return_date
                      ? new Date(a.expected_return_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    {a.checked_in_at ? (
                      new Date(a.checked_in_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    ) : (
                      <span className="pill pill-warn">Currently out</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCheckOut && (
        <CheckOutModal
          assetId={asset.id}
          assetName={asset.name}
          members={members}
          onClose={() => setShowCheckOut(false)}
          onSubmit={onCheckOut}
        />
      )}

      {checkingIn && (
        <CheckInModal
          assignmentId={checkingIn.id}
          assetId={asset.id}
          assetName={asset.name}
          assigneeName={checkingIn.assigned_to_name}
          currentCondition={asset.condition}
          onClose={() => setCheckingIn(null)}
          onCheckIn={onCheckIn}
          onUpdateCondition={onUpdateCondition}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/CheckoutHistory.tsx
git commit -m "feat(assets): add CheckoutHistory with check-in/check-out flow"
```

---

## Task 13: Create `AssetDetailPanel.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/AssetDetailPanel.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/AssetDetailPanel.tsx
import { useState } from 'react'
import type { AssetDetail, AssetCondition } from './types'
import { MaintenanceTimeline } from './MaintenanceTimeline'
import { CheckoutHistory } from './CheckoutHistory'
import { ConditionUpdateForm } from './ConditionUpdateForm'

const CONDITION_PILL: Record<AssetCondition, string> = {
  good: 'pill pill-ok',
  fair: 'pill pill-warn',
  damaged: 'pill pill-err',
}
const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

type Tab = 'overview' | 'maintenance' | 'checkout'

interface Props {
  detail: AssetDetail
  loading: boolean
  canWrite: boolean
  members: { id: string; full_name: string }[]
  onClose: () => void
  onUpdateCondition: (condition: AssetCondition, note: string) => Promise<boolean>
  onCheckOut: (payload: {
    asset_id: string
    assigned_to: string
    expected_return_date: string | null
    notes: string
  }) => Promise<boolean>
  onCheckIn: (assignmentId: string, assetId: string) => Promise<boolean>
}

export function AssetDetailPanel({
  detail,
  loading,
  canWrite,
  members,
  onClose,
  onUpdateCondition,
  onCheckOut,
  onCheckIn,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { asset, maintenanceLogs, assignments } = detail

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'maintenance', label: `Maintenance (${maintenanceLogs.length})` },
    { id: 'checkout', label: `Check-in/out (${assignments.length})` },
  ]

  function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div>
        <p
          style={{
            margin: '0 0 3px',
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{value || '—'}</p>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 80 }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 480,
          background: 'hsl(var(--background))',
          zIndex: 81,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 4px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {asset.name}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              {asset.category_name}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0, marginTop: 2 }}
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: '0 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 0,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'btn-active-tab' : 'btn-inactive-tab'}
              style={{
                padding: '10px 14px',
                fontSize: 12,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
              }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px 20px 32px', overflowY: 'auto' }}>
          {loading ? (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          ) : tab === 'overview' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field
                  label="Condition"
                  value={
                    <span className={CONDITION_PILL[asset.condition]}>
                      {CONDITION_LABEL[asset.condition]}
                    </span>
                  }
                />
                <Field
                  label="Status"
                  value={
                    asset.assigned_to_name ? (
                      <>
                        <span className="pill pill-warn" style={{ marginRight: 6 }}>
                          Assigned
                        </span>
                        <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                          {asset.assigned_to_name}
                        </span>
                      </>
                    ) : (
                      <span className="pill pill-ok">Available</span>
                    )
                  }
                />
                <Field label="Department" value={asset.department_id} />
                <Field label="Serial Number" value={asset.serial_number} />
              </div>
              <Field label="Description" value={asset.description} />
              <Field
                label="Added"
                value={new Date(asset.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              {canWrite && (
                <ConditionUpdateForm
                  currentCondition={asset.condition}
                  onUpdate={onUpdateCondition}
                />
              )}
            </div>
          ) : tab === 'maintenance' ? (
            <MaintenanceTimeline logs={maintenanceLogs} />
          ) : (
            <CheckoutHistory
              asset={asset}
              assignments={assignments}
              members={members}
              canWrite={canWrite}
              onCheckOut={onCheckOut}
              onCheckIn={onCheckIn}
              onUpdateCondition={onUpdateCondition}
            />
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/AssetDetailPanel.tsx
git commit -m "feat(assets): add AssetDetailPanel with Overview/Maintenance/Checkout tabs"
```

---

## Task 14: Create `index.tsx` (entry point)

**Files:**

- Create: `src/components/admin/AssetInventory/index.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/index.tsx
import { useState } from 'react'
import { adminService } from '@/services/adminService'
import type { AdminRole } from '@/types/admin'
import { useAssetInventory } from './useAssetInventory'
import { AssetTable } from './AssetTable'
import { AssetDetailPanel } from './AssetDetailPanel'
import { AddCategoryModal } from './AddCategoryModal'
import { AddAssetModal } from './AddAssetModal'
import type { Asset, AssetInventoryProps, AssetCondition } from './types'

const MASTER_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']
const WRITE_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']

export function AssetInventory({ departmentId, viewMode }: AssetInventoryProps) {
  const currentUser = adminService.getCurrentUser()
  const userRole = currentUser?.role as AdminRole | undefined

  if (viewMode === 'master' && (!userRole || !MASTER_ROLES.includes(userRole))) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 32,
            display: 'block',
            marginBottom: 8,
            color: 'hsl(var(--destructive))',
          }}
        >
          lock
        </span>
        Master view is restricted to IT Managers and Super Admins.
      </div>
    )
  }

  const canWrite = !!userRole && WRITE_ROLES.includes(userRole)

  const {
    assets,
    categories,
    members,
    departments,
    filterDept,
    setFilterDept,
    loading,
    detail,
    detailLoading,
    loadDetail,
    closeDetail,
    addCategory,
    addAsset,
    updateAsset,
    deleteAsset,
    updateCondition,
    checkOut,
    checkIn,
  } = useAssetInventory(departmentId, viewMode)

  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)

  async function handleUpdateCondition(condition: AssetCondition, note: string) {
    if (!detail || !currentUser) return false
    return updateCondition(detail.asset.id, condition, note, currentUser.id)
  }

  return (
    <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {viewMode === 'master' && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              background: 'hsl(var(--background))',
              color: 'hsl(var(--on-surface))',
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {canWrite && viewMode === 'department' && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowAddCategory(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                category
              </span>
              Add Category
            </button>
          )}
          {canWrite && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddAsset(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <AssetTable
          assets={assets}
          loading={loading}
          canWrite={canWrite}
          onRowClick={(a) => loadDetail(a.id)}
          onEdit={(a) => setEditAsset(a)}
          onDelete={(a) => {
            if (confirm(`Delete "${a.name}"? This cannot be undone.`)) deleteAsset(a.id)
          }}
        />
      </div>

      {/* Detail panel */}
      {detail && (
        <AssetDetailPanel
          detail={detail}
          loading={detailLoading}
          canWrite={canWrite}
          members={members}
          onClose={closeDetail}
          onUpdateCondition={handleUpdateCondition}
          onCheckOut={checkOut}
          onCheckIn={checkIn}
        />
      )}

      {/* Modals */}
      {showAddCategory && (
        <AddCategoryModal onClose={() => setShowAddCategory(false)} onSubmit={addCategory} />
      )}
      {(showAddAsset || editAsset) && (
        <AddAssetModal
          categories={categories}
          editAsset={editAsset}
          onClose={() => {
            setShowAddAsset(false)
            setEditAsset(null)
          }}
          onSubmit={addAsset}
          onUpdate={updateAsset}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/index.tsx
git commit -m "feat(assets): add AssetInventory entry point with role gate + toolbar"
```

---

## Task 15: Create page + wire route and nav

**Files:**

- Create: `src/pages/admin/it/ITAssets.tsx`
- Modify: `src/pages/admin/it/ITDepartmentLayout.tsx` (add nav item)
- Modify: `src/routes.tsx` (add route)

- [ ] **Step 1: Create `ITAssets.tsx`**

```tsx
// src/pages/admin/it/ITAssets.tsx
import { AssetInventory } from '@/components/admin/AssetInventory'
import { useITLayout } from './ITLayoutContext'

const DEPT_ID = 'it'

export default function ITAssets() {
  useITLayout('Asset Inventory', 'inventory_2', 'Track, assign, and maintain IT department assets')

  return (
    <div>
      <AssetInventory departmentId={DEPT_ID} viewMode="department" />
    </div>
  )
}
```

- [ ] **Step 2: Add nav item to `ITDepartmentLayout.tsx`**

Find the `IT_NAV` array and add the assets entry after `'licenses'`:

```ts
const IT_NAV: { to: string; icon: string; label: string }[] = [
  { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
  { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
  { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
  { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
  { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
  { to: '/admin/it-department/security-protocols', icon: 'security', label: 'Security Protocols' },
  { to: '/admin/it-department/system', icon: 'shield', label: 'System' },
  { to: '/admin/it-department/licenses', icon: 'license', label: 'Licenses' },
  { to: '/admin/it-department/assets', icon: 'inventory_2', label: 'Assets' },
  { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
]
```

- [ ] **Step 3: Add route in `src/routes.tsx`**

Find the lazy imports block and add:

```ts
const ITAssets = lazy(() => import('./pages/admin/it/ITAssets'))
```

Then find the existing IT routes (look for `ITDashboard`, `ITLicenses` etc.) and add alongside them:

```tsx
{ path: '/admin/it-department/assets', element: <ITAssets /> },
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/it/ITAssets.tsx src/pages/admin/it/ITDepartmentLayout.tsx src/routes.tsx
git commit -m "feat(assets): wire ITAssets page, route, and nav item"
```

---

## Task 16: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to `/admin/it-department/assets`**

Expected:

- "Assets" nav item appears in IT sidebar
- Asset table renders (empty state: "No assets yet. Add one to get started.")
- "Add Category" and "Add Asset" buttons visible for IT_MANAGER / SUPER_ADMIN

- [ ] **Step 3: Add a category**

Click "Add Category" → enter "Laptop" → submit.
Expected: toast "Category added", modal closes.

- [ ] **Step 4: Add an asset**

Click "Add Asset" → fill Name: "Test MacBook", Category: "Laptop", Condition: Good → submit.
Expected: toast "Asset added", row appears in table with green "Good" pill and "Available" status.

- [ ] **Step 5: Open detail panel**

Click the row.
Expected: slide-out panel opens with Overview tab. Condition Update form visible.

- [ ] **Step 6: Check out the asset**

Switch to "Check-in/out" tab → click "Check Out" → search for a member → set return date → submit.
Expected: toast "Asset checked out", table row shows "Assigned" pill with member name, "Check In" button now shows in panel.

- [ ] **Step 7: Check in the asset**

Click "Check In" → confirm → update condition with a note → save.
Expected: toast "Asset checked in", table row returns to "Available", maintenance log updated.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat(assets): complete Asset Inventory with check-in/check-out flow"
```
