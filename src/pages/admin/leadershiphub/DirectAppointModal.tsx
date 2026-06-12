import { createPortal } from 'react-dom'
import type { Member, Chapter } from '@/types/admin'

interface DirectAppointModalProps {
  isOpen: boolean
  onClose: () => void
  appointLoading: boolean
  appointSearch: string
  setAppointSearch: (val: string) => void
  appointMembers: Member[]
  selectedMember: Member | null
  setSelectedMember: (m: Member | null) => void
  appointChapters: Chapter[]
  selectedChapterId: string
  setSelectedChapterId: (id: string) => void
  appointRole: string
  setAppointRole: (role: string) => void
  isAppointing: boolean
  onConfirmAppoint: () => Promise<void>
}

export function DirectAppointModal({
  isOpen,
  onClose,
  appointLoading,
  appointSearch,
  setAppointSearch,
  appointMembers,
  selectedMember,
  setSelectedMember,
  appointChapters,
  selectedChapterId,
  setSelectedChapterId,
  appointRole,
  setAppointRole,
  isAppointing,
  onConfirmAppoint,
}: DirectAppointModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
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
          width: '100%',
          maxWidth: 520,
          background: 'hsl(var(--surface))',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            background: 'hsl(var(--container-low))',
            borderTop: '4px solid hsl(var(--primary))',
          }}
        >
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 15,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Direct Appoint
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '3px 0 0',
              fontWeight: 'var(--font-weight-normal, 400)',
            }}
          >
            Select a verified member and assign them to a chapter role.
          </p>
        </div>

        <div
          style={{
            padding: 20,
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {appointLoading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
              }}
            >
              Loading members…
            </div>
          ) : (
            <>
              {/* Member search + list */}
              <div>
                <label
                  htmlFor="appoint-member-search"
                  style={{
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Select member
                </label>
                <input
                  aria-label="Search by name, region, reg. ID, or phone…"
                  id="appoint-member-search"
                  name="appointSearch"
                  type="text"
                  placeholder="Search by name, region, reg. ID, or phone…"
                  value={appointSearch}
                  onChange={(e) => setAppointSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {appointMembers
                    .filter((m) => {
                      const q = appointSearch.toLowerCase()
                      return (
                        !q ||
                        m.name.toLowerCase().includes(q) ||
                        (m.region || '').toLowerCase().includes(q) ||
                        m.id.toLowerCase().includes(q) ||
                        (m.phone || '').toLowerCase().includes(q)
                      )
                    })
                    .slice(0, 20)
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          borderBottom: '1px solid hsl(var(--border))',
                          background:
                            selectedMember?.id === m.id ? 'hsla(var(--primary), 0.06)' : '#fff',
                          borderLeft:
                            selectedMember?.id === m.id
                              ? '3px solid hsl(var(--primary))'
                              : '3px solid transparent',
                          transition: 'all 0.1s',
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 4,
                            background: 'hsl(var(--container-low))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12,
                            flexShrink: 0,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                          ) : (
                            m.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {m.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 10,
                              fontWeight: 'var(--font-weight-normal, 400)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {m.id}
                            {m.phone && m.phone !== 'N/A' ? ` · ${m.phone}` : ''}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 10,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {m.region}
                            {m.constituency ? ` · ${m.constituency}` : ''}
                          </p>
                        </div>
                        <span
                          className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : 'pill-warn'}`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))}
                  {appointMembers.filter((m) => {
                    const q = appointSearch.toLowerCase()
                    return (
                      !q ||
                      m.name.toLowerCase().includes(q) ||
                      (m.region || '').toLowerCase().includes(q) ||
                      m.id.toLowerCase().includes(q) ||
                      (m.phone || '').toLowerCase().includes(q)
                    )
                  }).length === 0 && (
                    <p
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                      }}
                    >
                      No members found.
                    </p>
                  )}
                </div>
              </div>

              {/* Chapter + role selects */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                <div>
                  <label
                    htmlFor="appoint-chapter-select"
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Chapter
                  </label>
                  {appointChapters.length === 0 ? (
                    <div
                      style={{
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 12,
                        color: 'hsl(var(--destructive))',
                        fontWeight: 'var(--font-weight-medium, 500)',
                      }}
                    >
                      No chapters found
                    </div>
                  ) : (
                    <select
                      id="appoint-chapter-select"
                      name="selectedChapterId"
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 13,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        background: 'hsl(var(--surface))',
                        color: 'hsl(var(--on-surface))',
                        boxSizing: 'border-box',
                      }}
                    >
                      {appointChapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="appoint-role-select"
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Role
                  </label>
                  <select
                    id="appoint-role-select"
                    name="appointRole"
                    value={appointRole}
                    onChange={(e) => setAppointRole(e.target.value)}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 10px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option>Chapter Leader</option>
                    <option>Deputy Leader</option>
                    <option>Secretary</option>
                    <option>Treasurer</option>
                  </select>
                </div>
              </div>

              {/* Selected member preview */}
              {selectedMember && (
                <div
                  style={{
                    background: 'hsla(var(--primary), 0.06)',
                    border: '1px solid hsla(var(--primary), 0.2)',
                    borderRadius: 4,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                  >
                    check_circle
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    <span style={{ fontWeight: 'var(--font-weight-semibold, 600)' }}>
                      {selectedMember.name}
                    </span>{' '}
                    will be appointed as{' '}
                    <span style={{ fontWeight: 'var(--font-weight-semibold, 600)' }}>
                      {appointRole}
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, height: 42 }}>
            Cancel
          </button>
          <button
            onClick={onConfirmAppoint}
            disabled={!selectedMember || !selectedChapterId || isAppointing}
            className="btn btn-primary"
            style={{ flex: 1, height: 42 }}
          >
            {isAppointing ? (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
              >
                sync
              </span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                how_to_reg
              </span>
            )}
            {isAppointing ? 'Appointing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
