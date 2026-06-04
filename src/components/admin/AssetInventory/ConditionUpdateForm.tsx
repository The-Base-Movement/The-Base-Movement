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
