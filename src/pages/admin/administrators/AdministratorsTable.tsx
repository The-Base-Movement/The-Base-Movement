import { type AdminUser } from '@/services/adminService'

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

const isHighPrivilege = (role: string) => role === 'SUPER_ADMIN' || role === 'FOUNDER'

const avatarSt = (role: string): React.CSSProperties => ({
  width: 38,
  height: 38,
  borderRadius: 4,
  background: isHighPrivilege(role) ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  overflow: 'hidden',
  flexShrink: 0,
})

const thSt: React.CSSProperties = {
  padding: '11px 20px',
  textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  background: 'hsl(var(--container-low))',
  borderBottom: '1px solid hsl(var(--border))',
}

const tdSt: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid hsl(var(--border))',
}

interface AdministratorsTableProps {
  filteredAdmins: AdminUser[]
  isLoading: boolean
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  fetchLogs: (id: string, name: string) => void
  openEdit: (admin: AdminUser) => void
  setRevokeTarget: (admin: AdminUser | null) => void
}

export function AdministratorsTable({
  filteredAdmins,
  isLoading,
  openMenuId,
  setOpenMenuId,
  fetchLogs,
  openEdit,
  setRevokeTarget,
}: AdministratorsTableProps) {
  return (
    <div className="panel desktop-only" style={{ overflow: 'visible' }}>
      <div className="ph">
        <span>Administrator roster</span>
        <span
          style={{
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {filteredAdmins.length} records active
        </span>
      </div>
      <div style={{ overflowX: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thSt}>Administrator</th>
              <th style={thSt}>Access level</th>
              <th style={thSt}>Region</th>
              <th style={{ ...thSt, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td style={tdSt}>
                    <div
                      style={{
                        height: 38,
                        background: 'hsl(var(--container-low))',
                        borderRadius: 4,
                        width: 200,
                      }}
                    />
                  </td>
                  <td style={tdSt}>
                    <div
                      style={{
                        height: 20,
                        background: 'hsl(var(--container-low))',
                        borderRadius: 4,
                        width: 100,
                      }}
                    />
                  </td>
                  <td style={tdSt}>
                    <div
                      style={{
                        height: 16,
                        background: 'hsl(var(--container-low))',
                        borderRadius: 4,
                        width: 120,
                      }}
                    />
                  </td>
                  <td style={tdSt}>
                    <div
                      style={{
                        height: 32,
                        background: 'hsl(var(--container-low))',
                        borderRadius: 4,
                        width: 72,
                        marginLeft: 'auto',
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : filteredAdmins.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    ...tdSt,
                    textAlign: 'center',
                    padding: '40px 20px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  No authorized personnel found.
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={avatarSt(admin.role)}>
                        {admin.avatarUrl ? (
                          <img
                            src={admin.avatarUrl}
                            alt={admin.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            decoding="async"
                            loading="lazy"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          admin.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            margin: 0,
                          }}
                        >
                          {admin.name}
                        </p>
                        <p
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 'var(--font-weight-normal, 400)',
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: '2px 0 0',
                          }}
                        >
                          {admin.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 14,
                          color: isHighPrivilege(admin.role)
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--primary))',
                        }}
                      >
                        {isHighPrivilege(admin.role) ? 'gpp_bad' : 'verified_user'}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11,
                          color: isHighPrivilege(admin.role)
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--primary))',
                        }}
                      >
                        {formatRole(admin.role)}
                      </span>
                    </div>
                  </td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
                      >
                        location_on
                      </span>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {admin.region || 'National HQ'}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}
                    >
                      <button
                        className="btn btn-sm"
                        style={{
                          background: 'hsl(var(--accent))',
                          color: 'hsl(var(--on-surface))',
                          border: 'none',
                        }}
                        title="Activity logs"
                        onClick={() => fetchLogs(admin.id, admin.name)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          bolt
                        </span>
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setOpenMenuId(openMenuId === admin.id ? null : admin.id)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            more_horiz
                          </span>
                        </button>
                        {openMenuId === admin.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 4px)',
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 4,
                              zIndex: 50,
                              minWidth: 172,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                            }}
                          >
                            <div style={{ padding: '4px 0' }}>
                              <button
                                onClick={() => openEdit(admin)}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '9px 16px',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  color: 'hsl(var(--on-surface))',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = 'hsl(var(--container-low))')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                Edit permissions
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  fetchLogs(admin.id, admin.name)
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '9px 16px',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  color: 'hsl(var(--on-surface))',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = 'hsl(var(--container-low))')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                Activity logs
                              </button>
                              <hr
                                style={{
                                  margin: '4px 0',
                                  border: 'none',
                                  borderTop: '1px solid hsl(var(--border))',
                                }}
                              />
                              <button
                                onClick={() => {
                                  setRevokeTarget(admin)
                                  setOpenMenuId(null)
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '9px 16px',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  color: 'hsl(var(--destructive))',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = 'hsl(var(--container-low))')
                                }
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                Revoke access
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default AdministratorsTable
