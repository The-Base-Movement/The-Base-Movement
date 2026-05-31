import { useState } from 'react'
import { usePerformance } from '@/context/PerformanceContext'
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
    stats,
    fetchMembers,
    handleSearchChange,
    handleSearchTypeChange,
    handleSourceFilterChange,
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
        membersCount={members.length}
        onExport={handleExport}
        onAddMember={() => setIsAdding(true)}
        onImportCSV={() => setIsImportingCSV(true)}
      />

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
        onSearchChange={handleSearchChange}
        onSearchTypeChange={handleSearchTypeChange}
        onSourceFilterChange={handleSourceFilterChange}
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
