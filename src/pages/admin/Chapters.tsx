import { useState, useEffect, useMemo } from 'react'
import { adminService } from '@/services/adminService'
import type { RegionalStat, Country } from '@/services/adminService'
import { useChapters } from '@/context/ChaptersContext'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ChaptersGrid } from './chapters/ChaptersGrid'
import { PollManagementModal } from './chapters/PollManagementModal'
import { PollCreateEditModal } from './chapters/PollCreateEditModal'
import { ChapterDetailModal } from './chapters/ChapterDetailModal'
import { ChaptersStats } from './chapters/ChaptersStats'
import { ChaptersMap } from './chapters/ChaptersMap'
import { useChapterForm } from './chapters/useChapterForm'
import { usePollManagement } from './chapters/usePollManagement'

export default function ChaptersManagement() {
  const { chapters } = useChapters()
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All')
  const [regionFilter, setRegionFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const chapterForm = useChapterForm()
  const pollMgmt = usePollManagement()

  useEffect(() => {
    Promise.all([adminService.getRegionalStats(), adminService.getCountries()]).then(
      ([stats, c]) => {
        setRegionalStats(stats)
        setCountries(c)
        setIsLoading(false)
      }
    )
  }, [])

  useEffect(() => {
    if (chapters.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const chapterId = params.get('id')
      if (chapterId) {
        const chapter = chapters.find((c) => c.id === chapterId)
        if (chapter) {
          setTimeout(() => {
            chapterForm.openEditModal(chapter)
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [chapters, chapterForm])

  const availableRegions = useMemo(() => {
    const set = new Set(chapters.filter((c) => c.region).map((c) => c.region!))
    return Array.from(set).sort()
  }, [chapters])

  const filteredChapters = useMemo(
    () =>
      chapters.filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.city_or_region.toLowerCase().includes(search.toLowerCase())
        const normalized = c.status === 'Active' ? 'Active' : 'Pending'
        let matchesRegion = true
        if (regionFilter) {
          matchesRegion =
            (c.city_or_region || '').toLowerCase() === regionFilter.toLowerCase() ||
            (c.country || '').toLowerCase() === regionFilter.toLowerCase()
        }
        return (
          matchesSearch && (statusFilter === 'All' || normalized === statusFilter) && matchesRegion
        )
      }),
    [chapters, search, statusFilter, regionFilter]
  )

  const sortedChapters = useMemo(() => {
    return [...filteredChapters].sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [filteredChapters, sortOrder])

  const totalMembers = useMemo(
    () => chapters.reduce((s, c) => s + (c.member_count || 0), 0),
    [chapters]
  )
  const activeCount = useMemo(
    () => chapters.filter((c) => c.status === 'Active').length,
    [chapters]
  )
  const pendingCount = useMemo(
    () => chapters.filter((c) => c.status !== 'Active').length,
    [chapters]
  )

  const itemsPerPage = 14
  const totalPages = Math.ceil(sortedChapters.length / itemsPerPage)
  const currentChapters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedChapters.slice(start, start + itemsPerPage)
  }, [sortedChapters, currentPage])

  const maxMemberCount = useMemo(
    () => Math.max(...regionalStats.map((s) => s.memberCount), 1),
    [regionalStats]
  )

  if (isLoading) {
    return (
      <div
        className="page-root"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: 12 }}></div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Synchronizing Chapter Network...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Chapters"
        icon="location_on"
        description="Oversee and manage regional chapters and local mobilization units."
        actions={
          <>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => toast.info('Accessing audit vault...')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                history
              </span>
              Audit trail
            </button>
            {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
              <button className="btn btn-dest btn-sm" onClick={chapterForm.openAddModal}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  add
                </span>
                Add chapter
              </button>
            )}
          </>
        }
      />

      <div className="kpis">
        <TacticalKPI
          label="Total chapters"
          value={chapters.length}
          description="Registered hubs"
          variant="red"
        />
        <TacticalKPI
          label="Total members"
          value={totalMembers}
          description="Across all chapters"
          trend={{ direction: 'up', value: '+12%' }}
          variant="gold"
        />
        <TacticalKPI
          label="Active hubs"
          value={activeCount}
          description="Operational hubs"
          trend={{ direction: 'up', value: 'Live' }}
          variant="black"
        />
        <TacticalKPI
          label="Pending review"
          value={pendingCount}
          description="Awaiting activation"
          trend={{ direction: 'neutral', value: 'Review' }}
          variant="green"
        />
      </div>

      <ChaptersStats regionalStats={regionalStats} maxMemberCount={maxMemberCount} />

      <ChaptersMap
        chapters={chapters}
        regionFilter={regionFilter}
        onRegionFilterChange={setRegionFilter}
        onPageChange={setCurrentPage}
      />

      <ChaptersGrid
        currentChapters={currentChapters}
        filteredChapters={sortedChapters}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        search={search}
        statusFilter={statusFilter}
        regionFilter={regionFilter}
        availableRegions={availableRegions}
        sortOrder={sortOrder}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onRegionFilterChange={(val) => {
          setRegionFilter(val)
          setCurrentPage(1)
        }}
        onSortOrderChange={setSortOrder}
        onPageChange={setCurrentPage}
        onOpenAddModal={chapterForm.openAddModal}
        onOpenEditModal={chapterForm.openEditModal}
        onOpenPollManageModal={pollMgmt.openPollManageModal}
        onVerifyChapter={chapterForm.handleVerifyChapter}
        onDeleteChapter={chapterForm.handleDeleteChapter}
      />

      {pollMgmt.showPollManageModal && (
        <PollManagementModal
          managePollChapterName={pollMgmt.managePollChapterName}
          managePollChapterId={pollMgmt.managePollChapterId}
          chapterPolls={pollMgmt.chapterPolls}
          loadingPolls={pollMgmt.loadingPolls}
          chapters={chapters}
          onClose={() => pollMgmt.setShowPollManageModal(false)}
          onNewPoll={(chapter) => pollMgmt.openPollModal(chapter)}
          onEditPoll={(chapter, poll) => pollMgmt.openPollModal(chapter, poll)}
          onClosePollEarly={pollMgmt.handleClosePollEarly}
          onDeletePoll={pollMgmt.handleDeletePoll}
        />
      )}

      {pollMgmt.showPollModal && (
        <PollCreateEditModal
          editingPollId={pollMgmt.editingPollId}
          pollChapterName={pollMgmt.pollChapterName}
          pollTitle={pollMgmt.pollTitle}
          pollDescription={pollMgmt.pollDescription}
          pollEndsAt={pollMgmt.pollEndsAt}
          pollBannerPreview={pollMgmt.pollBannerPreview}
          pollCandidates={pollMgmt.pollCandidates}
          pollCandidateSearch={pollMgmt.pollCandidateSearch}
          pollCandidateMatches={pollMgmt.pollCandidateMatches}
          pollCandidateInput={pollMgmt.pollCandidateInput}
          showCandidateDropdown={pollMgmt.showCandidateDropdown}
          isCreatingPoll={pollMgmt.isCreatingPoll}
          onClose={() => pollMgmt.setShowPollModal(false)}
          onBack={() => {
            pollMgmt.setShowPollModal(false)
            pollMgmt.setShowPollManageModal(true)
          }}
          onTitleChange={pollMgmt.setPollTitle}
          onDescriptionChange={pollMgmt.setPollDescription}
          onEndsAtChange={pollMgmt.setPollEndsAt}
          onBannerFileChange={pollMgmt.handleBannerFileChange}
          onBannerClear={() => {
            pollMgmt.setPollBannerFile(null)
            pollMgmt.setPollBannerPreview(null)
          }}
          onCandidateSearchChange={pollMgmt.searchPollCandidates}
          onCandidatePositionChange={(val) =>
            pollMgmt.setPollCandidateInput((prev) => ({ ...prev, position: val }))
          }
          onSelectCandidate={pollMgmt.selectPollCandidate}
          onAddCandidate={pollMgmt.handleAddCandidate}
          onRemoveCandidate={(index) =>
            pollMgmt.setPollCandidates((prev) => prev.filter((_, i) => i !== index))
          }
          onHideCandidateDropdown={() => pollMgmt.setShowCandidateDropdown(false)}
          onCreatePoll={pollMgmt.handleCreatePoll}
        />
      )}

      {chapterForm.isModalOpen && (
        <ChapterDetailModal
          editingChapterId={chapterForm.editingChapterId}
          formData={chapterForm.formData}
          modalMembers={chapterForm.modalMembers}
          leaderSearch={chapterForm.leaderSearch}
          showLeaderList={chapterForm.showLeaderList}
          countries={countries}
          onFormChange={(field, value) =>
            chapterForm.setFormData((prev) => ({ ...prev, [field]: value }))
          }
          onLeaderSearchChange={chapterForm.setLeaderSearch}
          onLeaderSelect={chapterForm.handleLeaderSelect}
          onLeaderBlur={() => setTimeout(() => chapterForm.setShowLeaderList(false), 150)}
          onLeaderFocus={() => chapterForm.setShowLeaderList(true)}
          onClose={chapterForm.closeModal}
          onSubmit={chapterForm.handleSaveChapter}
        />
      )}
    </div>
  )
}
