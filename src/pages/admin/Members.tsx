import { useState } from 'react'
import { usePerformance } from '@/context/PerformanceContext'
import { MemberDetailPanel } from './members/MemberDetailPanel'
import { AuditModal } from './members/AuditModal'
import { AssignmentModal } from './members/AssignmentModal'
import { DeleteModal } from './members/DeleteModal'
import { VerifyModal } from './members/VerifyModal'
import { EditModal } from './members/EditModal'
import { MembersTable } from './members/MembersTable'
import { MembersHeader } from './members/MembersHeader'
import { MembersKPIs } from './members/MembersKPIs'
import { MembersFilterBar } from './members/MembersFilterBar'
import { MembersBulkBar } from './members/MembersBulkBar'
import { RegistrationOverlay } from './members/RegistrationOverlay'
import { ImportCSVOverlay } from './members/ImportCSVOverlay'
import { useMembersData } from './members/useMembersData'
import { useMemberDetail } from './members/useMemberDetail'
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
    sourceFilter,
    stats,
    fetchMembers,
    handleSearchChange,
    handleSourceFilterChange,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
  } = useMembersData()

  const {
    selectedMember,
    setSelectedMember,
    activeDetailTab,
    setActiveDetailTab,
    detailLogs,
    memberDonations,
    memberPollVotes,
    memberSessions,
    memberNotes,
    newNoteContent,
    setNewNoteContent,
    isSubmittingNote,
    handleAddNote,
  } = useMemberDetail()

  const {
    cardRef,
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
    isEditModalOpen,
    setIsEditModalOpen,
    editForm,
    setEditForm,
    isSavingEdit,
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
    handlePrint,
    handleDownload,
    handleExport,
    handleToggleSelectAll,
    handleToggleSelect,
    handleBulkVerify,
    handleBulkDelete,
    handleConfirmDelete,
    handleOpenAssign,
    handleConfirmAssignment,
    openEditModal,
    handleSaveEdit,
    clearSelection,
  } = useMembersActions(members, selectedMember, setSelectedMember, fetchMembers)

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
        sourceFilter={sourceFilter}
        onSearchChange={handleSearchChange}
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
        onViewMember={setSelectedMember}
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

      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          activeTab={activeDetailTab}
          onTabChange={setActiveDetailTab}
          onClose={() => setSelectedMember(null)}
          logs={detailLogs}
          donations={memberDonations}
          pollVotes={memberPollVotes}
          sessions={memberSessions}
          notes={memberNotes}
          noteContent={newNoteContent}
          onNoteChange={setNewNoteContent}
          onAddNote={handleAddNote}
          isSubmittingNote={isSubmittingNote}
          cardRef={cardRef}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onEdit={openEditModal}
          onVerify={handleVerify}
        />
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

      <EditModal
        isOpen={isEditModalOpen}
        member={selectedMember}
        form={editForm}
        onChange={(field, value) => setEditForm((f) => ({ ...f, [field]: value }))}
        onSave={handleSaveEdit}
        onClose={() => setIsEditModalOpen(false)}
        isSaving={isSavingEdit}
      />
    </div>
  )
}
