/**
 * AssetInventory Component Index
 * -------------------------------------------------------------
 * Coordinate container for the IT Asset Inventory system, checking roles/permissions,
 * toggling toolbar features, loading lists, and displaying detail drawers/modals.
 */

import { useState } from 'react'
import { adminService } from '@/services/adminService'
import type { AdminRole } from '@/types/admin'
import { useAssetInventory } from './useAssetInventory'
import { AssetTable } from './AssetTable'
import { AssetDetailPanel } from './AssetDetailPanel'
import { AddCategoryModal } from './AddCategoryModal'
import { AddAssetModal } from './AddAssetModal'
import type { Asset, AssetInventoryProps, AssetCondition } from './types'
import { RequestAssetModal } from './RequestAssetModal'
import { RequestsQueue } from './RequestsQueue'
import { ExportMenu } from './ExportMenu'
import { ValueSummary } from './ValueSummary'

const MASTER_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']
const WRITE_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']

/**
 * AssetInventory
 * -------------------------------------------------------------
 * Core wrapper managing toolbar buttons (Add/Request Asset), filters,
 * alerts resolution, and lists mounting for the IT department view.
 */
export function AssetInventory({ departmentId, viewMode }: AssetInventoryProps) {
  const currentUser = adminService.getCurrentUser()
  const userRole = currentUser?.role as AdminRole | undefined
  const canWrite = !!userRole && WRITE_ROLES.includes(userRole)
  const masterDenied = viewMode === 'master' && (!userRole || !MASTER_ROLES.includes(userRole))

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
    pendingRequests,
    alerts,
    submitRequest,
    approveRequest,
    denyRequest,
    resolveAlert,
    escalateToMissing,
  } = useAssetInventory(departmentId, viewMode)

  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [showRequest, setShowRequest] = useState(false)
  const [showRequestsQueue, setShowRequestsQueue] = useState(false)

  async function handleUpdateCondition(condition: AssetCondition, note: string) {
    if (!detail || !currentUser) return false
    return updateCondition(detail.asset.id, condition, note, currentUser.id)
  }

  if (masterDenied) {
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
          <>
            <label htmlFor="asset-inventory-department-filter" className="sr-only">
              Filter by department
            </label>
            <select
              id="asset-inventory-department-filter"
              name="assetInventoryDepartmentFilter"
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
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {canWrite && viewMode === 'department' && (
            <button
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setShowAddCategory(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                category
              </span>
              Add Category
            </button>
          )}
          {canWrite && (
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setShowAddAsset(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Add Asset
            </button>
          )}
          {!canWrite && (
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setShowRequest(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                request_quote
              </span>
              Request Asset
            </button>
          )}
          {canWrite && pendingRequests.length > 0 && (
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
          )}
          {canWrite && <ExportMenu assets={assets} />}
        </div>
      </div>

      {/* Value summary */}
      {viewMode === 'master' && canWrite && (
        <ValueSummary
          assets={assets}
          categoriesById={Object.fromEntries(categories.map((c) => [c.id, c.lifespan_years]))}
        />
      )}

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <AssetTable
          assets={assets}
          loading={loading}
          canWrite={canWrite}
          alerts={alerts}
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
          alerts={alerts}
          lifespanYears={
            categories.find((c) => c.id === detail.asset.category_id)?.lifespan_years ?? 3
          }
          onResolveAlert={resolveAlert}
          onEscalate={escalateToMissing}
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

      {/* Request asset modal (for non-admins) */}
      {showRequest && currentUser && (
        <RequestAssetModal
          assets={assets}
          departmentId={departmentId}
          requestedBy={currentUser.id}
          onClose={() => setShowRequest(false)}
          onSubmit={submitRequest}
        />
      )}

      {/* Requests queue modal (for admins) */}
      {showRequestsQueue && currentUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowRequestsQueue(false)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              width: '100%',
              maxWidth: 560,
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 15,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Pending Requests
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRequestsQueue(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>
            <RequestsQueue
              requests={pendingRequests}
              reviewerId={currentUser.id}
              onApprove={approveRequest}
              onDeny={denyRequest}
            />
          </div>
        </div>
      )}
    </div>
  )
}
