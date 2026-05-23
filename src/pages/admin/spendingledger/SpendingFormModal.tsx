import { createPortal } from 'react-dom'
import { CATEGORIES, type FormState } from './types'

interface SpendingFormModalProps {
  isOpen: boolean
  isEdit: boolean
  onClose: () => void
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  saving: boolean
  onSave: () => void
}

export function SpendingFormModal({
  isOpen,
  isEdit,
  onClose,
  form,
  setForm,
  saving,
  onSave,
}: SpendingFormModalProps) {
  if (!isOpen) return null

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
          background: '#fff',
          border: '1px solid hsl(var(--border))',
          borderRadius: 6,
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
                fontWeight: 'var(--font-weight-semibold, 600)',
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
              background: '#fff',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="sl-description"
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: 6,
              }}
            >
              What was it for? *
            </label>
            <input
              id="sl-description"
              name="sl-description"
              type="text"
              placeholder="e.g. Printed 500 flyers for Kumasi East rally"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                htmlFor="sl-amount"
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                  style={{
                    width: '100%',
                    height: 40,
                    paddingLeft: 24,
                    paddingRight: 10,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="sl-category"
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Category *
              </label>
              <select
                id="sl-category"
                name="sl-category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 600,
                  background: '#fff',
                  color: 'hsl(var(--on-surface))',
                  boxSizing: 'border-box',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                htmlFor="sl-chapter"
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Chapter *
              </label>
              <input
                id="sl-chapter"
                name="sl-chapter"
                type="text"
                placeholder="e.g. Accra Central"
                value={form.chapter}
                onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="sl-date"
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Date *
              </label>
              <input
                id="sl-date"
                name="sl-date"
                type="date"
                value={form.timestamp}
                onChange={(e) => setForm((p) => ({ ...p, timestamp: e.target.value }))}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
