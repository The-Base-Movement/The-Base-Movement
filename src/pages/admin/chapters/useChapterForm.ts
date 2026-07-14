import { useState } from 'react'
import { adminService } from '@/services/adminService'
import type { Chapter, Country, Region } from '@/services/adminService'
import type { Member } from '@/types/admin'
import { useChapters } from '@/context/ChaptersContext'
import { toast } from 'sonner'

export interface ChapterFormData {
  name: string
  city_or_region: string
  country: string
  description: string
  status: string
  leader_name: string
}

export function useChapterForm() {
  const { addChapter, updateChapter, deleteChapter } = useChapters()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ChapterFormData>({
    name: '',
    city_or_region: '',
    country: '',
    description: '',
    status: 'Pending',
    leader_name: '',
  })
  const [modalMembers, setModalMembers] = useState<{ id: string; name: string; region: string }[]>(
    []
  )
  const [leaderSearch, setLeaderSearch] = useState('')
  const [showLeaderList, setShowLeaderList] = useState(false)

  const loadMembers = () => {
    adminService.getMembers().then((members: Member[]) => {
      setModalMembers(
        members
          .filter((m) => m.status === 'Active' || m.status === 'Approved')
          .map((m) => ({ id: m.id, name: m.name, region: m.region || '' }))
      )
    })
  }

  const openAddModal = () => {
    setEditingChapterId(null)
    setFormData({
      name: '',
      city_or_region: '',
      country: '',
      description: '',
      status: 'Pending',
      leader_name: '',
    })
    setLeaderSearch('')
    setIsModalOpen(true)
    loadMembers()
  }

  const openEditModal = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setFormData({
      name: chapter.name,
      city_or_region: chapter.city_or_region,
      country: chapter.country || '',
      description: '',
      status: chapter.status,
      leader_name: chapter.leader_name || '',
    })
    setLeaderSearch(chapter.leader_name || '')
    setIsModalOpen(true)
    loadMembers()
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingChapterId(null)
    setLeaderSearch('')
    setShowLeaderList(false)
  }

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    // Chapters are Diaspora-only: a country is required and it cannot be Ghana.
    const country = formData.country.trim()
    if (!country || country.toLowerCase() === 'ghana') {
      toast.error('Chapters are Diaspora-only. Pick a country other than Ghana.')
      return
    }
    const chapterData = {
      name: formData.name,
      city_or_region: formData.city_or_region,
      country,
      leader_name: formData.leader_name || 'Unassigned',
      member_count: 0,
      status: formData.status as Chapter['status'],
    }
    if (editingChapterId) {
      const success = await updateChapter(editingChapterId, chapterData)
      if (success) toast.success(`Chapter "${formData.name}" updated.`)
      else toast.error('Could not update the chapter.')
    } else {
      const success = await addChapter(chapterData)
      if (success) toast.success(`Chapter "${formData.name}" registered.`)
      else toast.error('Could not register the chapter.')
    }
    closeModal()
  }

  const handleDeleteChapter = async (id: string, name: string) => {
    if (window.confirm(`Decommission the "${name}" chapter?`)) {
      const success = await deleteChapter(id, name)
      if (success) toast.error(`Chapter "${name}" decommissioned.`)
    }
  }

  const handleLeaderSelect = (name: string) => {
    setFormData((prev) => ({ ...prev, leader_name: name }))
    setLeaderSearch(name)
    setShowLeaderList(false)
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

  return {
    isModalOpen,
    editingChapterId,
    formData,
    modalMembers,
    leaderSearch,
    showLeaderList,
    setFormData,
    setLeaderSearch,
    setShowLeaderList,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveChapter,
    handleDeleteChapter,
    handleVerifyChapter,
    handleLeaderSelect,
  }
}

export type { Country, Region }
