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
