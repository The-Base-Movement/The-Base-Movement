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
