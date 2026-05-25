import type { CSSProperties } from 'react'

const lbl: CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

const inp: CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

interface Props {
  descDraft: string
  focusTags: string[]
  focusInput: string
  isSavingDetails: boolean
  emailDraft: string
  phoneDraft: string
  isSavingContact: boolean
  onDescChange: (v: string) => void
  onFocusInputChange: (v: string) => void
  onAddFocusTag: () => void
  onRemoveFocusTag: (tag: string) => void
  onSaveDetails: () => void
  onEmailChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onSaveContact: () => void
}

export function SettingsTab({
  descDraft,
  focusTags,
  focusInput,
  isSavingDetails,
  emailDraft,
  phoneDraft,
  isSavingContact,
  onDescChange,
  onFocusInputChange,
  onAddFocusTag,
  onRemoveFocusTag,
  onSaveDetails,
  onEmailChange,
  onPhoneChange,
  onSaveContact,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              edit_note
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Chapter profile
            </span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSaveDetails}
            disabled={isSavingDetails}
          >
            {isSavingDetails ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>About this chapter</label>
            <textarea
              name="descDraft"
              id="textarea-ba58d1"
              value={descDraft}
              onChange={(e) => onDescChange(e.target.value)}
              placeholder="Describe your chapter's mission, goals, and focus areas…"
              rows={4}
              style={{
                width: '100%',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '10px 12px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                background: '#fff',
                color: 'hsl(var(--on-surface))',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>
          <div>
            <label style={lbl}>Local focus areas</label>
            {focusTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {focusTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 8px 4px 12px',
                      background: 'hsl(var(--primary) / 0.08)',
                      border: '1px solid hsl(var(--primary) / 0.2)',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => onRemoveFocusTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'hsl(var(--primary))',
                        opacity: 0.7,
                        lineHeight: 1,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        close
                      </span>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                name="focusInput"
                id="input-9b4d88"
                type="text"
                value={focusInput}
                onChange={(e) => onFocusInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddFocusTag()
                  }
                }}
                placeholder="e.g. Voter registration"
                style={{ ...inp, flex: 1 }}
              />
              <button
                className="btn btn-outline btn-sm"
                onClick={onAddFocusTag}
                style={{ height: 40, whiteSpace: 'nowrap' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  add
                </span>
                Add
              </button>
            </div>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Press Enter or click Add. Click × on a tag to remove it.
            </p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              contacts
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Contact info
            </span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSaveContact}
            disabled={isSavingContact}
          >
            {isSavingContact ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div>
            <label style={lbl}>Chapter email</label>
            <input
              name="emailDraft"
              id="input-17e0b1"
              type="email"
              value={emailDraft}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="chapter@thebasemovement.com"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Chapter phone</label>
            <input
              name="phoneDraft"
              id="input-ec7459"
              type="tel"
              value={phoneDraft}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+233 50 000 0000"
              style={inp}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
