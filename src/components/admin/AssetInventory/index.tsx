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
  } = useAssetInventory(departmentId, viewMode)

  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)

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
