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
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)

  const closeMenu = () => {
    setOpenMenuId(null)
    setMenuPosition(null)
  }

  const toggleMenu = (assetId: string, target: HTMLElement) => {
    if (openMenuId === assetId) {
      closeMenu()
      return
    }

    const rect = target.getBoundingClientRect()
    setMenuPosition({
      top: Math.min(rect.bottom + 4, window.innerHeight - 104),
      right: Math.max(8, window.innerWidth - rect.right),
    })
    setOpenMenuId(assetId)
  }

  const activeAsset = assets.find((asset) => asset.id === openMenuId)

  const renderMenu = () => {
    if (!canWrite || !activeAsset || !menuPosition) return null

    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} onClick={closeMenu} />
        <div
          style={{
            position: 'fixed',
            top: menuPosition.top,
            right: menuPosition.right,
            zIndex: 90,
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-md)',
            minWidth: 150,
            boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
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
              closeMenu()
              onEdit(activeAsset)
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
              closeMenu()
              onDelete(activeAsset)
            }}
          >
            Delete
          </button>
        </div>
      </>
    )
  }

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
    <div>
      <div className="desktop-only">
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}
        >
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
                    width: h === 'Name' ? '26%' : h === 'Status' ? '22%' : h === '' ? 52 : '15%',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const activeAlert = alerts.find((al) => al.asset_id === asset.id && !al.resolved)
              const updatedAt = new Date(asset.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              return (
                <tr
                  key={asset.id}
                  onClick={() => onRowClick(asset)}
                  style={{
                    borderBottom: '1px solid hsl(var(--border))',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                      }}
                    >
                      {asset.name}
                    </span>
                    {activeAlert ? <AlertBadge type={activeAlert.alert_type} /> : null}
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                        <span className="pill pill-warn">Assigned</span>
                        <span
                          style={{
                            fontSize: 12,
                            color: 'hsl(var(--on-surface-muted))',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {asset.assigned_to_name}
                        </span>
                      </span>
                    ) : (
                      <span className="pill pill-ok">Available</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                    {updatedAt}
                  </td>
                  <td style={{ padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                    {canWrite && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={(e) => toggleMenu(asset.id, e.currentTarget)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          more_vert
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-only">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
          {assets.map((asset) => {
            const activeAlert = alerts.find((al) => al.asset_id === asset.id && !al.resolved)
            const updatedAt = new Date(asset.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })

            return (
              <div
                key={asset.id}
                role="button"
                tabIndex={0}
                onClick={() => onRowClick(asset)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(asset)
                  }
                }}
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  color: 'hsl(var(--on-surface))',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          lineHeight: 1.35,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          overflowWrap: 'break-word',
                          wordBreak: 'normal',
                        }}
                      >
                        {asset.name}
                      </span>
                      {activeAlert ? <AlertBadge type={activeAlert.alert_type} /> : null}
                    </div>
                    <p
                      style={{
                        margin: '5px 0 0',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {asset.category_name} · Updated {updatedAt}
                    </p>
                  </div>
                  {canWrite && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', flex: '0 0 auto' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMenu(asset.id, e.currentTarget)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleMenu(asset.id, e.currentTarget)
                        }
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        more_vert
                      </span>
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 12,
                  }}
                >
                  <span className={CONDITION_PILL[asset.condition]}>
                    {CONDITION_LABEL[asset.condition]}
                  </span>
                  {asset.assigned_to_name ? (
                    <>
                      <span className="pill pill-warn">Assigned</span>
                      <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                        {asset.assigned_to_name}
                      </span>
                    </>
                  ) : (
                    <span className="pill pill-ok">Available</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {renderMenu()}
    </div>
  )
}
