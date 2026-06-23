import { createPortal } from 'react-dom'
import type { FieldDirective } from '@/types/admin'

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-normal, 400)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

interface IssueDirectiveModalProps {
  isOpen: boolean
  onClose: () => void
  newDirective: Omit<FieldDirective, 'id' | 'status'>
  setNewDirective: (val: Omit<FieldDirective, 'id' | 'status'>) => void
  isSubmitting: boolean
  onConfirm: () => Promise<void>
}

export function IssueDirectiveModal({
  isOpen,
  onClose,
  newDirective,
  setNewDirective,
  isSubmitting,
  onConfirm,
}: IssueDirectiveModalProps) {
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
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '24px 28px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 18,
              color: 'hsl(var(--on-surface))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}
            >
              flag
            </span>
            Issue new directive
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Deploy tactical field objectives to the movement's national network.
          </p>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={labelSt} htmlFor="directive-title">
                Directive title
              </label>
              <input
                id="directive-title"
                name="directiveTitle"
                style={inputSt}
                placeholder="e.g. Regional Flyer Blitz"
                value={newDirective.title}
                onChange={(e) => setNewDirective({ ...newDirective, title: e.target.value })}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={labelSt} htmlFor="target-level">
                Target level
              </label>
              <select
                id="target-level"
                name="targetLevel"
                style={{ ...inputSt, appearance: 'none' }}
                value={newDirective.target_type}
                onChange={(e) =>
                  setNewDirective({
                    ...newDirective,
                    target_type: e.target.value as FieldDirective['target_type'],
                  })
                }
              >
                <option>Regional</option>
                <option>Chapter</option>
                <option>Global</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelSt} htmlFor="objective-description">
              Objective description
            </label>
            <textarea
              id="objective-description"
              name="objectiveDescription"
              style={{
                ...inputSt,
                height: 100,
                padding: '10px 12px',
                resize: 'none',
                lineHeight: 1.6,
              }}
              placeholder="Describe the tactical goal for field agents…"
              value={newDirective.description}
              onChange={(e) => setNewDirective({ ...newDirective, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={labelSt} htmlFor="priority-level">
                Priority
              </label>
              <select
                id="priority-level"
                name="priorityLevel"
                style={{ ...inputSt, appearance: 'none' }}
                value={newDirective.priority}
                onChange={(e) =>
                  setNewDirective({
                    ...newDirective,
                    priority: e.target.value as FieldDirective['priority'],
                  })
                }
              >
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={labelSt} htmlFor="directive-points">
                Points
              </label>
              <input
                id="directive-points"
                name="directivePoints"
                style={inputSt}
                type="number"
                value={newDirective.points_awarded}
                onChange={(e) =>
                  setNewDirective({ ...newDirective, points_awarded: Number(e.target.value) })
                }
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={labelSt} htmlFor="directive-deadline">
                Deadline
              </label>
              <input
                id="directive-deadline"
                name="directiveDeadline"
                style={inputSt}
                type="date"
                value={newDirective.deadline}
                onChange={(e) => setNewDirective({ ...newDirective, deadline: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '20px 28px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-dest"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              send
            </span>
            {isSubmitting ? 'Deploying…' : 'Deploy directive'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
