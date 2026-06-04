import { useState } from 'react'
import type { Asset, AssetCondition, AssetAlert } from './types'
import { AlertBadge } from './AlertBadge'

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
  alerts: AssetAlert[]
  onRowClick: (asset: Asset) => void
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export function AssetTable({
  assets,
  loading,
  canWrite,
  alerts,
  onRowClick,
  onEdit,
  onDelete,
}: Props) {
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
                {(() => {
                  const activeAlert = alerts.find((al) => al.asset_id === asset.id && !al.resolved)
                  return activeAlert ? <AlertBadge type={activeAlert.alert_type} /> : null
                })()}
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
                    <span className="pill pill-warn">Assigned</span>
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
