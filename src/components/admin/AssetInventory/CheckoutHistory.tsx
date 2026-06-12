import { useState } from 'react'
import type { AssetAssignment, Asset, AssetCondition } from './types'
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
  onUpdateCondition: (condition: AssetCondition, note: string) => Promise<boolean>
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
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setCheckingIn(openAssignment)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                login
              </span>
              Check In
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setShowCheckOut(true)}
            >
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
