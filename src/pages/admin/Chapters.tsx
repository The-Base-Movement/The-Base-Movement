import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { RegionalStat, Chapter, Country, Region } from '@/services/adminService'
import type { Member } from '@/types/admin'
import { contentService } from '@/services/contentService'
import { useChapters } from '@/context/ChaptersContext'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { supabase } from '@/lib/supabase'
import { ChaptersGrid } from './chapters/ChaptersGrid'
import { PollManagementModal } from './chapters/PollManagementModal'
import { PollCreateEditModal } from './chapters/PollCreateEditModal'
import { ChapterDetailModal } from './chapters/ChapterDetailModal'
import { ChaptersStats } from './chapters/ChaptersStats'
import { ChaptersMap } from './chapters/ChaptersMap'
import { GHANA_REGIONS_LIST, getChapterRegion } from '@/utils/mapUtils'

interface PollSummary {
  id: string
  title: string
  description: string | null
  ends_at: string
  banner_url: string | null
  total_votes: number
  candidates: { id: string; name: string; position: string | null; avatar_url: string | null }[]
}

export default function ChaptersManagement() {
  const { chapters, addChapter, updateChapter, deleteChapter } = useChapters()
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All')
  const [networkFilter, setNetworkFilter] = useState<'All' | 'Ghana' | 'Diaspora'>('All')
  const [regionFilter, setRegionFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    city_or_region: '',
    country: 'Ghana',
    description: '',
    status: 'Pending',
    leader_name: '',
  })
  const [modalMembers, setModalMembers] = useState<{ id: string; name: string; region: string }[]>(
    []
  )
  const [leaderSearch, setLeaderSearch] = useState('')
  const [showLeaderList, setShowLeaderList] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ghanaRegions, setGhanaRegions] = useState<Region[]>([])

  // Poll creation state
  const [showPollModal, setShowPollModal] = useState(false)
  const [pollChapterId, setPollChapterId] = useState('')
  const [pollChapterName, setPollChapterName] = useState('')
  const [pollTitle, setPollTitle] = useState('')
  const [pollDescription, setPollDescription] = useState('')
  const [pollEndsAt, setPollEndsAt] = useState('')
  const [pollCandidates, setPollCandidates] = useState<
    { name: string; position: string; avatar_url: string | null }[]
  >([])
  const [pollCandidateInput, setPollCandidateInput] = useState({
    name: '',
    position: '',
    avatar_url: null as string | null,
  })
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [pollBannerFile, setPollBannerFile] = useState<File | null>(null)
  const [pollBannerPreview, setPollBannerPreview] = useState<string | null>(null)
  const [pollCandidateSearch, setPollCandidateSearch] = useState('')
  const [pollCandidateMatches, setPollCandidateMatches] = useState<
    { id: string; name: string; avatar_url: string | null; registration_number: string }[]
  >([])
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false)

  // Poll management state
  const [showPollManageModal, setShowPollManageModal] = useState(false)
  const [managePollChapterId, setManagePollChapterId] = useState('')
  const [managePollChapterName, setManagePollChapterName] = useState('')
  const [chapterPolls, setChapterPolls] = useState<PollSummary[]>([])
  const [loadingPolls, setLoadingPolls] = useState(false)
  const [editingPollId, setEditingPollId] = useState<string | null>(null)

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    const chapterData = {
      name: formData.name,
      city_or_region: formData.city_or_region,
      country: formData.country,
      leader_name: formData.leader_name || 'Unassigned',
      member_count: 0,
      status: formData.status as Chapter['status'],
    }
    if (editingChapterId) {
      const success = await updateChapter(editingChapterId, chapterData)
      if (success) toast.success(`Chapter "${formData.name}" updated.`)
    } else {
      const success = await addChapter(chapterData)
      if (success) toast.success(`Chapter "${formData.name}" registered.`)
    }
    closeModal()
  }

  const openAddModal = () => {
    setEditingChapterId(null)
    setFormData({
      name: '',
      city_or_region: '',
      country: 'Ghana',
      description: '',
      status: 'Pending',
      leader_name: '',
    })
    setLeaderSearch('')
    setIsModalOpen(true)
    adminService.getMembers().then((members: Member[]) => {
      setModalMembers(
        members
          .filter((m) => m.status === 'Active' || m.status === 'Approved')
          .map((m) => ({ id: m.id, name: m.name, region: m.region || '' }))
      )
    })
  }

  const openEditModal = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setFormData({
      name: chapter.name,
      city_or_region: chapter.city_or_region,
      country: chapter.country || 'Ghana',
      description: '',
      status: chapter.status,
      leader_name: chapter.leader_name || '',
    })
    setLeaderSearch(chapter.leader_name || '')
    setIsModalOpen(true)
    adminService.getMembers().then((members: Member[]) => {
      setModalMembers(
        members
          .filter((m) => m.status === 'Active' || m.status === 'Approved')
          .map((m) => ({ id: m.id, name: m.name, region: m.region || '' }))
      )
    })
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingChapterId(null)
    setLeaderSearch('')
    setShowLeaderList(false)
  }

  useEffect(() => {
    Promise.all([
      adminService.getRegionalStats(),
      adminService.getCountries(),
      adminService.getRegions(),
    ]).then(([stats, countries, regions]) => {
      setRegionalStats(stats)
      setCountries(countries)
      setGhanaRegions(regions)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (chapters.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const chapterId = params.get('id')
      if (chapterId) {
        const chapter = chapters.find((c) => c.id === chapterId)
        if (chapter) {
          setTimeout(() => {
            openEditModal(chapter)
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [chapters])

  const handleDeleteChapter = async (id: string, name: string) => {
    if (window.confirm(`Decommission the "${name}" chapter?`)) {
      const success = await deleteChapter(id, name)
      if (success) toast.error(`Chapter "${name}" decommissioned.`)
    }
  }

  const openPollManageModal = (chapter: Chapter) => {
    setManagePollChapterId(chapter.id)
    setManagePollChapterName(chapter.name)
    setShowPollManageModal(true)
    fetchChapterPolls(chapter.id)
  }

  const fetchChapterPolls = async (chapterId: string) => {
    setLoadingPolls(true)
    const { data } = await supabase
      .from('chapter_polls')
      .select('*, chapter_poll_candidates(*), chapter_poll_votes(id)')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
    setLoadingPolls(false)
    if (data) {
      setChapterPolls(
        data.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          ends_at: p.ends_at,
          banner_url: p.banner_url,
          total_votes: (p.chapter_poll_votes || []).length,
          candidates: p.chapter_poll_candidates || [],
        }))
      )
    }
  }

  const handleClosePollEarly = async (pollId: string) => {
    const { error } = await supabase
      .from('chapter_polls')
      .update({ ends_at: new Date().toISOString() })
      .eq('id', pollId)
    if (error) {
      toast.error('Failed to close poll.')
      return
    }
    toast.success('Poll closed.')
    fetchChapterPolls(managePollChapterId)
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('Delete this poll and all its votes? This cannot be undone.')) return
    const { error } = await supabase.from('chapter_polls').delete().eq('id', pollId)
    if (error) {
      toast.error('Failed to delete poll.')
      return
    }
    toast.success('Poll deleted.')
    fetchChapterPolls(managePollChapterId)
  }

  const openPollModal = (chapter: Chapter, poll?: PollSummary) => {
    setPollChapterId(chapter.id)
    setPollChapterName(chapter.name)
    setEditingPollId(poll?.id || null)
    setPollTitle(poll?.title || '')
    setPollDescription(poll?.description || '')
    setPollEndsAt(poll ? new Date(poll.ends_at).toISOString().slice(0, 16) : '')
    setPollCandidates(
      poll?.candidates.map((c) => ({
        name: c.name,
        position: c.position || '',
        avatar_url: c.avatar_url,
      })) || []
    )
    setPollCandidateInput({ name: '', position: '', avatar_url: null })
    setPollBannerFile(null)
    setPollBannerPreview(poll?.banner_url || null)
    setPollCandidateSearch('')
    setPollCandidateMatches([])
    setShowCandidateDropdown(false)
    setShowPollModal(true)
  }

  const searchPollCandidates = async (q: string) => {
    setPollCandidateSearch(q)
    setPollCandidateInput((p) => ({ ...p, name: q, avatar_url: null }))
    if (q.length < 2) {
      setPollCandidateMatches([])
      setShowCandidateDropdown(false)
      return
    }
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, registration_number')
      .ilike('full_name', `%${q}%`)
      .limit(6)
    if (data) {
      setPollCandidateMatches(
        data.map((u) => ({
          id: u.id,
          name: u.full_name,
          avatar_url: u.avatar_url,
          registration_number: u.registration_number,
        }))
      )
      setShowCandidateDropdown(true)
    }
  }

  const selectPollCandidate = (m: {
    id: string
    name: string
    avatar_url: string | null
    registration_number: string
  }) => {
    setPollCandidateSearch(m.name)
    setPollCandidateInput((p) => ({ ...p, name: m.name, avatar_url: m.avatar_url }))
    setPollCandidateMatches([])
    setShowCandidateDropdown(false)
  }

  const handleAddCandidate = () => {
    const name = pollCandidateInput.name.trim()
    if (!name) return
    if (pollCandidates.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Candidate already added.')
      return
    }
    setPollCandidates((prev) => [
      ...prev,
      {
        name,
        position: pollCandidateInput.position.trim(),
        avatar_url: pollCandidateInput.avatar_url,
      },
    ])
    setPollCandidateInput({ name: '', position: '', avatar_url: null })
    setPollCandidateSearch('')
    setShowCandidateDropdown(false)
  }

  const handleCreatePoll = async () => {
    if (!pollTitle.trim()) {
      toast.error('Poll title is required.')
      return
    }
    if (!pollEndsAt) {
      toast.error('End date is required.')
      return
    }
    if (pollCandidates.length < 2) {
      toast.error('Add at least 2 candidates.')
      return
    }
    setIsCreatingPoll(true)

    let bannerUrl: string | null = pollBannerPreview && !pollBannerFile ? pollBannerPreview : null
    if (pollBannerFile) {
      bannerUrl = await contentService.uploadImage(pollBannerFile, 'poll-banners')
      if (!bannerUrl) {
        toast.error('Banner upload failed.')
        setIsCreatingPoll(false)
        return
      }
    }

    if (editingPollId) {
      const { error } = await supabase
        .from('chapter_polls')
        .update({
          title: pollTitle.trim(),
          description: pollDescription.trim() || null,
          ends_at: new Date(pollEndsAt).toISOString(),
          banner_url: bannerUrl,
        })
        .eq('id', editingPollId)
      if (error) {
        toast.error('Failed to update poll.')
        setIsCreatingPoll(false)
        return
      }
      await supabase.from('chapter_poll_candidates').delete().eq('poll_id', editingPollId)
      await supabase.from('chapter_poll_candidates').insert(
        pollCandidates.map((c) => ({
          poll_id: editingPollId,
          name: c.name,
          position: c.position || null,
          avatar_url: c.avatar_url || null,
        }))
      )
      setIsCreatingPoll(false)
      toast.success('Poll updated.')
      setShowPollModal(false)
      fetchChapterPolls(pollChapterId)
    } else {
      const { data: poll, error: pollError } = await supabase
        .from('chapter_polls')
        .insert({
          chapter_id: pollChapterId,
          title: pollTitle.trim(),
          description: pollDescription.trim() || null,
          ends_at: new Date(pollEndsAt).toISOString(),
          banner_url: bannerUrl,
        })
        .select('id')
        .single()
      if (pollError || !poll) {
        toast.error('Failed to create poll.')
        setIsCreatingPoll(false)
        return
      }
      const { error: candError } = await supabase.from('chapter_poll_candidates').insert(
        pollCandidates.map((c) => ({
          poll_id: poll.id,
          name: c.name,
          position: c.position || null,
          avatar_url: c.avatar_url || null,
        }))
      )
      setIsCreatingPoll(false)
      if (candError) {
        toast.error('Poll created but failed to add candidates.')
        return
      }
      toast.success(`Poll created for "${pollChapterName}".`)
      setShowPollModal(false)
      fetchChapterPolls(pollChapterId)
    }
  }

  const handleVerifyChapter = async (id: string, name: string) => {
    const success = await adminService.updateChapter(id, { status: 'Active' })
    if (success) {
      updateChapter(id, { status: 'Active' })
      toast.success(`"${name}" verified and activated.`)
    } else {
      toast.error('Verification failed.')
    }
  }

  const availableRegions = useMemo(() => {
    if (networkFilter === 'Ghana') return GHANA_REGIONS_LIST.slice().sort()
    const set = new Set(chapters.filter((c) => c.region).map((c) => c.region!))
    return Array.from(set).sort()
  }, [chapters, networkFilter])

  const filteredChapters = useMemo(
    () =>
      chapters.filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.city_or_region.toLowerCase().includes(search.toLowerCase())
        const normalized = c.status === 'Active' ? 'Active' : 'Pending'
        const isGhana = (c.country || 'Ghana') === 'Ghana'
        const matchesNetwork =
          networkFilter === 'All' || (networkFilter === 'Ghana' ? isGhana : !isGhana)

        // Improved region matching using the robust derivation logic
        let matchesRegion = true
        if (regionFilter) {
          if (isGhana) {
            const derived = getChapterRegion(c)
            matchesRegion = derived?.toLowerCase() === regionFilter.toLowerCase()
          } else {
            matchesRegion = (c.region || '').toLowerCase() === regionFilter.toLowerCase()
          }
        }

        return (
          matchesSearch &&
          (statusFilter === 'All' || normalized === statusFilter) &&
          matchesNetwork &&
          matchesRegion
        )
      }),
    [chapters, search, statusFilter, networkFilter, regionFilter]
  )

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
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage)
  const currentChapters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredChapters.slice(start, start + itemsPerPage)
  }, [filteredChapters, currentPage])

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
              fontWeight: 800,
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
      {/* Top bar */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>
              Admin
            </Link>
            {' · '}
            Chapters
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
            >
              location_on
            </span>
            Chapters
          </h2>
        </div>
        <div className="actions">
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
            <button className="btn btn-dest btn-sm" onClick={openAddModal}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Add chapter
            </button>
          )}
        </div>
      </div>

      <div className="kpis">
        <TacticalKPI label="Total chapters" value={chapters.length} description="Registered hubs" />
        <TacticalKPI
          label="Total members"
          value={totalMembers}
          description="Across all chapters"
          trend={{ direction: 'up', value: '+12%' }}
        />
        <TacticalKPI
          label="Active hubs"
          value={activeCount}
          description="Operational hubs"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI
          label="Pending review"
          value={pendingCount}
          description="Awaiting activation"
          trend={{ direction: 'neutral', value: 'Review' }}
        />
      </div>

      <ChaptersStats regionalStats={regionalStats} maxMemberCount={maxMemberCount} />

      <ChaptersMap
        chapters={chapters}
        regionFilter={regionFilter}
        onRegionFilterChange={setRegionFilter}
        networkFilter={networkFilter}
        onNetworkFilterChange={setNetworkFilter}
        onPageChange={setCurrentPage}
      />

      <ChaptersGrid
        currentChapters={currentChapters}
        filteredChapters={filteredChapters}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        search={search}
        statusFilter={statusFilter}
        networkFilter={networkFilter}
        regionFilter={regionFilter}
        availableRegions={availableRegions}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onNetworkFilterChange={setNetworkFilter}
        onRegionFilterChange={(val) => {
          setRegionFilter(val)
          setCurrentPage(1)
        }}
        onPageChange={setCurrentPage}
        onOpenAddModal={openAddModal}
        onOpenEditModal={openEditModal}
        onOpenPollManageModal={openPollManageModal}
        onVerifyChapter={handleVerifyChapter}
        onDeleteChapter={handleDeleteChapter}
      />

      {showPollManageModal && (
        <PollManagementModal
          managePollChapterName={managePollChapterName}
          managePollChapterId={managePollChapterId}
          chapterPolls={chapterPolls}
          loadingPolls={loadingPolls}
          chapters={chapters}
          onClose={() => setShowPollManageModal(false)}
          onNewPoll={(chapter) => openPollModal(chapter)}
          onEditPoll={(chapter, poll) => openPollModal(chapter, poll)}
          onClosePollEarly={handleClosePollEarly}
          onDeletePoll={handleDeletePoll}
        />
      )}

      {showPollModal && (
        <PollCreateEditModal
          editingPollId={editingPollId}
          pollChapterName={pollChapterName}
          pollTitle={pollTitle}
          pollDescription={pollDescription}
          pollEndsAt={pollEndsAt}
          pollBannerPreview={pollBannerPreview}
          pollCandidates={pollCandidates}
          pollCandidateSearch={pollCandidateSearch}
          pollCandidateMatches={pollCandidateMatches}
          pollCandidateInput={pollCandidateInput}
          showCandidateDropdown={showCandidateDropdown}
          isCreatingPoll={isCreatingPoll}
          onClose={() => setShowPollModal(false)}
          onBack={() => {
            setShowPollModal(false)
            setShowPollManageModal(true)
          }}
          onTitleChange={setPollTitle}
          onDescriptionChange={setPollDescription}
          onEndsAtChange={setPollEndsAt}
          onBannerFileChange={(file) => {
            setPollBannerFile(file)
            const reader = new FileReader()
            reader.onload = (e) => setPollBannerPreview((e.target?.result as string) ?? null)
            reader.readAsDataURL(file)
          }}
          onBannerClear={() => {
            setPollBannerFile(null)
            setPollBannerPreview(null)
          }}
          onCandidateSearchChange={searchPollCandidates}
          onCandidatePositionChange={(val) =>
            setPollCandidateInput((prev) => ({ ...prev, position: val }))
          }
          onSelectCandidate={selectPollCandidate}
          onAddCandidate={handleAddCandidate}
          onRemoveCandidate={(index) =>
            setPollCandidates((prev) => prev.filter((_, i) => i !== index))
          }
          onHideCandidateDropdown={() => setShowCandidateDropdown(false)}
          onCreatePoll={handleCreatePoll}
        />
      )}

      {isModalOpen && (
        <ChapterDetailModal
          editingChapterId={editingChapterId}
          formData={formData}
          modalMembers={modalMembers}
          leaderSearch={leaderSearch}
          showLeaderList={showLeaderList}
          countries={countries}
          ghanaRegions={ghanaRegions}
          onFormChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onLeaderSearchChange={setLeaderSearch}
          onLeaderSelect={(name) => {
            setFormData((prev) => ({ ...prev, leader_name: name }))
            setLeaderSearch(name)
            setShowLeaderList(false)
          }}
          onLeaderBlur={() => setTimeout(() => setShowLeaderList(false), 150)}
          onLeaderFocus={() => setShowLeaderList(true)}
          onClose={closeModal}
          onSubmit={handleSaveChapter}
        />
      )}
    </div>
  )
}
