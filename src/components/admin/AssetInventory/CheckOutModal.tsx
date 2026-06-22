/**
 * CheckOutModal Component
 * -------------------------------------------------------------
 * Modal interface allowing administrators to allocate/check out an asset
 * to a selected member, with optional return dates and handover notes.
 */

import { useState, useMemo } from 'react'

interface Props {
  assetId: string
  assetName: string
  members: { id: string; full_name: string }[]
  onClose: () => void
  onSubmit: (payload: {
    asset_id: string
    assigned_to: string
    expected_return_date: string | null
    notes: string
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

/**
 * CheckOutModal
 * -------------------------------------------------------------
 * Dialog form component handles member list searching, dropdown selections,
 * input state bindings, and checkout action triggers.
 */
export function CheckOutModal({ assetId, assetName, members, onClose, onSubmit }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = useMemo(
    () =>
      members.filter((m) => m.full_name.toLowerCase().includes(search.toLowerCase())).slice(0, 20),
    [members, search]
  )

  const selectedName = members.find((m) => m.id === selectedId)?.full_name ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    const ok = await onSubmit({
      asset_id: assetId,
      assigned_to: selectedId,
      expected_return_date: returnDate || null,
      notes: notes.trim(),
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
          Check Out Asset
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          {assetName}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <label htmlFor={`asset-checkout-assignee-${assetId}`} style={labelStyle}>
              Assign To
            </label>
            <input
              id={`asset-checkout-assignee-${assetId}`}
              name="assetCheckoutAssignee"
              value={selectedId ? selectedName : search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedId('')
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search members…"
              style={inputStyle}
              autoComplete="off"
            />
            {showDropdown && filtered.length > 0 && !selectedId && (
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
                  {filtered.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      style={{
                        display: 'block',
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
                        setSelectedId(m.id)
                        setSearch('')
                        setShowDropdown(false)
                      }}
                    >
                      {m.full_name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label htmlFor={`asset-checkout-return-date-${assetId}`} style={labelStyle}>
              Expected Return Date{' '}
              <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              id={`asset-checkout-return-date-${assetId}`}
              name="assetCheckoutReturnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor={`asset-checkout-notes-${assetId}`} style={labelStyle}>
              Notes <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              id={`asset-checkout-notes-${assetId}`}
              name="assetCheckoutNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !selectedId}
            >
              {saving ? 'Checking out…' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
