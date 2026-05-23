import { createPortal } from 'react-dom'

type VoterRow = {
  id: string
  user_id: string
  registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'
  polling_station_id: string | null
  member_name: string
  registration_number: string
  chapter: string | null
  constituency: string | null
  region: string | null
  created_at: string
}

interface AppointStationAgentModalProps {
  isOpen: boolean
  onClose: () => void
  modalStationTarget: VoterRow | null
  appointing: boolean
  onConfirm: () => Promise<void>
}

export function AppointStationAgentModal({
  isOpen,
  onClose,
  modalStationTarget,
  appointing,
  onConfirm,
}: AppointStationAgentModalProps) {
  if (!isOpen || !modalStationTarget) return null

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
          background: '#fff',
          borderRadius: 10,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
          <h3
            style={{
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 16,
              margin: 0,
            }}
          >
            Appoint polling station agent
          </h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              background: 'hsl(var(--container-low))',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <b
              style={{
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 14,
                display: 'block',
                marginBottom: 4,
              }}
            >
              {modalStationTarget.member_name}
            </b>
            <span
              style={{
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {modalStationTarget.registration_number}
              {modalStationTarget.constituency ? ` · ${modalStationTarget.constituency}` : ''}
            </span>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
              >
                location_on
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  letterSpacing: '.04em',
                  background: '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {modalStationTarget.polling_station_id}
              </span>
            </div>
          </div>
          <p
            style={{
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 20,
            }}
          >
            This member will be appointed as the movement's polling station agent for the above
            station on election day.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={onConfirm}
              disabled={appointing}
              style={{ opacity: appointing ? 0.5 : 1 }}
            >
              {appointing ? 'Appointing…' : 'Confirm appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
