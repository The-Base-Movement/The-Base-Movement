import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { Member } from '@/types/admin'

const REGIONAL_ROLES: string[] = ['REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD']

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 4,
  boxSizing: 'border-box',
  color: 'hsl(var(--on-surface))',
}

const selectSt: React.CSSProperties = {
  ...inputSt,
  cursor: 'pointer',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

interface ProvisionModalProps {
  onClose: () => void
  memberQuery: string
  setMemberQuery: (q: string) => void
  memberResults: Member[]
  isMemberSearching: boolean
  selectedMember: Member | null
  setSelectedMember: (m: Member | null) => void
  provisionRole: string
  setProvisionRole: (r: string) => void
  provisionRegion: string
  setProvisionRegion: (reg: string) => void
  regions: string[]
  roles: { value: string; label: string }[]
  isProvisioning: boolean
  handleProvision: () => Promise<void>
}

export function ProvisionModal({
  onClose,
  memberQuery,
  setMemberQuery,
  memberResults,
  isMemberSearching,
  selectedMember,
  setSelectedMember,
  provisionRole,
  setProvisionRole,
  provisionRegion,
  setProvisionRegion,
  regions,
  roles,
  isProvisioning,
  handleProvision,
}: ProvisionModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Provision Credentials
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontWeight: 'var(--font-weight-normal, 400)',
              }}
            >
              Appoint a member to an administrative role
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 130px)',
          }}
        >
          {/* Member search */}
          <div>
            <label htmlFor="provision-member-search" style={labelSt}>
              Search member
            </label>
            {selectedMember ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: '1px solid hsl(var(--primary))',
                  borderRadius: 4,
                  background: 'hsl(var(--container-low))',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {selectedMember.name}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {selectedMember.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedMember(null)
                    setMemberQuery('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    close
                  </span>
                </button>
              </div>
            ) : (
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
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  id="provision-member-search"
                  name="memberSearch"
                  aria-label="Search member by name"
                  type="text"
                  placeholder="Type a member name…"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  style={{ ...inputSt, paddingLeft: 34 }}
                  autoFocus
                />
                {(memberResults.length > 0 || isMemberSearching) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      zIndex: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {isMemberSearching ? (
                      <div
                        style={{
                          padding: '12px 16px',
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        Searching…
                      </div>
                    ) : (
                      memberResults.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMember(m)
                            setMemberQuery('')
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            borderBottom: '1px solid hsl(var(--border))',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container-low))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-semibold, 600)',
                              fontSize: 12.5,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {m.name}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontFamily: 'monospace',
                              fontSize: 10,
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {m.constituency || m.country || m.region}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label id="provision-role-label" style={labelSt}>
              Role
            </label>
            <div
              role="listbox"
              aria-labelledby="provision-role-label"
              style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                maxHeight: 210,
                overflowY: 'auto',
                background: '#fff',
              }}
            >
              {roles.map((r, i) => {
                const isSelected = provisionRole === r.value
                return (
                  <div
                    key={r.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => setProvisionRole(r.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setProvisionRole(r.value)}
                    style={{
                      padding: '9px 12px',
                      cursor: 'pointer',
                      borderBottom: i < roles.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      background: isSelected ? 'hsl(var(--primary))' : 'transparent',
                      color: isSelected ? '#fff' : 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: isSelected
                        ? 'var(--font-weight-semibold, 600)'
                        : 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {isSelected && (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, flexShrink: 0 }}
                      >
                        check
                      </span>
                    )}
                    {r.label}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Region — only for regional roles */}
          {REGIONAL_ROLES.includes(provisionRole) && (
            <div>
              <label htmlFor="provision-region" style={labelSt}>
                Assigned region
              </label>
              <select
                id="provision-region"
                name="provisionRegion"
                value={provisionRegion}
                onChange={(e) => setProvisionRegion(e.target.value)}
                style={selectSt}
              >
                <option value="">— Select region —</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={!selectedMember || isProvisioning}
            onClick={handleProvision}
          >
            {isProvisioning ? 'Provisioning…' : 'Provision'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
export default ProvisionModal
