import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { adminService, type AdminUser } from '@/services/adminService'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { auditService } from '@/services/auditService'
import type { AuditLogEntry, AdminRole, AdminPermission } from '@/types/admin'
import type { Member } from '@/types/admin'
import { motion, AnimatePresence } from 'framer-motion'

const ALL_ROLES: { value: AdminRole; label: string }[] = [
  { value: 'FOUNDER', label: 'Founder' },
  { value: 'ORGANIZER', label: 'Strategic Organizer' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'REGIONAL_DIRECTOR', label: 'Regional Director' },
  { value: 'CONSTITUENCY_LEAD', label: 'Constituency Lead' },
  { value: 'VERIFIER', label: 'Verifier' },
  { value: 'CHIEF_EDITOR', label: 'Chief Editor' },
  { value: 'SENIOR_EDITOR', label: 'Senior Editor' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'JUNIOR_EDITOR', label: 'Junior Editor' },
  { value: 'REGIONAL_CORRESPONDENT', label: 'Regional Correspondent' },
]

const REGIONAL_ROLES: AdminRole[] = ['REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD']

function defaultPermissions(role: AdminRole): AdminPermission[] {
  const all: AdminPermission[] = [
    { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
    { action: 'DELETE_MEMBER', resource: 'MEMBERS' },
    { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
    { action: 'MANAGE_POLLS', resource: 'POLLS' },
    { action: 'MANAGE_INVENTORY', resource: 'STORE' },
    { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
    { action: 'APPOINT_LEAD', resource: 'CHAPTERS' },
    { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
  ]
  switch (role) {
    case 'FOUNDER':
    case 'SUPER_ADMIN':
    case 'ORGANIZER':
      return all
    case 'REGIONAL_DIRECTOR':
      return all.filter((p) =>
        [
          'VERIFY_MEMBER',
          'MANAGE_CHAPTER',
          'MANAGE_POLLS',
          'VIEW_AUDIT_LOGS',
          'APPOINT_LEAD',
        ].includes(p.action)
      )
    case 'CONSTITUENCY_LEAD':
      return all.filter((p) => ['VERIFY_MEMBER', 'MANAGE_CHAPTER'].includes(p.action))
    case 'VERIFIER':
      return [{ action: 'VERIFY_MEMBER', resource: 'MEMBERS' }]
    case 'CHIEF_EDITOR':
    case 'SENIOR_EDITOR':
    case 'EDITOR':
    case 'JUNIOR_EDITOR':
      return [{ action: 'MANAGE_BLOGS', resource: 'BLOGS' }]
    case 'REGIONAL_CORRESPONDENT':
      return [
        { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
        { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      ]
    default:
      return []
  }
}

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

const isHighPrivilege = (role: string) => role === 'SUPER_ADMIN' || role === 'FOUNDER'

export default function Administrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Audit log modal
  const [selectedAdminLogs, setSelectedAdminLogs] = useState<AuditLogEntry[]>([])
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false)
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [activeAdminName, setActiveAdminName] = useState('')

  // Provision modal
  const [showProvision, setShowProvision] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberResults, setMemberResults] = useState<Member[]>([])
  const [isMemberSearching, setIsMemberSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [provisionRole, setProvisionRole] = useState<AdminRole>('VERIFIER')
  const [provisionRegion, setProvisionRegion] = useState('')
  const [isProvisioning, setIsProvisioning] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Edit modal
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<AdminRole>('VERIFIER')
  const [editRegion, setEditRegion] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const [data, regionData] = await Promise.all([
        adminService.getAdministrators(),
        adminService.getRegions(),
      ])
      setAdmins(data)
      setRegions(regionData.map((r: { name: string }) => r.name))
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

  useEffect(() => {
    fetchAdmins()
  }, [])

  // Debounced member search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (memberQuery.length < 2) {
      setMemberResults([])
      return
    }
    searchTimer.current = setTimeout(async () => {
      setIsMemberSearching(true)
      try {
        const results = await adminService.searchMembers(memberQuery, 'name')
        setMemberResults(results.slice(0, 8))
      } catch {
        setMemberResults([])
      } finally {
        setIsMemberSearching(false)
      }
    }, 300)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [memberQuery])

  const handleProvision = async () => {
    if (!selectedMember) return
    setIsProvisioning(true)
    try {
      const ok = await adminService.provisionAdministrator(
        selectedMember.id,
        provisionRole,
        defaultPermissions(provisionRole)
      )
      if (!ok) throw new Error('Provision failed')
      if (provisionRegion && REGIONAL_ROLES.includes(provisionRole)) {
        await adminService.updateAdminData(selectedMember.id, { assigned_region: provisionRegion })
      }
      toast.success(`${selectedMember.name} provisioned as ${formatRole(provisionRole)}`)
      setShowProvision(false)
      setSelectedMember(null)
      setMemberQuery('')
      setMemberResults([])
      setProvisionRole('VERIFIER')
      setProvisionRegion('')
      fetchAdmins()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to provision credentials')
    } finally {
      setIsProvisioning(false)
    }
  }

  const openEdit = (admin: AdminUser) => {
    setEditTarget(admin)
    setEditRole(admin.role)
    setEditRegion(admin.region || '')
    setOpenMenuId(null)
  }

  const handleEditSubmit = async () => {
    if (!editTarget) return
    setIsEditing(true)
    try {
      await adminService.updateAdminData(editTarget.id, {
        role: editRole,
        permissions: defaultPermissions(editRole),
        assigned_region: REGIONAL_ROLES.includes(editRole) ? editRegion || null : null,
      })
      toast.success('Admin credentials updated')
      setEditTarget(null)
      fetchAdmins()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsEditing(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setIsRevoking(true)
    try {
      const ok = await adminService.revokeAdministrator(revokeTarget.id)
      if (!ok) throw new Error('Revocation failed')
      toast.success(`Access revoked for ${revokeTarget.name}`)
      setRevokeTarget(null)
      fetchAdmins()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Revocation failed')
    } finally {
      setIsRevoking(false)
    }
  }

  const filteredAdmins = admins.filter((a) => {
    const term = searchTerm.toLowerCase()
    return (
      a.name?.toLowerCase().includes(term) ||
      a.id?.toLowerCase().includes(term) ||
      a.role?.toLowerCase().includes(term)
    )
  })

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
    fontWeight: 800,
    fontSize: 11,
    overflow: 'hidden',
    flexShrink: 0,
  })

  const thSt: React.CSSProperties = {
    padding: '11px 20px',
    textAlign: 'left',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 800,
    fontSize: 11,
    color: 'hsl(var(--on-surface-muted))',
    background: 'hsl(var(--container-low))',
    borderBottom: '1px solid hsl(var(--border))',
  }

  const tdSt: React.CSSProperties = {
    padding: '14px 20px',
    borderBottom: '1px solid hsl(var(--border))',
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 38,
    padding: '0 12px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--container-low))',
    outline: 'none',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
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
    fontWeight: 800,
    fontSize: 11,
    color: 'hsl(var(--on-surface-muted))',
    display: 'block',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page header */}
      <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          <div className="crumbs">Security · Personnel</div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              shield
            </span>
            Administrators
          </h2>
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <div className="bl">
              <div />
              <div />
              <div />
            </div>
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12.5,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Authorized personnel with leadership credentials and platform oversight.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowProvision(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              person_add
            </span>
            Provision Credentials
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpis" style={{ marginBottom: 0 }}>
        <TacticalKPI
          label="Total Admins"
          value={admins.length}
          variant="black"
          description="Authorized platform overseers"
          delta="▲ Stable"
        />
        <TacticalKPI
          label="Super Admins"
          value={admins.filter((a) => isHighPrivilege(a.role)).length}
          variant="red"
          description="Tier-1 security clearance"
          delta="High Risk"
        />
        <TacticalKPI
          label="Regional Leads"
          value={admins.filter((a) => a.role === 'REGIONAL_DIRECTOR').length}
          variant="gold"
          description="Zonal operations command"
          delta="Coordinated"
        />
        <TacticalKPI
          label="Security Status"
          value="Online"
          variant="green"
          description="Encrypted administrative link"
          trend={{ direction: 'up', value: 'Active' }}
        />
      </div>

      {/* Search */}
      <div className="panel">
        <div style={{ padding: '14px 20px' }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <label htmlFor="input-2deddd" style={{ display: 'none' }}>
              Filter by name, ID or role…
            </label>
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
              aria-label="Filter by name, ID or role…"
              name="searchTerm"
              id="input-2deddd"
              type="text"
              placeholder="Filter by name, ID or role…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                outline: 'none',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 4,
                boxSizing: 'border-box',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="panel desktop-only" style={{ overflow: 'visible' }}>
        <div className="ph">
          <span>Administrator roster</span>
          <span style={{ fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>
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
                      fontWeight: 800,
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
                              fontWeight: 800,
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
                              fontWeight: 700,
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
                            fontWeight: 800,
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
                            fontWeight: 700,
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
                            color: '#000',
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
                                background: '#fff',
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
                                    fontWeight: 800,
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
                                    fontWeight: 800,
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
                                    fontWeight: 800,
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

      {/* Mobile cards */}
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
              <div
                style={{ height: 36, background: 'hsl(var(--container-low))', borderRadius: 4 }}
              />
            </div>
          ))
        ) : filteredAdmins.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  <div>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
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
                        fontWeight: 700,
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '2px 0 0',
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
                      fontWeight: 800,
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
                    fontWeight: 800,
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
                      fontWeight: 800,
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
                  className="btn"
                  style={{
                    flex: 1,
                    background: 'hsl(var(--accent))',
                    color: '#000',
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
                  className="btn btn-outline"
                  style={{ justifyContent: 'center' }}
                  onClick={() => openEdit(admin)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    edit
                  </span>
                </button>
                <button
                  className="btn btn-dest"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setRevokeTarget(admin)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    block
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security advisory */}
      <div
        className="panel"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 20 }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
          >
            verified_user
          </span>
        </div>
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: '0 0 4px',
            }}
          >
            Security protocol
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Administrative access is governed by movement encryption standards. All actions within
            the command center are logged in the audit vault for transparency and security.
            Unauthorized access attempts will be intercepted.
          </p>
        </div>
      </div>

      {/* Dropdown backdrop */}
      {openMenuId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* ── Provision Credentials Modal ── */}
      <AnimatePresence>
        {showProvision &&
          createPortal(
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
                onClick={() => setShowProvision(false)}
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
                        fontWeight: 900,
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
                        fontWeight: 700,
                      }}
                    >
                      Appoint a member to an administrative role
                    </p>
                  </div>
                  <button
                    aria-label="Close"
                    onClick={() => setShowProvision(false)}
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

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Member search */}
                  <div>
                    <label style={labelSt}>Search member</label>
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
                              fontWeight: 800,
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
                                  fontWeight: 700,
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
                                    setMemberResults([])
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
                                      fontWeight: 800,
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
                    <label htmlFor="provision-role" style={labelSt}>
                      Role
                    </label>
                    <select
                      id="provision-role"
                      value={provisionRole}
                      onChange={(e) => setProvisionRole(e.target.value as AdminRole)}
                      style={selectSt}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Region — only for regional roles */}
                  {REGIONAL_ROLES.includes(provisionRole) && (
                    <div>
                      <label htmlFor="provision-region" style={labelSt}>
                        Assigned region
                      </label>
                      <select
                        id="provision-region"
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
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowProvision(false)}
                    style={{ minWidth: 80 }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: 140 }}
                    disabled={!selectedMember || isProvisioning}
                    onClick={handleProvision}
                  >
                    {isProvisioning ? 'Provisioning…' : 'Provision'}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>

      {/* ── Edit Permissions Modal ── */}
      <AnimatePresence>
        {editTarget &&
          createPortal(
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
                onClick={() => setEditTarget(null)}
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
                  maxWidth: 480,
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
                        fontWeight: 900,
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Edit Permissions
                    </h3>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontWeight: 700,
                      }}
                    >
                      {editTarget.name}
                    </p>
                  </div>
                  <button
                    aria-label="Close"
                    onClick={() => setEditTarget(null)}
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

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label htmlFor="edit-role" style={labelSt}>
                      Role
                    </label>
                    <select
                      id="edit-role"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as AdminRole)}
                      style={selectSt}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {REGIONAL_ROLES.includes(editRole) && (
                    <div>
                      <label htmlFor="edit-region" style={labelSt}>
                        Assigned region
                      </label>
                      <select
                        id="edit-region"
                        value={editRegion}
                        onChange={(e) => setEditRegion(e.target.value)}
                        style={selectSt}
                      >
                        <option value="">— None —</option>
                        {regions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Permissions will be reset to the defaults for the selected role.
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid hsl(var(--border))',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setEditTarget(null)}
                    style={{ minWidth: 80 }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: 120 }}
                    disabled={isEditing}
                    onClick={handleEditSubmit}
                  >
                    {isEditing ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>

      {/* ── Revoke Confirm Modal ── */}
      <AnimatePresence>
        {revokeTarget &&
          createPortal(
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
                onClick={() => setRevokeTarget(null)}
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
                  maxWidth: 420,
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
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 900,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--destructive))',
                    }}
                  >
                    Revoke Access
                  </h3>
                </div>
                <div style={{ padding: 24 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.6,
                    }}
                  >
                    Remove administrative credentials from <strong>{revokeTarget.name}</strong>?
                    They will lose all platform access immediately.
                  </p>
                </div>
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid hsl(var(--border))',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setRevokeTarget(null)}
                    style={{ minWidth: 80 }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-dest btn-sm"
                    style={{ minWidth: 120 }}
                    disabled={isRevoking}
                    onClick={handleRevoke}
                  >
                    {isRevoking ? 'Revoking…' : 'Revoke access'}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>

      {/* ── Audit Logs Modal ── */}
      <AnimatePresence>
        {isLogsModalOpen &&
          createPortal(
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
                onClick={() => setIsLogsModalOpen(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
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
                  maxWidth: 600,
                  background: '#fff',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 900,
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Administrative Audit Vault
                    </h3>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontWeight: 700,
                      }}
                    >
                      Activity logs for {activeAdminName}
                    </p>
                  </div>
                  <button
                    aria-label="Close activity logs"
                    onClick={() => setIsLogsModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--on-surface-muted))',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      close
                    </span>
                  </button>
                </div>

                <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
                  {isLogsLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          border: '3px solid hsl(var(--border))',
                          borderTopColor: 'hsl(var(--primary))',
                          borderRadius: '50%',
                          margin: '0 auto 16px',
                        }}
                        className="animate-spin"
                      />
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        Decrypting audit stream...
                      </p>
                    </div>
                  ) : selectedAdminLogs.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 48, color: 'hsl(var(--border))', marginBottom: 16 }}
                      >
                        history
                      </span>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        No recorded activity in the current epoch.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedAdminLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            padding: 16,
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 4,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                color: 'hsl(var(--primary))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {log.action}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: 'hsl(var(--on-surface-muted))',
                                fontWeight: 700,
                              }}
                            >
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            Resource:{' '}
                            <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                              {log.resource}
                            </span>
                          </p>
                          <div
                            style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background:
                                  log.status === 'Success'
                                    ? 'hsl(var(--primary))'
                                    : 'hsl(var(--destructive))',
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color:
                                  log.status === 'Success'
                                    ? 'hsl(var(--primary))'
                                    : 'hsl(var(--destructive))',
                              }}
                            >
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid hsl(var(--border))',
                    textAlign: 'right',
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <button
                    onClick={() => setIsLogsModalOpen(false)}
                    className="btn btn-sm btn-outline"
                    style={{ minWidth: 100 }}
                  >
                    Close Vault
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>
    </div>
  )
}
