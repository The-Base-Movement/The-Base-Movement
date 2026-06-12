import { useState } from 'react'
import { supabase } from '@/lib/supabase'
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
