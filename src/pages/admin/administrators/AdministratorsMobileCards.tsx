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

interface AdministratorsMobileCardsProps {
  filteredAdmins: AdminUser[]
  isLoading: boolean
  fetchLogs: (id: string, name: string) => void
  openEdit: (admin: AdminUser) => void
  setRevokeTarget: (admin: AdminUser | null) => void
}

export function AdministratorsMobileCards({
  filteredAdmins,
  isLoading,
  fetchLogs,
  openEdit,
  setRevokeTarget,
}: AdministratorsMobileCardsProps) {
  return (
    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  background: 'hsl(var(--container-low))',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div
                  style={{
                    height: 14,
                    background: 'hsl(var(--container-low))',
                    borderRadius: 2,
                    width: '60%',
                  }}
                />
                <div
                  style={{
                    height: 11,
                    background: 'hsl(var(--container-low))',
                    borderRadius: 2,
                    width: '40%',
                  }}
                />
              </div>
            </div>
            <div style={{ height: 36, background: 'hsl(var(--container-low))', borderRadius: 4 }} />
          </div>
        ))
      ) : filteredAdmins.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          No authorized personnel found.
        </div>
      ) : (
        filteredAdmins.map((admin) => (
          <div key={admin.id} className="panel" style={{ padding: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <div style={{ ...avatarSt(admin.role), width: 44, height: 44, fontSize: 13 }}>
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
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {admin.id}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 20,
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 12,
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
                    fontSize: 10,
                    color: isHighPrivilege(admin.role)
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--primary))',
                  }}
                >
                  {formatRole(admin.role)}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Region
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}
                >
                  location_on
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {admin.region || 'National HQ'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: 'hsl(var(--accent))',
                  color: 'hsl(var(--on-surface))',
                  border: 'none',
                  justifyContent: 'center',
                }}
                onClick={() => fetchLogs(admin.id, admin.name)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  bolt
                </span>
                Activity
              </button>
              <button
                className="btn btn-outline btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => openEdit(admin)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  edit
                </span>
                Edit
              </button>
              <button
                className="btn btn-dest btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRevokeTarget(admin)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  block
                </span>
                Revoke
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
export default AdministratorsMobileCards
