import { createPortal } from 'react-dom'
import { INPUT_ST } from './types'

interface Props {
  name: string
  value: string
  saving: boolean
  onChange: (v: string) => void
  onClose: () => void
  onSave: () => void
}

export function EditTitleModal({ name, value, saving, onChange, onClose, onSave }: Props) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Edit Role Title
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            {name}
          </p>
        </div>

        <div style={{ padding: 20 }}>
          <input
            id="edit-role-title"
            name="roleTitle"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Role title"
            autoFocus
            style={INPUT_ST}
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={saving || !value.trim()}
              onClick={onSave}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
