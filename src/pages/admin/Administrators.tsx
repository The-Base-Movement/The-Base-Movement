import { useState, useEffect, useRef } from 'react'
import { adminService, type AdminUser } from '@/services/adminService'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { auditService } from '@/services/auditService'
import type { AuditLogEntry, AdminRole, AdminPermission } from '@/types/admin'
import type { Member } from '@/types/admin'

// Subcomponents
import { AdministratorsTable } from './administrators/AdministratorsTable'
import { AdministratorsMobileCards } from './administrators/AdministratorsMobileCards'
import { ProvisionModal } from './administrators/ProvisionModal'
import { EditPermissionsModal } from './administrators/EditPermissionsModal'
import { RevokeConfirmModal } from './administrators/RevokeConfirmModal'
import { AuditLogsModal } from './administrators/AuditLogsModal'

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
      <AdministratorsTable
        filteredAdmins={filteredAdmins}
        isLoading={isLoading}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        fetchLogs={fetchLogs}
        openEdit={openEdit}
        setRevokeTarget={setRevokeTarget}
      />

      {/* Mobile cards */}
      <AdministratorsMobileCards
        filteredAdmins={filteredAdmins}
        isLoading={isLoading}
        fetchLogs={fetchLogs}
        openEdit={openEdit}
        setRevokeTarget={setRevokeTarget}
      />

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

      {/* Provision Credentials Modal */}
      {showProvision && (
        <ProvisionModal
          onClose={() => setShowProvision(false)}
          memberQuery={memberQuery}
          setMemberQuery={setMemberQuery}
          memberResults={memberResults}
          isMemberSearching={isMemberSearching}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          provisionRole={provisionRole}
          setProvisionRole={setProvisionRole}
          provisionRegion={provisionRegion}
          setProvisionRegion={setProvisionRegion}
          regions={regions}
          isProvisioning={isProvisioning}
          handleProvision={handleProvision}
        />
      )}

      {/* Edit Permissions Modal */}
      {editTarget && (
        <EditPermissionsModal
          editTarget={editTarget}
          onClose={() => setEditTarget(null)}
          editRole={editRole}
          setEditRole={setEditRole}
          editRegion={editRegion}
          setEditRegion={setEditRegion}
          regions={regions}
          isEditing={isEditing}
          handleEditSubmit={handleEditSubmit}
        />
      )}

      {/* Revoke Confirm Modal */}
      {revokeTarget && (
        <RevokeConfirmModal
          revokeTarget={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          isRevoking={isRevoking}
          handleRevoke={handleRevoke}
        />
      )}

      {/* Audit Logs Modal */}
      {isLogsModalOpen && (
        <AuditLogsModal
          onClose={() => setIsLogsModalOpen(false)}
          activeAdminName={activeAdminName}
          isLogsLoading={isLogsLoading}
          selectedAdminLogs={selectedAdminLogs}
        />
      )}
    </div>
  )
}
