/**
 * AddCategoryModal Component
 * -------------------------------------------------------------
 * Modal interface allowing administrators to define and insert new
 * asset categories into the database.
 */

import { useState } from 'react'

interface Props {
  onClose: () => void
  onSubmit: (name: string) => Promise<boolean>
}

/**
 * AddCategoryModal
 * -------------------------------------------------------------
 * Renders the dialog form to create a new asset category.
 */
export function AddCategoryModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const ok = await onSubmit(name.trim())
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
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: '0 0 20px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 16,
            color: 'hsl(var(--on-surface))',
          }}
        >
          Add Category
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              htmlFor="asset-category-name"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Category Name
            </label>
            <input
              id="asset-category-name"
              name="assetCategoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptop, AV Equipment"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                background: 'hsl(var(--background))',
                color: 'hsl(var(--on-surface))',
              }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Saving…' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
