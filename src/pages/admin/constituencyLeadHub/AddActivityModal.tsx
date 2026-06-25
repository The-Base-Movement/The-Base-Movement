import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Modal } from './types'

interface AddActivityModalProps {
  actTitle: string
  setActTitle: Dispatch<SetStateAction<string>>
  actDesc: string
  setActDesc: Dispatch<SetStateAction<string>>
  actType: string
  setActType: Dispatch<SetStateAction<string>>
  actDate: string
  setActDate: Dispatch<SetStateAction<string>>
  actSaving: boolean
  handleAddActivity: (event: FormEvent) => void
  setModal: Dispatch<SetStateAction<Modal>>
}

export function AddActivityModal(props: AddActivityModalProps) {
  const {
    actTitle,
    setActTitle,
    actDesc,
    setActDesc,
    actType,
    setActType,
    actDate,
    setActDate,
    actSaving,
    handleAddActivity,
    setModal,
  } = props

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
      onClick={() => setModal(null)}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 480,
          margin: '0 16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 17,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 20px',
          }}
        >
          Add Activity
        </h2>
        <form
          onSubmit={handleAddActivity}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <input
            required
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
            placeholder="Title *"
            style={{
              height: 40,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontFamily: "'Public Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
            placeholder="Description"
            rows={3}
            style={{
              padding: '10px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontFamily: "'Public Sans', sans-serif",
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <input
            required
            value={actType}
            onChange={(e) => setActType(e.target.value)}
            placeholder="Type (e.g. Meeting, Workshop) *"
            style={{
              height: 40,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontFamily: "'Public Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          />
          <input
            required
            type="date"
            value={actDate}
            onChange={(e) => setActDate(e.target.value)}
            style={{
              height: 40,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontFamily: "'Public Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={actSaving}>
              {actSaving ? 'Saving...' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
