import { useState, useEffect } from 'react'
import { adminService, type AdminUser } from '@/services/adminService'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { auditService } from '@/services/auditService'
import type { AuditLogEntry } from '@/types/admin'
import { motion, AnimatePresence } from 'framer-motion'

const formatRole = (role: string) =>
  role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

const isHighPrivilege = (role: string) =>
  role === 'SUPER_ADMIN' || role === 'FOUNDER'

export default function Administrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  const [selectedAdminLogs, setSelectedAdminLogs] = useState<AuditLogEntry[]>([])
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false)
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [activeAdminName, setActiveAdminName] = useState('')

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getAdministrators()
      setAdmins(data)
    } catch (err) {
      console.error('Failed to fetch admins:', err)
      toast.error('Failed to load administrative roster.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLogs = async (adminId: string, adminName: string) => {
    setIsLogsLoading(true)
    setActiveAdminName(adminName)
    setIsLogsModalOpen(true)
    try {
      const logs = await auditService.getAuditLogsForResource(adminId)
      setSelectedAdminLogs(logs)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
      toast.error('Could not retrieve audit history.')
    } finally {
      setIsLogsLoading(false)
    }
  }

  useEffect(() => { fetchAdmins() }, [])

  const filteredAdmins = admins.filter(a => {
    const term = searchTerm.toLowerCase()
    return (
      a.name?.toLowerCase().includes(term) ||
      a.id?.toLowerCase().includes(term) ||
      a.role?.toLowerCase().includes(term)
    )
  })

  const avatarSt = (role: string): React.CSSProperties => ({
    width: 38, height: 38, borderRadius: 4,
    background: isHighPrivilege(role) ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
    overflow: 'hidden', flexShrink: 0,
  })

  const thSt: React.CSSProperties = {
    padding: '11px 20px', textAlign: 'left',
    fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
    color: 'hsl(var(--on-surface-muted))',
    background: 'hsl(var(--container-low))',
    borderBottom: '1px solid hsl(var(--border))',
  }

  const tdSt: React.CSSProperties = {
    padding: '14px 20px',
    borderBottom: '1px solid hsl(var(--border))',
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          <div className="crumbs">Security · Personnel</div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shield</span>
            Administrators
          </h2>
          <div style={{ marginTop: 10, marginBottom: 4 }}><div className="bl"><div /><div /><div /></div></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: 'hsl(var(--on-surface-muted))', marginTop: 6, marginBottom: 0 }}>
            Authorized personnel with leadership credentials and platform oversight.
          </p>
        </div>
        <div className="actions">
          <button id="btn-provision-credentials" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            Provision Credentials
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpis" style={{ marginBottom: 0 }}>
        <TacticalKPI label="Total Admins" value={admins.length} variant="black" description="Authorized platform overseers" delta="▲ Stable" />
        <TacticalKPI label="Super Admins" value={admins.filter(a => isHighPrivilege(a.role)).length} variant="red" description="Tier-1 security clearance" delta="High Risk" />
        <TacticalKPI label="Regional Leads" value={admins.filter(a => a.role === 'REGIONAL_DIRECTOR').length} variant="gold" description="Zonal operations command" delta="Coordinated" />
        <TacticalKPI label="Security Status" value="Online" variant="green" description="Encrypted administrative link" trend={{ direction: 'up', value: 'Active' }} />
      </div>

      {/* Search */}
      <div className="panel">
        <div style={{ padding: '14px 20px' }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <label htmlFor="input-2deddd" style={{ display: 'none' }}>Filter by name, ID or role…</label>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
            <input aria-label="Filter by name, ID or role…" name="searchTerm" id="input-2deddd"
              type="text"
              placeholder="Filter by name, ID or role…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 38, paddingLeft: 34, paddingRight: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, boxSizing: 'border-box', color: 'hsl(var(--on-surface))' }}
            />
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="panel desktop-only" style={{ overflow: 'visible' }}>
        <div className="ph">
          <span>Administrator roster</span>
          <span style={{ fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>{filteredAdmins.length} records active</span>
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
                    <td style={tdSt}><div style={{ height: 38, background: 'hsl(var(--container-low))', borderRadius: 4, width: 200 }} /></td>
                    <td style={tdSt}><div style={{ height: 20, background: 'hsl(var(--container-low))', borderRadius: 4, width: 100 }} /></td>
                    <td style={tdSt}><div style={{ height: 16, background: 'hsl(var(--container-low))', borderRadius: 4, width: 120 }} /></td>
                    <td style={tdSt}><div style={{ height: 32, background: 'hsl(var(--container-low))', borderRadius: 4, width: 72, marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...tdSt, textAlign: 'center', padding: '40px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    No authorized personnel found.
                  </td>
                </tr>
              ) : filteredAdmins.map(admin => (
                <tr key={admin.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={avatarSt(admin.role)}>
                        {admin.avatarUrl
                          ? <img src={admin.avatarUrl} alt={admin.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" crossOrigin="anonymous" />
                          : admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', margin: 0 }}>{admin.name}</p>
                        <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>{admin.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: isHighPrivilege(admin.role) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                        {isHighPrivilege(admin.role) ? 'gpp_bad' : 'verified_user'}
                      </span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: isHighPrivilege(admin.role) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                        {formatRole(admin.role)}
                      </span>
                    </div>
                  </td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>location_on</span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>{admin.region || 'National HQ'}</span>
                    </div>
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'hsl(var(--accent))', color: '#000', border: 'none' }}
                        title="Activity logs"
                        onClick={() => fetchLogs(admin.id, admin.name)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setOpenMenuId(openMenuId === admin.id ? null : admin.id)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>more_horiz</span>
                        </button>
                        {openMenuId === admin.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, zIndex: 50, minWidth: 172, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
                            <div style={{ padding: '4px 0' }}>
                              <button style={{ display: 'block', width: '100%', padding: '9px 16px', textAlign: 'left', background: 'none', border: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, cursor: 'pointer', color: 'hsl(var(--on-surface))' }}>
                                Edit permissions
                              </button>
                              <button 
                                onClick={() => {
                                  setOpenMenuId(null)
                                  fetchLogs(admin.id, admin.name)
                                }}
                                style={{ display: 'block', width: '100%', padding: '9px 16px', textAlign: 'left', background: 'none', border: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, cursor: 'pointer', color: 'hsl(var(--on-surface))' }}
                              >
                                Activity logs
                              </button>
                              <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid hsl(var(--border))' }} />
                              <button style={{ display: 'block', width: '100%', padding: '9px 16px', textAlign: 'left', background: 'none', border: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, cursor: 'pointer', color: 'hsl(var(--destructive))' }}>
                                Revoke access
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 4, background: 'hsl(var(--container-low))' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ height: 14, background: 'hsl(var(--container-low))', borderRadius: 2, width: '60%' }} />
                  <div style={{ height: 11, background: 'hsl(var(--container-low))', borderRadius: 2, width: '40%' }} />
                </div>
              </div>
              <div style={{ height: 36, background: 'hsl(var(--container-low))', borderRadius: 4 }} />
            </div>
          ))
        ) : filteredAdmins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            No authorized personnel found.
          </div>
        ) : filteredAdmins.map(admin => (
          <div key={admin.id} className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...avatarSt(admin.role), width: 44, height: 44, fontSize: 13 }}>
                  {admin.avatarUrl
                    ? <img src={admin.avatarUrl} alt={admin.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" crossOrigin="anonymous" />
                    : admin.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', margin: 0 }}>{admin.name}</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>{admin.id}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 20, flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: isHighPrivilege(admin.role) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                  {isHighPrivilege(admin.role) ? 'gpp_bad' : 'verified_user'}
                </span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: isHighPrivilege(admin.role) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                  {formatRole(admin.role)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Region</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>location_on</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface))' }}>{admin.region || 'National HQ'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'hsl(var(--accent))', color: '#000', border: 'none', justifyContent: 'center' }}
                onClick={() => fetchLogs(admin.id, admin.name)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
                Activity
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock</span>
              </button>
              <button className="btn btn-dest" style={{ justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>block</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Security advisory */}
      <div className="panel" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 20 }}>
        <div style={{ width: 44, height: 44, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--primary))' }}>verified_user</span>
        </div>
        <div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', margin: '0 0 4px' }}>Security protocol</p>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65, margin: 0 }}>
            Administrative access is governed by movement encryption standards. All actions within the command center are logged in the audit vault for transparency and security. Unauthorized access attempts will be intercepted.
          </p>
        </div>
      </div>

      {/* Dropdown backdrop */}
      {openMenuId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenMenuId(null)} />
      )}

      {/* Logs Modal */}
      <AnimatePresence>
        {isLogsModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', width: '100%', maxWidth: 600, background: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--container-low))' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Audit Vault</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>Activity logs for {activeAdminName}</p>
                </div>
                <button aria-label="Close activity logs" onClick={() => setIsLogsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>

              <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
                {isLogsLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin" />
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>Decrypting audit stream...</p>
                  </div>
                ) : selectedAdminLogs.length === 0 ? (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))', marginBottom: 16 }}>history</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>No recorded activity in the current epoch.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedAdminLogs.map((log) => (
                      <div key={log.id} style={{ padding: 16, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{log.action}</span>
                          <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface))' }}>
                          Resource: <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{log.resource}</span>
                        </p>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: log.status === 'Success' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: log.status === 'Success' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>{log.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid hsl(var(--border))', textAlign: 'right', background: 'hsl(var(--container-low))' }}>
                <button 
                  onClick={() => setIsLogsModalOpen(false)}
                  className="btn btn-sm btn-outline"
                  style={{ minWidth: 100 }}
                >
                  Close Vault
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
