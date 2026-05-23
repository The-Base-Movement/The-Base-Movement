import { useState, useEffect, useCallback } from 'react'
import { adminService, type Milestone } from '@/services/adminService'
import { toast } from 'sonner'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import { RoadmapKPIs } from './roadmap/RoadmapKPIs'
import { RoadmapTable } from './roadmap/RoadmapTable'
import { RoadmapFormModal } from './roadmap/RoadmapFormModal'

export default function RoadmapManagement() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const { openDelete, modal: deleteModal } = useDeleteModal()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: new Date().toISOString().split('T')[0],
    status: 'Upcoming' as Milestone['status'],
    category: 'Mobilization',
    importance_level: 'Normal' as Milestone['importance_level'],
    target_members: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getMilestones()
      setMilestones(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenModal = (milestone: Milestone | null = null) => {
    if (milestone) {
      setEditingMilestone(milestone)
      setFormData({
        title: milestone.title,
        description: milestone.description,
        target_date: milestone.target_date
          ? new Date(milestone.target_date).toISOString().split('T')[0]
          : '',
        status: milestone.status,
        category: milestone.category,
        importance_level: milestone.importance_level,
        target_members: milestone.target_members || 0,
      })
    } else {
      setEditingMilestone(null)
      setFormData({
        title: '',
        description: '',
        target_date: new Date().toISOString().split('T')[0],
        status: 'Upcoming',
        category: 'Mobilization',
        importance_level: 'Normal',
        target_members: 0,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingMilestone) {
        const success = await adminService.updateMilestone(editingMilestone.id, formData)
        if (success) {
          toast.success('Strategic milestone updated.')
          setShowModal(false)
          fetchData()
        } else toast.error('Failed to update milestone.')
      } else {
        const success = await adminService.createMilestone(formData)
        if (success) {
          toast.success('Strategic milestone added.')
          setShowModal(false)
          fetchData()
        } else toast.error('Failed to add milestone.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (milestone: Milestone) => {
    openDelete({
      itemName: milestone.title,
      title: 'Remove milestone',
      description: 'This milestone will be permanently removed from the roadmap.',
      isPermanent: true,
      successMessage: 'Milestone removed from roadmap.',
      errorMessage: 'Failed to remove milestone.',
      onConfirm: async () => {
        const success = await adminService.deleteMilestone(milestone.id, milestone.title)
        if (success) fetchData()
        return success
      },
    })
  }

  const filteredMilestones = milestones.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="admin-page-container">
      <AdminPageHeader
        title="National strategic roadmap"
        icon="flag"
        description="Manage movement objectives, mobilization phases, and strategic timelines."
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            Add milestone
          </button>
        }
      />

      {/* KPIs */}
      <RoadmapKPIs milestones={milestones} />

      {/* Table panel */}
      <RoadmapTable
        filteredMilestones={filteredMilestones}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
      />

      {/* Modal */}
      <RoadmapFormModal
        isOpen={showModal}
        isEdit={!!editingMilestone}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      {deleteModal}
    </div>
  )
}
