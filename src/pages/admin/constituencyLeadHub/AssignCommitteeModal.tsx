import type { Dispatch, SetStateAction } from 'react'
import type { ConstituencyLeader } from '@/types/admin'
import type { Modal, UserOption } from './types'

interface AssignCommitteeModalProps {
  committeeRole: ConstituencyLeader['role']
  setCommitteeRole: Dispatch<SetStateAction<ConstituencyLeader['role']>>
  committeeMemberSearch: string
  setCommitteeMemberSearch: Dispatch<SetStateAction<string>>
  committeeMemberOptions: UserOption[]
  committeeSelectedMember: UserOption | null
  setCommitteeSelectedMember: Dispatch<SetStateAction<UserOption | null>>
  committeeSaving: boolean
  handleAssignCommitteeMember: () => void
  setModal: Dispatch<SetStateAction<Modal>>
}

export function AssignCommitteeModal(props: AssignCommitteeModalProps) {
  const {
    committeeRole,
    setCommitteeRole,
    committeeMemberSearch,
    setCommitteeMemberSearch,
    committeeMemberOptions,
    committeeSelectedMember,
    setCommitteeSelectedMember,
    committeeSaving,
    handleAssignCommitteeMember,
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
          maxHeight: '90vh',
          overflowY: 'auto',
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
          Assign Committee Member
        </h2>

        {/* Role selector */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            Role
          </label>
          <select
            value={committeeRole}
            onChange={(e) => setCommitteeRole(e.target.value as ConstituencyLeader['role'])}
            style={{
              width: '100%',
              height: 40,
              padding: '0 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontFamily: "'Public Sans', sans-serif",
              background: 'hsl(var(--background))',
              color: 'hsl(var(--on-surface))',
              boxSizing: 'border-box',
            }}
          >
            <option value="Secretary">Secretary</option>
            <option value="Deputy Secretary">Deputy Secretary</option>
            <option value="Treasurer">Treasurer</option>
          </select>
        </div>

        {/* Member search */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            Select Member
          </label>
          <input
            value={committeeMemberSearch}
            onChange={(e) => {
              setCommitteeMemberSearch(e.target.value)
              setCommitteeSelectedMember(null)
            }}
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
              marginBottom: 8,
            }}
          />
          {committeeMemberOptions.length > 0 && (
            <div
              style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {committeeMemberOptions.map((u) => (
                <button
                  key={u.id}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    width: '100%',
                    borderRadius: 0,
                    borderBottom: '1px solid hsl(var(--border))',
                    background:
                      committeeSelectedMember?.id === u.id
                        ? 'hsl(var(--primary) / 0.06)'
                        : undefined,
                    borderLeft:
                      committeeSelectedMember?.id === u.id
                        ? '3px solid hsl(var(--primary))'
                        : '3px solid transparent',
                  }}
                  onClick={() => setCommitteeSelectedMember(u)}
                >
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-pill)',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
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
                        style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                      >
                        person
                      </span>
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {u.full_name}
                  </span>
                </button>
              ))}
            </div>
          )}
          {committeeMemberSearch && committeeMemberOptions.length === 0 && (
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
              No members found.
            </p>
          )}
        </div>

        {/* Preview */}
        {committeeSelectedMember && (
          <div
            style={{
              background: 'hsl(var(--primary) / 0.06)',
              border: '1px solid hsl(var(--primary) / 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              check_circle
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
              }}
            >
              <strong>{committeeSelectedMember.full_name}</strong> will be assigned as{' '}
              <strong>{committeeRole}</strong>.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setModal(null)
              setCommitteeMemberSearch('')
              setCommitteeSelectedMember(null)
              setCommitteeRole('Secretary')
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAssignCommitteeMember}
            disabled={!committeeSelectedMember || committeeSaving}
          >
            {committeeSaving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
