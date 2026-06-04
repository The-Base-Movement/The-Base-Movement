# Asset Inventory Phases E–H Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `<AssetInventory>` component with request/approval flow (E), overdue alerts (F), QR code generation and print labels (G), and CSV/PDF export with depreciation tracking (H).

**Architecture:** All new features are additive — new sub-components + hook extensions on the existing `useAssetInventory` hook. No existing files are rewritten from scratch. DB schema is already applied (migration `extend_asset_inventory_schema_phases_efgh`). The `qrcode` and `jspdf` npm packages must be installed before Phase G and H respectively.

**Tech Stack:** React 18, TypeScript, Supabase JS v2, `qrcode` (QR generation), `jspdf` + `jspdf-autotable` (PDF export), Recharts (depreciation chart — already in project), design system CSS classes, Sonner toasts.

---

## File Map

| Action | Path                                                        | Responsibility                                            |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------- |
| Modify | `src/components/admin/AssetInventory/types.ts`              | Add `AssetRequest`, `AssetAlert`, extended `Asset` fields |
| Modify | `src/components/admin/AssetInventory/useAssetInventory.ts`  | Add request/alert/export/QR hooks                         |
| Create | `src/components/admin/AssetInventory/RequestAssetModal.tsx` | Asset picker + reason + return date                       |
| Create | `src/components/admin/AssetInventory/RequestsQueue.tsx`     | Pending requests table with Approve/Deny                  |
| Create | `src/components/admin/AssetInventory/AlertBadge.tsx`        | Inline ⚠ icon for overdue/missing rows                    |
| Create | `src/components/admin/AssetInventory/AlertsPanel.tsx`       | Alert list in detail panel                                |
| Create | `src/components/admin/AssetInventory/PrintLabelView.tsx`    | Print-optimised label window                              |
| Create | `src/components/admin/AssetInventory/ExportMenu.tsx`        | CSV + PDF export dropdown                                 |
| Create | `src/components/admin/AssetInventory/DepreciationChart.tsx` | Recharts line chart                                       |
| Create | `src/components/admin/AssetInventory/ValueSummary.tsx`      | Master-view fleet value KPI tiles                         |
| Modify | `src/components/admin/AssetInventory/index.tsx`             | Wire new tabs, toolbar buttons, value summary             |
| Modify | `src/components/admin/AssetInventory/AssetTable.tsx`        | Add alert badge to rows                                   |
| Modify | `src/components/admin/AssetInventory/AssetDetailPanel.tsx`  | Add alerts section + QR + depreciation                    |
| Modify | `src/components/admin/AssetInventory/AddAssetModal.tsx`     | Add purchase_price, purchase_date fields                  |
| Modify | `src/pages/admin/it/ITDashboard.tsx`                        | Add Asset Alerts KPI tile                                 |

---

## Task 1: Extend types + install packages

**Files:**

- Modify: `src/components/admin/AssetInventory/types.ts`
- Shell

- [ ] **Step 1: Install QR and PDF packages**

```bash
npm install qrcode jspdf jspdf-autotable
npm install --save-dev @types/qrcode @types/jspdf
```

Expected: packages appear in `package.json`.

- [ ] **Step 2: Extend `types.ts`**

Add to the end of the existing file:

```ts
export interface AssetRequest {
  id: string
  asset_id: string
  asset_name: string
  requested_by: string
  requester_name: string
  department_id: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  reviewed_by: string | null
  review_note: string | null
  expected_return_date: string | null
  created_at: string
}

export interface AssetAlert {
  id: string
  asset_id: string
  assignment_id: string | null
  alert_type: 'overdue' | 'damaged' | 'missing'
  resolved: boolean
  created_at: string
}
```

Also extend the `Asset` interface by adding these fields after `assignment_id`:

```ts
// Phase A extension
purchase_price: number | null
purchase_date: string | null
asset_tag: string | null
qr_code_url: string | null
```

And extend `AssetCategory`:

```ts
lifespan_years: number
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: errors only about new fields not yet used — ignore until the hook is updated.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AssetInventory/types.ts package.json package-lock.json
git commit -m "feat(assets): extend types for phases E–H, install qrcode + jspdf"
```

---

## Task 2: Extend `useAssetInventory.ts`

**Files:**

- Modify: `src/components/admin/AssetInventory/useAssetInventory.ts`

- [ ] **Step 1: Update `buildAssetFromRow` to include new asset fields**

Find `buildAssetFromRow` and extend the returned object:

```ts
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
    purchase_price: row.purchase_price ?? null,
    purchase_date: row.purchase_date ?? null,
    asset_tag: row.asset_tag ?? null,
    qr_code_url: row.qr_code_url ?? null,
  }
}
```

- [ ] **Step 2: Add new state + fetch calls inside `useAssetInventory`**

Add after the existing `useState` declarations:

```ts
const [pendingRequests, setPendingRequests] = useState<AssetRequest[]>([])
const [alerts, setAlerts] = useState<AssetAlert[]>([])
```

Add import at top:

```ts
import type {
  Asset,
  AssetCategory,
  AssetDetail,
  AssetCondition,
  ViewMode,
  AssetRequest,
  AssetAlert,
} from './types'
```

- [ ] **Step 3: Update `fetchAssets` select string to include new columns**

Find the `.select(...)` call in `fetchAssets` and replace the select string with:

```ts
;`id, name, category_id, department_id, condition,
 serial_number, description, created_at,
 purchase_price, purchase_date, asset_tag, qr_code_url,
 asset_categories ( name, lifespan_years ),
 asset_assignments ( id, assigned_to, checked_in_at, users ( full_name ) )`
```

Also update `category_name` in `buildAssetFromRow` to carry through `lifespan_years` — add to `AssetCategory` fetch:

Find `fetchCategories` select string and replace:

```ts
'id, name, department_id, created_at, lifespan_years'
```

- [ ] **Step 4: Add `fetchRequests` and `fetchAlerts` callbacks**

Add after `fetchMembers`:

```ts
const fetchRequests = useCallback(async () => {
  const { data } = await supabase
    .from('asset_requests')
    .select(
      'id, asset_id, requested_by, department_id, reason, status, reviewed_by, review_note, expected_return_date, created_at, assets(name), users!asset_requests_requested_by_fkey(full_name)'
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  setPendingRequests(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data ?? []).map((r: any) => ({
      id: r.id,
      asset_id: r.asset_id,
      asset_name: r.assets?.name ?? '',
      requested_by: r.requested_by,
      requester_name: r.users?.full_name ?? 'Unknown',
      department_id: r.department_id,
      reason: r.reason,
      status: r.status,
      reviewed_by: r.reviewed_by,
      review_note: r.review_note,
      expected_return_date: r.expected_return_date,
      created_at: r.created_at,
    }))
  )
}, [])

const fetchAlerts = useCallback(async () => {
  const { data } = await supabase
    .from('asset_alerts')
    .select('id, asset_id, assignment_id, alert_type, resolved, created_at')
    .eq('resolved', false)
  setAlerts(data ?? [])
}, [])
```

- [ ] **Step 5: Add effects for new fetches**

After the existing three `useEffect` blocks:

```ts
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchRequests()
}, [fetchRequests])
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchAlerts()
}, [fetchAlerts])
```

- [ ] **Step 6: Add mutations for requests, alerts, and QR**

Add before the `return` statement:

```ts
const submitRequest = useCallback(
  async (payload: {
    asset_id: string
    department_id: string
    reason: string
    expected_return_date: string | null
    requested_by: string
  }) => {
    const { error } = await supabase.from('asset_requests').insert(payload)
    if (error) {
      toast.error('Failed to submit request')
      return false
    }
    toast.success('Request submitted')
    await fetchRequests()
    return true
  },
  [fetchRequests]
)

const approveRequest = useCallback(
  async (
    requestId: string,
    assetId: string,
    assignTo: string,
    returnDate: string | null,
    reviewNote: string,
    reviewedBy: string
  ) => {
    const { error: reqErr } = await supabase
      .from('asset_requests')
      .update({ status: 'approved', reviewed_by: reviewedBy, review_note: reviewNote })
      .eq('id', requestId)
    if (reqErr) {
      toast.error('Failed to approve request')
      return false
    }
    const { error: assignErr } = await supabase.from('asset_assignments').insert({
      asset_id: assetId,
      assigned_to: assignTo,
      expected_return_date: returnDate,
      notes: reviewNote,
    })
    if (assignErr) {
      toast.error('Assignment failed after approval')
      return false
    }
    toast.success('Request approved — asset checked out')
    await fetchRequests()
    await fetchAssets()
    return true
  },
  [fetchRequests, fetchAssets]
)

const denyRequest = useCallback(
  async (requestId: string, reviewNote: string, reviewedBy: string) => {
    const { error } = await supabase
      .from('asset_requests')
      .update({ status: 'denied', reviewed_by: reviewedBy, review_note: reviewNote })
      .eq('id', requestId)
    if (error) {
      toast.error('Failed to deny request')
      return false
    }
    toast.success('Request denied')
    await fetchRequests()
    return true
  },
  [fetchRequests]
)

const resolveAlert = useCallback(
  async (alertId: string) => {
    const { error } = await supabase
      .from('asset_alerts')
      .update({ resolved: true })
      .eq('id', alertId)
    if (error) {
      toast.error('Failed to resolve alert')
      return false
    }
    toast.success('Alert resolved')
    await fetchAlerts()
    return true
  },
  [fetchAlerts]
)

const escalateToMissing = useCallback(
  async (assetId: string, assignmentId: string | null) => {
    const { error } = await supabase.from('asset_alerts').insert({
      asset_id: assetId,
      assignment_id: assignmentId,
      alert_type: 'missing',
    })
    if (error) {
      toast.error('Failed to escalate')
      return false
    }
    toast.success('Escalated to missing')
    await fetchAlerts()
    return true
  },
  [fetchAlerts]
)

const saveQrCodeUrl = useCallback(async (assetId: string, url: string) => {
  await supabase.from('assets').update({ qr_code_url: url }).eq('id', assetId)
}, [])
```

- [ ] **Step 7: Extend the return object**

Add to the hook's return:

```ts
pendingRequests, alerts,
fetchRequests, fetchAlerts,
submitRequest, approveRequest, denyRequest,
resolveAlert, escalateToMissing,
saveQrCodeUrl,
```

- [ ] **Step 8: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/AssetInventory/useAssetInventory.ts
git commit -m "feat(assets): extend hook with requests, alerts, QR, and export support"
```

---

## Task 3: Create `RequestAssetModal.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/RequestAssetModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/RequestAssetModal.tsx
import { useState, useMemo } from 'react'
import type { Asset } from './types'

interface Props {
  assets: Asset[]
  departmentId: string
  requestedBy: string
  onClose: () => void
  onSubmit: (payload: {
    asset_id: string
    department_id: string
    reason: string
    expected_return_date: string | null
    requested_by: string
  }) => Promise<boolean>
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

export function RequestAssetModal({ assets, departmentId, requestedBy, onClose, onSubmit }: Props) {
  const [search, setSearch] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [reason, setReason] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [saving, setSaving] = useState(false)

  const availableAssets = useMemo(() => assets.filter((a) => !a.assigned_to_id), [assets])

  const filtered = useMemo(
    () =>
      availableAssets
        .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 20),
    [availableAssets, search]
  )

  const selectedName = assets.find((a) => a.id === selectedAssetId)?.name ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAssetId || !reason.trim()) return
    setSaving(true)
    const ok = await onSubmit({
      asset_id: selectedAssetId,
      department_id: departmentId,
      reason: reason.trim(),
      expected_return_date: returnDate || null,
      requested_by: requestedBy,
    })
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
          Request Asset
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Your request will be reviewed by the IT Manager.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Asset</label>
            <input
              value={selectedAssetId ? selectedName : search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedAssetId('')
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search available assets…"
              style={inputStyle}
              autoComplete="off"
            />
            {showDropdown && filtered.length > 0 && !selectedAssetId && (
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
                  {filtered.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
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
                        setSelectedAssetId(a.id)
                        setSearch('')
                        setShowDropdown(false)
                      }}
                    >
                      <span>{a.name}</span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {a.category_name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label style={labelStyle}>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need this asset?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !selectedAssetId || !reason.trim()}
            >
              {saving ? 'Submitting…' : 'Submit Request'}
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
git add src/components/admin/AssetInventory/RequestAssetModal.tsx
git commit -m "feat(assets): add RequestAssetModal"
```

---

## Task 4: Create `RequestsQueue.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/RequestsQueue.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/RequestsQueue.tsx
import { useState } from 'react'
import type { AssetRequest } from './types'

interface Props {
  requests: AssetRequest[]
  reviewerId: string
  onApprove: (
    requestId: string,
    assetId: string,
    assignTo: string,
    returnDate: string | null,
    note: string,
    reviewerId: string
  ) => Promise<boolean>
  onDeny: (requestId: string, note: string, reviewerId: string) => Promise<boolean>
}

export function RequestsQueue({ requests, reviewerId, onApprove, onDeny }: Props) {
  const [actionId, setActionId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'approve' | 'deny' | null>(null)

  function openAction(id: string, m: 'approve' | 'deny') {
    setActionId(id)
    setMode(m)
    setNote('')
  }

  async function handleConfirm() {
    if (!actionId || !mode) return
    const req = requests.find((r) => r.id === actionId)
    if (!req) return
    setSaving(true)
    if (mode === 'approve') {
      await onApprove(
        req.id,
        req.asset_id,
        req.requested_by,
        req.expected_return_date,
        note,
        reviewerId
      )
    } else {
      await onDeny(req.id, note, reviewerId)
    }
    setSaving(false)
    setActionId(null)
    setMode(null)
  }

  if (!requests.length) {
    return (
      <div
        style={{
          padding: '32px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        No pending requests.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {requests.map((req) => (
        <div
          key={req.id}
          className="panel"
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: '0 0 2px',
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {req.asset_name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                Requested by <strong>{req.requester_name}</strong> ·{' '}
                {new Date(req.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            {actionId !== req.id && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => openAction(req.id, 'approve')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-outline-dest btn-sm"
                  onClick={() => openAction(req.id, 'deny')}
                >
                  Deny
                </button>
              </div>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontStyle: 'italic',
            }}
          >
            "{req.reason}"
          </p>
          {req.expected_return_date && (
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              Return by:{' '}
              {new Date(req.expected_return_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
          {actionId === req.id && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid hsl(var(--border))',
              }}
            >
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  mode === 'approve'
                    ? 'Optional note to requester…'
                    : 'Reason for denial (recommended)…'
                }
                rows={2}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setActionId(null)
                    setMode(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  className={mode === 'approve' ? 'btn btn-primary btn-sm' : 'btn btn-dest btn-sm'}
                  disabled={saving}
                  onClick={handleConfirm}
                >
                  {saving ? 'Saving…' : mode === 'approve' ? 'Confirm Approve' : 'Confirm Deny'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/RequestsQueue.tsx
git commit -m "feat(assets): add RequestsQueue with approve/deny flow"
```

---

## Task 5: Create `AlertBadge.tsx` and `AlertsPanel.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/AlertBadge.tsx`
- Create: `src/components/admin/AssetInventory/AlertsPanel.tsx`

- [ ] **Step 1: Write `AlertBadge.tsx`**

```tsx
// src/components/admin/AssetInventory/AlertBadge.tsx
interface Props {
  type: 'overdue' | 'damaged' | 'missing'
}

const LABELS = { overdue: 'Overdue', damaged: 'Damaged', missing: 'Missing' }

export function AlertBadge({ type }: Props) {
  return (
    <span
      title={LABELS[type]}
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14, color: 'hsl(var(--destructive))' }}
      >
        warning
      </span>
    </span>
  )
}
```

- [ ] **Step 2: Write `AlertsPanel.tsx`**

```tsx
// src/components/admin/AssetInventory/AlertsPanel.tsx
import type { AssetAlert } from './types'

interface Props {
  alerts: AssetAlert[]
  assetId: string
  assignmentId: string | null
  onResolve: (alertId: string) => Promise<boolean>
  onEscalate: (assetId: string, assignmentId: string | null) => Promise<boolean>
}

const ALERT_LABEL = { overdue: 'Overdue return', damaged: 'Damage reported', missing: 'Missing' }
const ALERT_COLOR = {
  overdue: 'hsl(var(--accent))',
  damaged: 'hsl(var(--destructive))',
  missing: 'hsl(var(--destructive))',
}

export function AlertsPanel({ alerts, assetId, assignmentId, onResolve, onEscalate }: Props) {
  const assetAlerts = alerts.filter((a) => a.asset_id === assetId && !a.resolved)

  if (!assetAlerts.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 10,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--destructive))',
        }}
      >
        Active Alerts
      </p>
      {assetAlerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid hsl(var(--destructive) / 0.25)`,
            background: 'hsl(var(--destructive) / 0.04)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: ALERT_COLOR[alert.alert_type] }}
            >
              warning
            </span>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {ALERT_LABEL[alert.alert_type]}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                {new Date(alert.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-outline btn-sm" onClick={() => onResolve(alert.id)}>
              Resolve
            </button>
            {alert.alert_type !== 'missing' && (
              <button
                className="btn btn-outline-dest btn-sm"
                onClick={() => onEscalate(assetId, assignmentId)}
              >
                Escalate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AssetInventory/AlertBadge.tsx src/components/admin/AssetInventory/AlertsPanel.tsx
git commit -m "feat(assets): add AlertBadge and AlertsPanel components"
```

---

## Task 6: Create `PrintLabelView.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/PrintLabelView.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/PrintLabelView.tsx
import type { Asset, AssetCondition } from './types'

const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

interface Props {
  asset: Asset
  onClose: () => void
}

export function PrintLabelView({ asset, onClose }: Props) {
  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Screen overlay (hidden during print) */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 200,
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
            maxWidth: 360,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p
            style={{
              margin: '0 0 16px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 15,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Print Asset Label
          </p>
          <AssetLabel asset={asset} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                print
              </span>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Print target (visible only during print) */}
      <div className="print-only" style={{ display: 'none' }}>
        <AssetLabel asset={asset} />
      </div>

      <style>{`
        @media print {
          body > *:not(.print-only) { display: none !important; }
          .print-only { display: block !important; padding: 24px; }
        }
      `}</style>
    </>
  )
}

function AssetLabel({ asset }: { asset: Asset }) {
  return (
    <div
      style={{
        border: '2px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {asset.qr_code_url ? (
        <img
          src={asset.qr_code_url}
          alt="Asset QR"
          style={{ width: 80, height: 80, flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            background: 'hsl(var(--container-low))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))' }}
          >
            qr_code_2
          </span>
        </div>
      )}
      <div>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 18,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {asset.name}
        </p>
        <p
          style={{
            margin: '0 0 2px',
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: 'monospace',
          }}
        >
          {asset.asset_tag}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
          {asset.category_name} · {CONDITION_LABEL[asset.condition]}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/PrintLabelView.tsx
git commit -m "feat(assets): add PrintLabelView for QR print labels"
```

---

## Task 7: Create `ExportMenu.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/ExportMenu.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/components/admin/AssetInventory/ExportMenu.tsx
import { useState } from 'react'
import type { Asset } from './types'

interface Props {
  assets: Asset[]
}

const HEADERS = [
  'Asset Tag',
  'Name',
  'Category',
  'Department',
  'Condition',
  'Serial Number',
  'Status',
  'Assigned To',
  'Purchase Price',
  'Purchase Date',
]

function assetToRow(a: Asset): string[] {
  return [
    a.asset_tag ?? '',
    a.name,
    a.category_name,
    a.department_id,
    a.condition,
    a.serial_number ?? '',
    a.assigned_to_name ? 'Assigned' : 'Available',
    a.assigned_to_name ?? '',
    a.purchase_price != null ? `$${a.purchase_price.toFixed(2)}` : '',
    a.purchase_date ?? '',
  ]
}

function exportCSV(assets: Asset[]) {
  const rows = [HEADERS, ...assets.map(assetToRow)]
  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `asset-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportPDF(assets: Asset[]) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Asset Inventory Report', 14, 16)
  doc.setFontSize(9)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    14,
    22
  )
  autoTable(doc, {
    head: [HEADERS],
    body: assets.map(assetToRow),
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 107, 63] }, // brand green
  })
  doc.save(`asset-inventory-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function ExportMenu({ assets }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-outline btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          download
        </span>
        Export
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          expand_more
        </span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
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
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => {
                setOpen(false)
                exportCSV(assets)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                table_view
              </span>
              Export CSV
            </button>
            <button
              className="btn btn-ghost"
              style={{
                width: '100%',
                padding: '9px 14px',
                textAlign: 'left',
                fontSize: 13,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => {
                setOpen(false)
                exportPDF(assets)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                picture_as_pdf
              </span>
              Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AssetInventory/ExportMenu.tsx
git commit -m "feat(assets): add ExportMenu with CSV and PDF export"
```

---

## Task 8: Create `DepreciationChart.tsx` and `ValueSummary.tsx`

**Files:**

- Create: `src/components/admin/AssetInventory/DepreciationChart.tsx`
- Create: `src/components/admin/AssetInventory/ValueSummary.tsx`

- [ ] **Step 1: Write `DepreciationChart.tsx`**

```tsx
// src/components/admin/AssetInventory/DepreciationChart.tsx
import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  purchasePrice: number
  purchaseDate: string
  lifespanYears: number
}

export function DepreciationChart({ purchasePrice, purchaseDate, lifespanYears }: Props) {
  const data = useMemo(() => {
    const start = new Date(purchaseDate)
    const endYear = start.getFullYear() + lifespanYears
    const points: { year: string; value: number }[] = []
    for (let y = start.getFullYear(); y <= endYear; y++) {
      const age = y - start.getFullYear()
      const value = Math.max(0, purchasePrice * (1 - age / lifespanYears))
      points.push({ year: String(y), value: Math.round(value * 100) / 100 })
    }
    return points
  }, [purchasePrice, purchaseDate, lifespanYears])

  return (
    <div style={{ marginTop: 12 }}>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 10,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        Depreciation Curve
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'Est. Value']}
            contentStyle={{
              fontSize: 11,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Write `ValueSummary.tsx`**

```tsx
// src/components/admin/AssetInventory/ValueSummary.tsx
import { useMemo } from 'react'
import type { Asset } from './types'

interface Props {
  assets: Asset[]
  categoriesById: Record<string, number> // category_id → lifespan_years
}

function estimateCurrentValue(asset: Asset, lifespanYears: number): number {
  if (!asset.purchase_price || !asset.purchase_date) return 0
  const ageYears =
    (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.max(0, asset.purchase_price * (1 - ageYears / lifespanYears))
}

export function ValueSummary({ assets, categoriesById }: Props) {
  const { totalPurchase, totalCurrent } = useMemo(() => {
    let tp = 0,
      tc = 0
    for (const a of assets) {
      if (!a.purchase_price) continue
      tp += a.purchase_price
      const lifespan = categoriesById[a.category_id] ?? 3
      tc += estimateCurrentValue(a, lifespan)
    }
    return { totalPurchase: tp, totalCurrent: tc }
  }, [assets, categoriesById])

  if (totalPurchase === 0) return null

  const kpis = [
    {
      label: 'Fleet Purchase Value',
      value: `$${totalPurchase.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Estimated Current Value',
      value: `$${totalCurrent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      bar: 'hsl(var(--primary))',
    },
  ]

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="panel"
          style={{ padding: '14px 16px 14px 20px', position: 'relative', overflow: 'hidden' }}
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
              margin: '0 0 6px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {kpi.label}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AssetInventory/DepreciationChart.tsx src/components/admin/AssetInventory/ValueSummary.tsx
git commit -m "feat(assets): add DepreciationChart and ValueSummary components"
```

---

## Task 9: Add QR generation to `AddAssetModal.tsx` + update `useAssetInventory`

**Files:**

- Modify: `src/components/admin/AssetInventory/AddAssetModal.tsx`
- Modify: `src/components/admin/AssetInventory/useAssetInventory.ts`

- [ ] **Step 1: Add QR generation helper to hook**

Add before the `return` statement in `useAssetInventory.ts`:

```ts
const generateAndSaveQR = useCallback(
  async (assetId: string, assetTag: string) => {
    try {
      const QRCode = await import('qrcode')
      const url = `${window.location.origin}/admin/it-department/assets?id=${assetId}`
      const dataUrl = await QRCode.default.toDataURL(url, { width: 300, margin: 2 })
      // Convert data URL to Blob
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('asset-qr-codes')
        .upload(`${assetId}.png`, blob, { contentType: 'image/png', upsert: true })
      if (uploadErr) {
        console.error('QR upload failed', uploadErr)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('asset-qr-codes').getPublicUrl(uploadData.path)
      await saveQrCodeUrl(assetId, publicUrl)
      await fetchAssets()
    } catch (err) {
      console.error('QR generation failed', err)
    }
  },
  [saveQrCodeUrl, fetchAssets]
)
```

Add `generateAndSaveQR` to the return object.

- [ ] **Step 2: Update `addAsset` to trigger QR after insert**

In the `addAsset` callback, replace:

```ts
toast.success('Asset added')
await fetchAssets()
return true
```

With:

```ts
toast.success('Asset added')
// fetch to get the generated asset_tag
const { data: inserted } = await supabase
  .from('assets')
  .select('id, asset_tag')
  .eq('department_id', departmentId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
if (inserted?.id && inserted?.asset_tag) {
  generateAndSaveQR(inserted.id, inserted.asset_tag)
}
await fetchAssets()
return true
```

- [ ] **Step 3: Add purchase_price and purchase_date to `AddAssetModal.tsx`**

Add state after `description`:

```ts
const [purchasePrice, setPurchasePrice] = useState(
  editAsset?.purchase_price != null ? String(editAsset.purchase_price) : ''
)
const [purchaseDate, setPurchaseDate] = useState(editAsset?.purchase_date ?? '')
```

Add two new form fields before the description textarea (in the 2-column grid row):

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
  <div>
    <label style={labelStyle}>Purchase Price</label>
    <input
      type="number"
      min="0"
      step="0.01"
      value={purchasePrice}
      onChange={(e) => setPurchasePrice(e.target.value)}
      placeholder="Optional"
      style={inputStyle}
    />
  </div>
  <div>
    <label style={labelStyle}>Purchase Date</label>
    <input
      type="date"
      value={purchaseDate}
      onChange={(e) => setPurchaseDate(e.target.value)}
      style={inputStyle}
    />
  </div>
</div>
```

Include these in the `onSubmit` payload:

```ts
ok = await onSubmit({
  name: name.trim(),
  category_id: categoryId,
  serial_number: serialNumber.trim(),
  description: description.trim(),
  condition,
  purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
  purchase_date: purchaseDate || null,
})
```

Update the `onSubmit` prop type to include `purchase_price: number | null; purchase_date: string | null`.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AssetInventory/AddAssetModal.tsx src/components/admin/AssetInventory/useAssetInventory.ts
git commit -m "feat(assets): add QR generation on asset create, purchase fields in modal"
```

---

## Task 10: Wire everything into `index.tsx` and `AssetDetailPanel.tsx`

**Files:**

- Modify: `src/components/admin/AssetInventory/index.tsx`
- Modify: `src/components/admin/AssetInventory/AssetDetailPanel.tsx`
- Modify: `src/components/admin/AssetInventory/AssetTable.tsx`

- [ ] **Step 1: Update `AssetTable.tsx` to show alert badge**

Add import:

```tsx
import { AlertBadge } from './AlertBadge'
import type { AssetAlert } from './types'
```

Add `alerts` prop to `Props`:

```ts
alerts: AssetAlert[]
```

In the Name cell, after `{asset.name}`, add:

```tsx
{
  alerts.some((al) => al.asset_id === asset.id && !al.resolved) && (
    <AlertBadge type={alerts.find((al) => al.asset_id === asset.id && !al.resolved)!.alert_type} />
  )
}
```

- [ ] **Step 2: Update `AssetDetailPanel.tsx`**

Add imports:

```tsx
import { AlertsPanel } from './AlertsPanel'
import { PrintLabelView } from './PrintLabelView'
import { DepreciationChart } from './DepreciationChart'
```

Add props:

```ts
alerts: AssetAlert[]
lifespanYears: number
canWrite: boolean
onResolveAlert: (id: string) => Promise<boolean>
onEscalate: (assetId: string, assignmentId: string | null) => Promise<boolean>
```

Add state inside component:

```ts
const [showPrint, setShowPrint] = useState(false)
```

In the Overview tab, after the `ConditionUpdateForm`, add:

```tsx
{
  /* Asset tag + QR */
}
{
  asset.asset_tag && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 14px',
        background: 'hsl(var(--container-low))',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {asset.qr_code_url && (
        <img src={asset.qr_code_url} alt="QR" style={{ width: 64, height: 64, flexShrink: 0 }} />
      )}
      <div>
        <p
          style={{
            margin: '0 0 2px',
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Asset Tag
        </p>
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: 'monospace',
            fontSize: 15,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {asset.asset_tag}
        </p>
        <button
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => setShowPrint(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            print
          </span>
          Print Label
        </button>
      </div>
    </div>
  )
}

{
  /* Depreciation */
}
{
  asset.purchase_price != null && asset.purchase_date && (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Estimated Value
        </p>
      </div>
      {(() => {
        const ageYears =
          (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        const current = Math.max(0, asset.purchase_price * (1 - ageYears / lifespanYears))
        return (
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            ${current.toFixed(2)}
          </p>
        )
      })()}
      <DepreciationChart
        purchasePrice={asset.purchase_price}
        purchaseDate={asset.purchase_date}
        lifespanYears={lifespanYears}
      />
    </div>
  )
}

{
  /* Alerts */
}
{
  canWrite && (
    <AlertsPanel
      alerts={alerts}
      assetId={asset.id}
      assignmentId={asset.assignment_id}
      onResolve={onResolveAlert}
      onEscalate={onEscalate}
    />
  )
}

{
  showPrint && <PrintLabelView asset={asset} onClose={() => setShowPrint(false)} />
}
```

- [ ] **Step 3: Update `index.tsx` to wire all new features**

Add imports:

```tsx
import { RequestAssetModal } from './RequestAssetModal'
import { RequestsQueue } from './RequestsQueue'
import { ExportMenu } from './ExportMenu'
import { ValueSummary } from './ValueSummary'
import type { AssetRequest } from './types'
```

Destructure new hook values:

```ts
const { ..., pendingRequests, alerts, submitRequest, approveRequest, denyRequest, resolveAlert, escalateToMissing, generateAndSaveQR } = useAssetInventory(...)
```

Add state:

```ts
const [showRequest, setShowRequest] = useState(false)
```

In the toolbar, replace the "Check Out" logic with role-conditional buttons:

- If `canWrite`: show "Add Asset" + "Add Category" + Export menu
- If not `canWrite`: show "Request Asset" button

In master mode above the table, add:

```tsx
{
  viewMode === 'master' && (
    <ValueSummary
      assets={assets}
      categoriesById={Object.fromEntries(categories.map((c) => [c.id, c.lifespan_years]))}
    />
  )
}
```

Add a "Requests" tab badge for admins — add a new tab entry in the `<AssetInventory>` toolbar:

```tsx
{
  canWrite && pendingRequests.length > 0 && (
    <button
      className="btn btn-outline btn-sm"
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5 }}
      onClick={() => setShowRequestsQueue(true)}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
        pending_actions
      </span>
      Requests
      <span
        style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'hsl(var(--destructive))',
          color: '#fff',
          fontSize: 9,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {pendingRequests.length}
      </span>
    </button>
  )
}
```

Add `showRequestsQueue` state and render `<RequestsQueue>` in a modal overlay when open.

Pass `alerts` to `<AssetTable>` and `<AssetDetailPanel>`.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AssetInventory/
git commit -m "feat(assets): wire phases E–H into index, table, and detail panel"
```

---

## Task 11: Update IT Dashboard + create Supabase Storage bucket

**Files:**

- Modify: `src/pages/admin/it/ITDashboard.tsx`
- Supabase MCP

- [ ] **Step 1: Create `asset-qr-codes` storage bucket**

Via Supabase MCP `execute_sql`:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-qr-codes', 'asset-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "asset_qr_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-qr-codes');

CREATE POLICY "asset_qr_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-qr-codes');

CREATE POLICY "asset_qr_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-qr-codes');
```

- [ ] **Step 2: Add Asset Alerts KPI tile to `ITDashboard.tsx`**

In the `ITStats` interface, add:

```ts
unresolvedAlerts: number
```

In the `Promise.all` inside `load()`, add one more count query:

```ts
supabase
  .from('asset_alerts')
  .select('*', { count: 'exact', head: true })
  .eq('resolved', false),
```

Add to `setStats`:

```ts
unresolvedAlerts: unresolvedAlerts ?? 0,
```

Add to `kpis` array:

```ts
{
  label: 'Asset Alerts',
  value: stats?.unresolvedAlerts,
  icon: 'warning',
  bar: 'hsl(var(--destructive))',
  sub: 'Overdue or missing assets',
  to: '/admin/it-department/assets',
},
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Final commit**

```bash
git add src/pages/admin/it/ITDashboard.tsx
git commit -m "feat(assets): add Asset Alerts KPI to IT dashboard + create QR storage bucket"
```

---

## Task 12: Smoke test

- [ ] **Navigate to `/admin/it-department/assets`**

Expected: existing assets load. New "Export" button visible for IT_MANAGER.

- [ ] **Create an asset with purchase price and date**

Fill in purchase price and date. Expected: asset created, QR code generates and uploads (may take a few seconds), asset row updates with QR URL.

- [ ] **Open detail panel → Overview tab**

Expected: Asset Tag shown, QR code image visible, "Print Label" button present, Estimated Value and depreciation chart visible.

- [ ] **Test request flow (as non-admin)**

Switch to a non-admin account. Expected: "Request Asset" button instead of checkout. Submit a request.

- [ ] **Back as IT_MANAGER — approve the request**

Expected: "Requests" badge appears with count. Click it, approve. Expected: asset assignment created, request marked approved.

- [ ] **Check overdue alert**

Manually insert a past-dated assignment and run `SELECT public.flag_overdue_asset_assignments()`. Expected: alert row created, overdue ⚠ badge appears on asset row.

- [ ] **Export CSV**

Click Export → CSV. Expected: file downloads with correct columns and current filter applied.

- [ ] **IT Dashboard alert tile**

Navigate to `/admin/it-department`. Expected: "Asset Alerts" KPI tile shows unresolved count.

- [ ] **Final cleanup commit if needed**

```bash
git add -A
git commit -m "chore(assets): smoke test fixes for phases E–H"
```
