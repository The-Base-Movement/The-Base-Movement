import type { Dispatch, SetStateAction } from 'react'
import type { Modal, UserOption } from './types'

interface AssignLeaderModalProps {
  leaderSearch: string
  setLeaderSearch: Dispatch<SetStateAction<string>>
  leaderOptions: UserOption[]
  leaderSaving: boolean
  handleAssignLeader: (user: UserOption) => void
  setModal: Dispatch<SetStateAction<Modal>>
}

export function AssignLeaderModal(props: AssignLeaderModalProps) {
  const {
    leaderSearch,
    setLeaderSearch,
    leaderOptions,
    leaderSaving,
    handleAssignLeader,
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
          Assign Coordinator
        </h2>
        <input
          value={leaderSearch}
          onChange={(e) => setLeaderSearch(e.target.value)}
          placeholder="Search member by name..."
          style={{
            width: '100%',
            height: 40,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            fontFamily: "'Public Sans', sans-serif",
            boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />
        {leaderOptions.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {leaderOptions.map((u) => (
              <button
                key={u.id}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', gap: 12, padding: '10px 12px' }}
                onClick={() => handleAssignLeader(u)}
                disabled={leaderSaving}
              >
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-pill)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-pill)',
                      background: 'hsl(var(--container-low))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                    >
                      person
                    </span>
                  </div>
                )}
                <span style={{ fontSize: 14, color: 'hsl(var(--on-surface))' }}>{u.full_name}</span>
              </button>
            ))}
          </div>
        )}
        {leaderSearch && leaderOptions.length === 0 && (
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>No members found.</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
