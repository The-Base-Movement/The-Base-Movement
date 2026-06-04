import { useState } from 'react'
import type { AssetCategory, AssetCondition, Asset } from './types'

interface Props {
  categories: AssetCategory[]
  editAsset?: Asset | null
  onClose: () => void
  onSubmit: (payload: {
    name: string
    category_id: string
    serial_number: string
    description: string
    condition: AssetCondition
    purchase_price: number | null
    purchase_date: string | null
  }) => Promise<boolean>
  onUpdate?: (
    id: string,
    payload: { name: string; category_id: string; serial_number: string; description: string }
  ) => Promise<boolean>
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

export function AddAssetModal({ categories, editAsset, onClose, onSubmit, onUpdate }: Props) {
  const [name, setName] = useState(editAsset?.name ?? '')
  const [categoryId, setCategoryId] = useState(editAsset?.category_id ?? categories[0]?.id ?? '')
  const [serialNumber, setSerialNumber] = useState(editAsset?.serial_number ?? '')
  const [description, setDescription] = useState(editAsset?.description ?? '')
  const [condition, setCondition] = useState<AssetCondition>(editAsset?.condition ?? 'good')
  const [purchasePrice, setPurchasePrice] = useState(
    editAsset?.purchase_price != null ? String(editAsset.purchase_price) : ''
  )
  const [purchaseDate, setPurchaseDate] = useState(editAsset?.purchase_date ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !categoryId) return
    setSaving(true)
    let ok: boolean
    if (editAsset && onUpdate) {
      ok = await onUpdate(editAsset.id, {
        name: name.trim(),
        category_id: categoryId,
        serial_number: serialNumber.trim(),
        description: description.trim(),
      })
    } else {
      ok = await onSubmit({
        name: name.trim(),
        category_id: categoryId,
        serial_number: serialNumber.trim(),
        description: description.trim(),
        condition,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        purchase_date: purchaseDate || null,
      })
    }
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
            margin: '0 0 20px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 16,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {editAsset ? 'Edit Asset' : 'Add Asset'}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro 14"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Serial Number</label>
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>
            {!editAsset && (
              <div>
                <label style={labelStyle}>Initial Condition</label>
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
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Purchase Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              rows={3}
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
              disabled={saving || !name.trim() || !categoryId}
            >
              {saving ? 'Saving…' : editAsset ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
