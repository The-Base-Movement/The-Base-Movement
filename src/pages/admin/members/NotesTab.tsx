import { type Member, type MemberNote } from '@/services/adminService'

interface NotesTabProps {
  member: Member
  notes: MemberNote[]
  noteContent: string
  onNoteChange: (v: string) => void
  onAddNote: () => void
  isSubmitting: boolean
}

export function NotesTab({
  member,
  notes,
  noteContent,
  onNoteChange,
  onAddNote,
  isSubmitting,
}: NotesTabProps) {
  return (
    <div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="ph2">
          <h3>Add administrative note</h3>
          <span className="meta">internal record</span>
        </div>
        <div style={{ padding: '18px 24px' }}>
          <label htmlFor="textarea-8e85c6" style={{ display: 'none' }}>
            Internal administrative note
          </label>
          <textarea
            name="newNoteContent"
            id="textarea-8e85c6"
            value={noteContent}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Type internal observation or status update…"
            style={{
              width: '100%',
              minHeight: 80,
              background: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: 10,
              fontSize: 12.5,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              marginBottom: 10,
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={onAddNote}
              disabled={isSubmitting || !noteContent.trim()}
            >
              {isSubmitting ? 'Saving…' : 'Post internal note'}
            </button>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="ph2">
          <h3>Notes history</h3>
          <span className="meta">{notes.length + 1} records</span>
        </div>
        <div style={{ padding: '4px 0' }}>
          {notes.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <b
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 11.5,
                    }}
                  >
                    {n.author}
                  </b>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      background: 'rgba(0,0,0,.05)',
                      padding: '1px 6px',
                      borderRadius: 99,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {n.role}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {n.date}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.6,
                }}
              >
                {n.content}
              </p>
            </div>
          ))}
          <div style={{ padding: '14px 24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <b
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 11.5,
                }}
              >
                System
              </b>
              <span
                style={{
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                }}
              >
                {member.joined || 'On join'}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
              }}
            >
              Member registered via{' '}
              {member.platform === 'DIASPORA' ? 'diaspora portal' : 'standard registration'}. Status
              set to {member.status}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
