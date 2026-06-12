import type { Dispatch, SetStateAction } from 'react'

interface Props {
  descDraft: string
  setDescDraft: (s: string) => void
  focusTags: string[]
  setFocusTags: Dispatch<SetStateAction<string[]>>
  focusInput: string
  setFocusInput: (s: string) => void
  isSavingDetails: boolean
  onSaveDetails: () => void
  emailDraft: string
  setEmailDraft: (s: string) => void
  phoneDraft: string
  setPhoneDraft: (s: string) => void
  isSavingContact: boolean
  onSaveContact: () => void
}

export function SettingsTab({
  descDraft,
  setDescDraft,
  focusTags,
  setFocusTags,
  focusInput,
  setFocusInput,
  isSavingDetails,
  onSaveDetails,
  emailDraft,
  setEmailDraft,
  phoneDraft,
  setPhoneDraft,
  isSavingContact,
  onSaveContact,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: '20px 24px' }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 16px',
          }}
        >
          About
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Focus Areas
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {focusTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    background: 'hsl(var(--container-low))',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => setFocusTags((prev) => prev.filter((t) => t !== tag))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const t = focusInput.trim()
                    if (t && !focusTags.includes(t)) {
                      setFocusTags((prev) => [...prev, t])
                      setFocusInput('')
                    }
                  }
                }}
                placeholder="Add focus area, press Enter"
                style={{
                  flex: 1,
                  height: 38,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={onSaveDetails}
              disabled={isSavingDetails}
            >
              {isSavingDetails ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px 24px' }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 16px',
          }}
        >
          Contact Info
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              type="email"
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Phone
            </label>
            <input
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              type="tel"
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={onSaveContact}
            disabled={isSavingContact}
          >
            {isSavingContact ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
