import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { adminService } from '@/services/adminService'
import type { FormState } from './types'

interface SpendingFormModalProps {
  isOpen: boolean
  isEdit: boolean
  onClose: () => void
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  saving: boolean
  onSave: () => void
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  boxSizing: 'border-box',
  outline: 'none',
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 6,
}

const NEW_CATEGORY_SENTINEL = '__new__'

export function SpendingFormModal({
  isOpen,
  isEdit,
  onClose,
  form,
  setForm,
  saving,
  onSave,
}: SpendingFormModalProps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')

  useEffect(() => {
    if (!isOpen) return
    adminService.getSpendingCategories().then((data) => {
      setCategories(data)
      // When editing, auto-switch to custom input if category isn't in the DB list
      if (isEdit && form.category && !data.some((c) => c.name === form.category)) {
        setIsCustom(true)
        setCustomValue(form.category)
      } else {
        setIsCustom(false)
        setCustomValue('')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === NEW_CATEGORY_SENTINEL) {
      setIsCustom(true)
      setCustomValue('')
      setForm((p) => ({ ...p, category: '' }))
    } else {
      setIsCustom(false)
      setCustomValue('')
      setForm((p) => ({ ...p, category: e.target.value }))
    }
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value)
    setForm((p) => ({ ...p, category: e.target.value }))
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 6,
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 15,
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              {isEdit ? 'Edit spending entry' : 'Add spending entry'}
            </h3>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontWeight: 500,
                margin: 0,
              }}
            >
              This will appear in the public "How funds are used" tab.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--surface))',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <div>
            <label htmlFor="sl-description" style={labelStyle}>
              What was it for? *
            </label>
            <input
              id="sl-description"
              name="sl-description"
              type="text"
              placeholder="e.g. Printed 500 flyers for Kumasi East rally"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={fieldStyle}
            />
          </div>

          {/* Amount + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="sl-amount" style={labelStyle}>
                Amount (GHS) *
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  ₵
                </span>
                <input
                  id="sl-amount"
                  name="sl-amount"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  style={{ ...fieldStyle, paddingLeft: 24, paddingRight: 10 }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="sl-category" style={labelStyle}>
                Category *
              </label>
              {categories.length === 0 ? (
                <input
                  id="sl-category"
                  name="sl-category"
                  type="text"
                  placeholder="Loading…"
                  disabled
                  style={{ ...fieldStyle, opacity: 0.5 }}
                />
              ) : isCustom ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    id="sl-category"
                    name="sl-category"
                    type="text"
                    placeholder="New category name"
                    value={customValue}
                    onChange={handleCustomChange}
                    style={{ ...fieldStyle, flex: 1 }}
                    autoFocus
                  />
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => {
                      setIsCustom(false)
                      setCustomValue('')
                      setForm((p) => ({ ...p, category: categories[0]?.name ?? '' }))
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      arrow_back
                    </span>
                  </button>
                </div>
              ) : (
                <select
                  id="sl-category"
                  name="sl-category"
                  value={form.category}
                  onChange={handleSelectChange}
                  style={{ ...fieldStyle, cursor: 'pointer' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY_SENTINEL}>＋ New category…</option>
                </select>
              )}
            </div>
          </div>

          {/* Chapter + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="sl-chapter" style={labelStyle}>
                Chapter *
              </label>
              <input
                id="sl-chapter"
                name="sl-chapter"
                type="text"
                placeholder="e.g. Accra Central"
                value={form.chapter}
                onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
                style={fieldStyle}
              />
            </div>
            <div>
              <label htmlFor="sl-date" style={labelStyle}>
                Date *
              </label>
              <input
                id="sl-date"
                name="sl-date"
                type="date"
                value={form.timestamp}
                onChange={(e) => setForm((p) => ({ ...p, timestamp: e.target.value }))}
                style={{ ...fieldStyle, padding: '0 10px' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 8,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ flexGrow: 1 }}>
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ flexGrow: 1 }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
