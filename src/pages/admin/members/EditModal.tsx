import { createPortal } from 'react-dom'
import { type Member } from '@/services/adminService'

interface EditModalProps {
  isOpen: boolean
  member: Member | null
  form: Partial<Member>
  onChange: (field: string, value: string) => void
  onSave: () => void
  onClose: () => void
  isSaving: boolean
  chapters?: string[]
}

export function EditModal({
  isOpen,
  member,
  form,
  onChange,
  onSave,
  onClose,
  isSaving,
  chapters,
}: EditModalProps) {
  if (!isOpen || !member) return null
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.6)',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'hsl(var(--surface))',
          borderRadius: 4,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '22px 28px',
            borderTop: '4px solid hsl(var(--primary))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: 'rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
              >
                edit
              </span>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 18,
                  color: '#fff',
                }}
              >
                Edit member info
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11.5,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                {member.name}
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {(
            [
              { key: 'name', label: 'Full name', type: 'text' },
              { key: 'email', label: 'Email address', type: 'email' },
              { key: 'phone', label: 'Phone number', type: 'text' },
              { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
              { key: 'region', label: 'Region', type: 'text' },
              { key: 'constituency', label: 'Constituency', type: 'text' },
              { key: 'country', label: 'Country', type: 'text' },
              { key: 'chapter', label: 'Chapter', type: 'text' },
              { key: 'profession', label: 'Profession', type: 'text' },
              { key: 'city', label: 'City / Town', type: 'text' },
              { key: 'residentialAddress', label: 'Residential address', type: 'text' },
            ] as const
          ).map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`input-edit-${field.key}`}
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  marginBottom: 5,
                }}
              >
                {field.label}
              </label>
              {field.key === 'chapter' ? (
                <select
                  name={field.key}
                  id={`input-edit-${field.key}`}
                  value={(form[field.key as keyof typeof form] as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  style={{
                    width: '100%',
                    height: 42,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '0 12px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 13,
                    background: 'hsl(var(--surface))',
                    color: 'hsl(var(--on-surface))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">— select chapter —</option>
                  {(chapters ?? []).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : field.type === 'select' ? (
                <select
                  name={field.key}
                  id={`input-edit-${field.key}`}
                  value={(form[field.key as keyof typeof form] as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  style={{
                    width: '100%',
                    height: 42,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '0 12px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 13,
                    background: 'hsl(var(--surface))',
                    color: 'hsl(var(--on-surface))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">— select —</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.key}
                  id={`input-edit-${field.key}`}
                  type={field.type}
                  value={(form[field.key as keyof typeof form] as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  style={{
                    width: '100%',
                    height: 42,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '0 12px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
