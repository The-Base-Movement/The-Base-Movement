import { useState } from 'react'
import { usePerformance } from '@/context/PerformanceContext'
import { memberService } from '@/services/memberService'
import { AuditModal } from './members/AuditModal'
import { AssignmentModal } from './members/AssignmentModal'
import { DeleteModal } from './members/DeleteModal'
import { VerifyModal } from './members/VerifyModal'
import { MembersTable } from './members/MembersTable'
import { MembersHeader } from './members/MembersHeader'
import { MembersKPIs } from './members/MembersKPIs'
import { MembersFilterBar } from './members/MembersFilterBar'
import { MembersBulkBar } from './members/MembersBulkBar'
import { RegistrationOverlay } from './members/RegistrationOverlay'
import { ImportCSVOverlay } from './members/ImportCSVOverlay'
import { useMembersData } from './members/useMembersData'
import { useMembersActions } from './members/useMembersActions'

export default function MembersList() {
  const { lowBandwidthMode } = usePerformance()
  const [isImportingCSV, setIsImportingCSV] = useState(false)
  const [isSyncingSendGrid, setIsSyncingSendGrid] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  async function handleSyncSendGrid() {
    setIsSyncingSendGrid(true)
    setSyncResult(null)
    try {
      const { total, batches } = await memberService.syncSendgridBulk()
      setSyncResult(
        `✓ ${total.toLocaleString()} members synced across ${batches} batch${batches !== 1 ? 'es' : ''}.`
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSyncResult(`✗ Sync failed: ${msg}`)
    } finally {
      setIsSyncingSendGrid(false)
    }
  }

  const {
    members,
    isLoading,
    totalMembers,
    currentPage,
    itemsPerPage,
    totalPages,
    searchTerm,
    searchType,
    sourceFilter,
    genderFilter,
    ageRangeFilter,
    sortOrder,
    setSortOrder,
    stats,
    fetchMembers,
    handleSearchChange,
    handleSearchTypeChange,
    handleSourceFilterChange,
    handleGenderFilterChange,
    handleAgeRangeFilterChange,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
  } = useMembersData()

  const {
    isExporting,
    isAdding,
    setIsAdding,
    isSubmittingRegistration,
    selectedIds,
    isAssignModalOpen,
    setIsAssignModalOpen,
    assigningMembers,
    assignmentData,
    setAssignmentData,
    isSubmittingAssignment,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeletingMembers,
    viewingAuditLogs,
    isAuditModalOpen,
    setIsAuditModalOpen,
    auditTargetMember,
    isVerifyModalOpen,
    setIsVerifyModalOpen,
    verifyingMembers,
    isVerifyingMembers,
    chapters,
    roles,
    constituencies,
    handleVerify,
    handleConfirmVerify,
    handleViewAudit,
    handleSubmitRegistration,
    handleExport,
    handleToggleSelectAll,
    handleToggleSelect,
    handleBulkVerify,
    handleBulkDelete,
    handleConfirmDelete,
    handleOpenAssign,
    handleConfirmAssignment,
    clearSelection,
  } = useMembersActions(members, fetchMembers)

  return (
    <div className="main">
      <MembersHeader
        isExporting={isExporting}
        isSyncingSendGrid={isSyncingSendGrid}
        membersCount={members.length}
        onExport={handleExport}
        onAddMember={() => setIsAdding(true)}
        onImportCSV={() => setIsImportingCSV(true)}
        onSyncSendGrid={handleSyncSendGrid}
      />

      {syncResult && (
        <div
          style={{
            padding: '8px 14px',
            marginBottom: 14,
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            background: syncResult.startsWith('✓')
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
            color: syncResult.startsWith('✓') ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
            border: `1px solid ${syncResult.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{syncResult}</span>
          <button
            onClick={() => setSyncResult(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 4px',
              color: 'inherit',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
          </button>
        </div>
      )}

      <MembersKPIs
        isLoading={isLoading}
        total={stats.total}
        active={stats.active}
        pending={stats.pending}
        regions={stats.regions}
      />

      <MembersFilterBar
        searchTerm={searchTerm}
        searchType={searchType}
        sourceFilter={sourceFilter}
        genderFilter={genderFilter}
        ageRangeFilter={ageRangeFilter}
        sortOrder={sortOrder}
        onSearchChange={handleSearchChange}
        onSearchTypeChange={handleSearchTypeChange}
        onSourceFilterChange={handleSourceFilterChange}
        onGenderFilterChange={handleGenderFilterChange}
        onAgeRangeFilterChange={handleAgeRangeFilterChange}
        onSortChange={setSortOrder}
        onClearSearch={handleClearSearch}
      />

      <MembersBulkBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onBulkVerify={handleBulkVerify}
        onBulkAssign={handleOpenAssign}
        onBulkDelete={handleBulkDelete}
      />

      <MembersTable
        members={members}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedIds={selectedIds}
        lowBandwidthMode={lowBandwidthMode}
        currentPage={currentPage}
        totalMembers={totalMembers}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onToggleSelectAll={() => handleToggleSelectAll(members)}
        onToggleSelect={handleToggleSelect}
        onViewAudit={handleViewAudit}
        onVerify={handleVerify}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {isAdding && (
        <RegistrationOverlay
          isSubmitting={isSubmittingRegistration}
          onClose={() => setIsAdding(false)}
          onSubmitData={handleSubmitRegistration}
        />
      )}

      {isImportingCSV && (
        <ImportCSVOverlay onClose={() => setIsImportingCSV(false)} onSuccess={fetchMembers} />
      )}

      <AuditModal
        isOpen={isAuditModalOpen}
        memberName={auditTargetMember}
        logs={viewingAuditLogs}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <AssignmentModal
        isOpen={isAssignModalOpen}
        assigningMembers={assigningMembers}
        chapters={chapters}
        constituencies={constituencies}
        roles={roles}
        data={assignmentData}
        onChange={(field, value) => setAssignmentData((d) => ({ ...d, [field]: value }))}
        onConfirm={handleConfirmAssignment}
        onClose={() => setIsAssignModalOpen(false)}
        isSubmitting={isSubmittingAssignment}
      />

      <VerifyModal
        isOpen={isVerifyModalOpen}
        members={verifyingMembers}
        isVerifying={isVerifyingMembers}
        onConfirm={handleConfirmVerify}
        onClose={() => setIsVerifyModalOpen(false)}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        selectedIds={selectedIds}
        members={members}
        isDeleting={isDeletingMembers}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}
