import { createPortal } from 'react-dom'

interface ConstituencyMember {
  id: string
  full_name: string
  registration_number: string
  constituency: string
  region: string | null
  chapter: string | null
  polling_station_id: string | null
  registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER' | null
}

interface AppointFieldAgentModalProps {
  isOpen: boolean
  onClose: () => void
  modalSelectedMember: ConstituencyMember | null
  setModalSelectedMember: (val: ConstituencyMember | null) => void
  modalMemberSearch: string
  setModalMemberSearch: (val: string) => void
  modalMemberResults: ConstituencyMember[]
  modalConstituency: string
  setModalConstituency: (val: string) => void
  appointing: boolean
  onConfirm: () => Promise<void>
}

export function AppointFieldAgentModal({
  isOpen,
  onClose,
  modalSelectedMember,
  setModalSelectedMember,
  modalMemberSearch,
  setModalMemberSearch,
  modalMemberResults,
  modalConstituency,
  setModalConstituency,
  appointing,
  onConfirm,
}: AppointFieldAgentModalProps) {
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
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 10,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                margin: 0,
              }}
            >
              Appoint field agent
            </h3>
            <p
              style={{
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: '4px 0 0',
              }}
            >
              Search a member and assign them to a constituency.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
            >
              close
            </span>
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {/* Member search */}
          <label
            style={{
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Member
          </label>
          {modalSelectedMember ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                border: '1px solid hsl(var(--primary))',
                borderRadius: 6,
                marginBottom: 14,
                background: 'rgba(0,107,63,.04)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'hsl(var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: "'Public Sans'",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                }}
              >
                {modalSelectedMember.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <b
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                  }}
                >
                  {modalSelectedMember.full_name}
                </b>
                <span
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                  }}
                >
                  {modalSelectedMember.registration_number}
                </span>
              </div>
              <button
                onClick={() => setModalSelectedMember(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                >
                  close
                </span>
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  search
                </span>
                <input
                  id="field-agent-search"
                  name="modalMemberSearch"
                  autoFocus
                  aria-label="Search member by name or registration number"
                  value={modalMemberSearch}
                  onChange={(e) => setModalMemberSearch(e.target.value)}
                  placeholder="Search by name or reg number…"
                  style={{
                    width: '100%',
                    paddingLeft: 34,
                    paddingRight: 12,
                    height: 38,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontFamily: "'Public Sans'",
                    fontSize: 12.5,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
              {modalMemberResults.length > 0 && (
                <div
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    marginTop: 4,
                    overflow: 'hidden',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {modalMemberResults.map((m, i) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setModalSelectedMember(m)
                        setModalConstituency(m.constituency)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom:
                          i < modalMemberResults.length - 1
                            ? '1px solid hsl(var(--border))'
                            : 'none',
                        background: 'hsl(var(--card))',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'hsl(var(--container-low))')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: 'hsl(var(--container-low))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'Public Sans'",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                      >
                        {m.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <b
                          style={{
                            fontFamily: "'Public Sans'",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12.5,
                          }}
                        >
                          {m.full_name}
                        </b>
                        <span
                          style={{
                            fontFamily: "'Public Sans'",
                            fontWeight: 'var(--font-weight-normal, 400)',
                            fontSize: 10.5,
                            color: 'hsl(var(--on-surface-muted))',
                            display: 'block',
                          }}
                        >
                          {m.registration_number} · {m.constituency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Constituency */}
          <label
            htmlFor="ggc-modal-constituency"
            style={{
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Constituency
          </label>
          <input
            id="ggc-modal-constituency"
            name="modalConstituency"
            value={modalConstituency}
            onChange={(e) => setModalConstituency(e.target.value)}
            placeholder="e.g. Ablekuma Central"
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              fontFamily: "'Public Sans'",
              fontSize: 12.5,
              fontWeight: 'var(--font-weight-medium, 500)',
              boxSizing: 'border-box',
              outline: 'none',
              marginBottom: 20,
            }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={onConfirm}
              disabled={appointing || !modalSelectedMember || !modalConstituency.trim()}
              style={{
                opacity: appointing || !modalSelectedMember || !modalConstituency.trim() ? 0.5 : 1,
              }}
            >
              {appointing ? 'Appointing…' : 'Appoint field agent'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
