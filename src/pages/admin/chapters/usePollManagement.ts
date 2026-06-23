import { useState } from 'react'
import { chapterService } from '@/services/chapterService'
import { contentService } from '@/services/contentService'
import type { Chapter } from '@/services/adminService'
import { toast } from 'sonner'

export interface PollSummary {
  id: string
  title: string
  description: string | null
  ends_at: string
  banner_url: string | null
  total_votes: number
  candidates: { id: string; name: string; position: string | null; avatar_url: string | null }[]
}

export interface PollCandidateInput {
  name: string
  position: string
  avatar_url: string | null
}

export interface PollCandidateMatch {
  id: string
  name: string
  avatar_url: string | null
  registration_number: string
}

export function usePollManagement() {
  // Poll create/edit state
  const [showPollModal, setShowPollModal] = useState(false)
  const [pollChapterId, setPollChapterId] = useState('')
  const [pollChapterName, setPollChapterName] = useState('')
  const [pollTitle, setPollTitle] = useState('')
  const [pollDescription, setPollDescription] = useState('')
  const [pollEndsAt, setPollEndsAt] = useState('')
  const [pollCandidates, setPollCandidates] = useState<
    { name: string; position: string; avatar_url: string | null }[]
  >([])
  const [pollCandidateInput, setPollCandidateInput] = useState<PollCandidateInput>({
    name: '',
    position: '',
    avatar_url: null,
  })
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [pollBannerFile, setPollBannerFile] = useState<File | null>(null)
  const [pollBannerPreview, setPollBannerPreview] = useState<string | null>(null)
  const [pollCandidateSearch, setPollCandidateSearch] = useState('')
  const [pollCandidateMatches, setPollCandidateMatches] = useState<PollCandidateMatch[]>([])
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false)
  const [editingPollId, setEditingPollId] = useState<string | null>(null)

  // Poll management state
  const [showPollManageModal, setShowPollManageModal] = useState(false)
  const [managePollChapterId, setManagePollChapterId] = useState('')
  const [managePollChapterName, setManagePollChapterName] = useState('')
  const [chapterPolls, setChapterPolls] = useState<PollSummary[]>([])
  const [loadingPolls, setLoadingPolls] = useState(false)

  const fetchChapterPolls = async (chapterId: string) => {
    setLoadingPolls(true)
    const polls = await chapterService.getChapterPolls(chapterId)
    setChapterPolls(polls)
    setLoadingPolls(false)
  }

  const openPollManageModal = (chapter: Chapter) => {
    setManagePollChapterId(chapter.id)
    setManagePollChapterName(chapter.name)
    setShowPollManageModal(true)
    fetchChapterPolls(chapter.id)
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

  const handleBannerFileChange = (file: File) => {
    setPollBannerFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPollBannerPreview((e.target?.result as string) ?? null)
    reader.readAsDataURL(file)
  }

  const searchPollCandidates = async (q: string) => {
    setPollCandidateSearch(q)
    setPollCandidateInput((p) => ({ ...p, name: q, avatar_url: null }))
    if (q.length < 2) {
      setPollCandidateMatches([])
      setShowCandidateDropdown(false)
      return
    }
    const matches = await chapterService.searchUsersForPollCandidate(q)
    setPollCandidateMatches(matches)
    setShowCandidateDropdown(true)
  }

  const selectPollCandidate = (m: PollCandidateMatch) => {
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

  const handleClosePollEarly = async (pollId: string) => {
    try {
      await chapterService.closeChapterPollEarly(pollId)
      toast.success('Poll closed.')
      fetchChapterPolls(managePollChapterId)
    } catch {
      toast.error('Failed to close poll.')
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('Delete this poll and all its votes? This cannot be undone.')) return
    try {
      await chapterService.deleteChapterPoll(pollId)
      toast.success('Poll deleted.')
      fetchChapterPolls(managePollChapterId)
    } catch {
      toast.error('Failed to delete poll.')
    }
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

    const pollData = {
      title: pollTitle.trim(),
      description: pollDescription.trim() || null,
      ends_at: new Date(pollEndsAt).toISOString(),
      banner_url: bannerUrl,
    }
    const candidateData = pollCandidates.map((c) => ({
      name: c.name,
      position: c.position || null,
      avatar_url: c.avatar_url || null,
    }))

    try {
      if (editingPollId) {
        await chapterService.updateChapterPoll(editingPollId, pollData, candidateData)
        toast.success('Poll updated.')
      } else {
        await chapterService.createChapterPoll(pollChapterId, pollData, candidateData)
        toast.success(`Poll created for "${pollChapterName}".`)
      }
      setShowPollModal(false)
      fetchChapterPolls(pollChapterId)
    } catch {
      toast.error(editingPollId ? 'Failed to update poll.' : 'Failed to create poll.')
    }
    setIsCreatingPoll(false)
  }

  return {
    // create/edit modal
    showPollModal,
    setShowPollModal,
    pollChapterName,
    pollTitle,
    setPollTitle,
    pollDescription,
    setPollDescription,
    pollEndsAt,
    setPollEndsAt,
    pollBannerPreview,
    pollCandidates,
    setPollCandidates,
    pollCandidateSearch,
    pollCandidateMatches,
    pollCandidateInput,
    setPollCandidateInput,
    showCandidateDropdown,
    setShowCandidateDropdown,
    isCreatingPoll,
    editingPollId,
    setPollBannerFile,
    setPollBannerPreview,
    handleBannerFileChange,
    // manage modal
    showPollManageModal,
    setShowPollManageModal,
    managePollChapterId,
    managePollChapterName,
    chapterPolls,
    loadingPolls,
    // handlers
    openPollManageModal,
    openPollModal,
    searchPollCandidates,
    selectPollCandidate,
    handleAddCandidate,
    handleClosePollEarly,
    handleDeletePoll,
    handleCreatePoll,
  }
}
