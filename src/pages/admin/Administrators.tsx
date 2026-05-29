import { useState, useEffect, useRef } from 'react'
import { adminService, type AdminUser } from '@/services/adminService'
import { toast } from 'sonner'
import { auditService } from '@/services/auditService'
import { roleService, type AdminRoleRecord } from '@/services/roleService'
import type { AuditLogEntry, AdminRole } from '@/types/admin'
import type { Member } from '@/types/admin'

// Subcomponents
import { AdministratorsTable } from './administrators/AdministratorsTable'
import { AdministratorsMobileCards } from './administrators/AdministratorsMobileCards'
import { ProvisionModal } from './administrators/ProvisionModal'
import { EditPermissionsModal } from './administrators/EditPermissionsModal'
import { RevokeConfirmModal } from './administrators/RevokeConfirmModal'
import { AuditLogsModal } from './administrators/AuditLogsModal'
import { AdminsHeader } from './administrators/AdminsHeader'
import { AdminsKPIs } from './administrators/AdminsKPIs'
import { AdminsSearchBar } from './administrators/AdminsSearchBar'
import { AdminsSecurityNote } from './administrators/AdminsSecurityNote'

const REGIONAL_ROLES: string[] = ['REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD']

const formatRole = (role: string) =>
  role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

export default function Administrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [roleList, setRoleList] = useState<AdminRoleRecord[]>([])
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
  const [provisionRole, setProvisionRole] = useState<string>('VERIFIER')
  const [provisionRegion, setProvisionRegion] = useState('')
  const [isProvisioning, setIsProvisioning] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Edit modal
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<string>('VERIFIER')
  const [editRegion, setEditRegion] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const [data, regionData, roles] = await Promise.all([
        adminService.getAdministrators(),
        adminService.getRegions(),
        roleService.getRoles(),
      ])
      setAdmins(data)
      setRegions(regionData.map((r: { name: string }) => r.name))
      setRoleList(roles)
    } catch (err) {
      console.error('Failed to fetch admins:', err)
      toast.error('Failed to load administrative roster.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPermsForRole = (roleName: string) =>
    roleList.find((r) => r.name === roleName)?.permissions ?? []

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
    const memberId = selectedMember.authId ?? selectedMember.id
    setIsProvisioning(true)
    try {
      const ok = await adminService.provisionAdministrator(
        memberId,
        provisionRole as AdminRole,
        getPermsForRole(provisionRole)
      )
      if (!ok) throw new Error('Provision failed')
      if (provisionRegion && REGIONAL_ROLES.includes(provisionRole)) {
        await adminService.updateAdminData(memberId, { assigned_region: provisionRegion })
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
        role: editRole as AdminRole,
        permissions: getPermsForRole(editRole),
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
      <AdminsHeader onProvision={() => setShowProvision(true)} />

      <AdminsKPIs admins={admins} />

      <AdminsSearchBar searchTerm={searchTerm} onChange={setSearchTerm} />

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

      <AdminsSecurityNote />

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
          roles={roleList.map((r) => ({ value: r.name, label: formatRole(r.name) }))}
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
          roles={roleList.map((r) => ({ value: r.name, label: formatRole(r.name) }))}
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
