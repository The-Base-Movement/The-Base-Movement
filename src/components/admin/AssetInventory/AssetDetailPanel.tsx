/**
 * AssetDetailPanel Component
 * -------------------------------------------------------------
 * Slide-out detail drawer component displaying extensive metadata for a single asset.
 * Includes tabs for general details, condition logs, checkout histories, and alerts.
 */

import { useState } from 'react'
import type { AssetDetail, AssetCondition, AssetAlert } from './types'
import { MaintenanceTimeline } from './MaintenanceTimeline'
import { CheckoutHistory } from './CheckoutHistory'
import { ConditionUpdateForm } from './ConditionUpdateForm'
import { AlertsPanel } from './AlertsPanel'
import { PrintLabelView } from './PrintLabelView'
import { DepreciationChart } from './DepreciationChart'

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
  alerts: AssetAlert[]
  lifespanYears: number
  onResolveAlert: (alertId: string) => Promise<boolean>
  onEscalate: (assetId: string, assignmentId: string | null) => Promise<boolean>
}

/**
 * Field
 * -------------------------------------------------------------
 * Helper component rendering a labeled metadata field.
 */
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

/**
 * AssetDetailPanel
 * -------------------------------------------------------------
 * Detailed slide-out view panel with tabs showing overview parameters,
 * maintenance logs, and checkout actions/histories.
 */
export function AssetDetailPanel({
  detail,
  loading,
  canWrite,
  members,
  onClose,
  onUpdateCondition,
  onCheckOut,
  onCheckIn,
  alerts,
  lifespanYears,
  onResolveAlert,
  onEscalate,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [showPrint, setShowPrint] = useState(false)
  const { asset, maintenanceLogs, assignments } = detail

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'maintenance', label: `Maintenance (${maintenanceLogs.length})` },
    { id: 'checkout', label: `Check-in/out (${assignments.length})` },
  ]

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 80 }}
        onClick={onClose}
      />
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
            flexShrink: 0,
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
            flexShrink: 0,
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

              {/* Asset tag + QR */}
              {asset.asset_tag && (
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
                    <img
                      src={asset.qr_code_url}
                      alt="QR"
                      style={{ width: 64, height: 64, flexShrink: 0 }}
                    />
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
              )}

              {/* Depreciation */}
              {asset.purchase_price != null &&
                asset.purchase_date &&
                (() => {
                  const now = new Date().getTime()
                  const ageYears =
                    (now - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
                  const current = Math.max(0, asset.purchase_price * (1 - ageYears / lifespanYears))
                  return (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
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
                      <DepreciationChart
                        purchasePrice={asset.purchase_price!}
                        purchaseDate={asset.purchase_date}
                        lifespanYears={lifespanYears}
                      />
                    </div>
                  )
                })()}

              {/* Alerts */}
              {canWrite && (
                <AlertsPanel
                  alerts={alerts}
                  assetId={asset.id}
                  assignmentId={asset.assignment_id}
                  onResolve={onResolveAlert}
                  onEscalate={onEscalate}
                />
              )}

              {/* Print label modal */}
              {showPrint && <PrintLabelView asset={asset} onClose={() => setShowPrint(false)} />}
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
