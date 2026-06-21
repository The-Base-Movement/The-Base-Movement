import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { planService } from '@/services/planService'
import { type AgendaObjective, type AgendaPillar } from '@/pages/ouragenda/agendaData'
import { toast } from 'sonner'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import PlanEditorModal from '@/pages/admin/PlanManager/PlanEditorModal'
import PlanManagerHeader from '@/pages/admin/PlanManager/PlanManagerHeader'
import PlanManagerPillarsPanel from '@/pages/admin/PlanManager/PlanManagerPillarsPanel'

export default function PlanManager() {
  const [pillars, setPillars] = useState<AgendaPillar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPillar, setEditingPillar] = useState<AgendaPillar | null>(null)
  const { openDelete, modal: deleteModal } = useDeleteModal()

  const [formId, setFormId] = useState('')
  const [formNumber, setFormNumber] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formColor, setFormColor] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formObjectives, setFormObjectives] = useState<AgendaObjective[]>([])

  const fetchPillars = async () => {
    setIsLoading(true)
    try {
      const data = await planService.getPlanPillars()
      setPillars(data)
    } catch {
      toast.error('Failed to load plan pillars from the database')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPillars()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleOpenModal = (pillar: AgendaPillar | null = null) => {
    if (pillar) {
      setEditingPillar(pillar)
      setFormId(pillar.id)
      setFormNumber(pillar.number)
      setFormTitle(pillar.title)
      setFormIcon(pillar.icon)
      setFormColor(pillar.color)
      setFormSummary(pillar.summary)
      setFormObjectives(JSON.parse(JSON.stringify(pillar.objectives)))
    } else {
      setEditingPillar(null)
      setFormId('')
      setFormNumber(`0${pillars.length + 1}`)
      setFormTitle('')
      setFormIcon('star')
      setFormColor('hsl(var(--primary))')
      setFormSummary('')
      setFormObjectives([])
    }
    setShowModal(true)
  }

  const handleAddObjective = () => {
    setFormObjectives([
      ...formObjectives,
      { title: 'New Objective', items: ['First checklist detail item'] },
    ])
  }

  const handleRemoveObjective = (objIndex: number) => {
    setFormObjectives(formObjectives.filter((_, i) => i !== objIndex))
  }

  const handleObjectiveTitleChange = (objIndex: number, title: string) => {
    const updated = [...formObjectives]
    updated[objIndex].title = title
    setFormObjectives(updated)
  }

  const handleAddChecklistItem = (objIndex: number) => {
    const updated = [...formObjectives]
    updated[objIndex].items.push('New actionable detail')
    setFormObjectives(updated)
  }

  const handleRemoveChecklistItem = (objIndex: number, itemIndex: number) => {
    const updated = [...formObjectives]
    updated[objIndex].items = updated[objIndex].items.filter((_, i) => i !== itemIndex)
    setFormObjectives(updated)
  }

  const handleChecklistItemChange = (objIndex: number, itemIndex: number, value: string) => {
    const updated = [...formObjectives]
    updated[objIndex].items[itemIndex] = value
    setFormObjectives(updated)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!formId || !formTitle || !formSummary) {
      toast.error('Please enter a unique ID, Title, and Summary for the plan pillar')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading(
      editingPillar ? 'Syncing pillar details…' : 'Creating new pillar…'
    )

    try {
      const payload: AgendaPillar = {
        id: formId.trim().toLowerCase().replace(/\s+/g, '-'),
        number: formNumber,
        title: formTitle,
        icon: formIcon,
        color: formColor,
        summary: formSummary,
        objectives: formObjectives,
      }

      const currentIdx = pillars.findIndex((p) => p.id === formId)
      const sortOrder = currentIdx !== -1 ? currentIdx + 1 : pillars.length + 1

      const success = await planService.savePlanPillar(payload, sortOrder)
      if (success) {
        toast.success(
          editingPillar ? 'Plan pillar updated successfully' : 'Plan pillar created successfully',
          { id: toastId }
        )
        setShowModal(false)
        fetchPillars()
      } else {
        toast.error('Failed to sync plan pillar', { id: toastId })
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      toast.error(errMsg, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePillar = (pillar: AgendaPillar) => {
    openDelete({
      itemName: pillar.title,
      title: 'Remove Plan Pillar',
      description:
        'This will permanently delete this pillar, including all objectives and text checklist points from the website.',
      isPermanent: true,
      successMessage: 'Pillar deleted successfully.',
      errorMessage: 'Failed to delete pillar.',
      onConfirm: async () => {
        const success = await planService.deletePlanPillar(pillar.id, pillar.title)
        if (success) fetchPillars()
        return success
      },
    })
  }

  const handleMovePillar = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === pillars.length - 1) return

    const newPillars = [...pillars]
    const swapTarget = direction === 'up' ? index - 1 : index + 1
    const temp = newPillars[index]
    newPillars[index] = newPillars[swapTarget]
    newPillars[swapTarget] = temp

    const updatedWithNumbers = newPillars.map((p, idx) => ({
      ...p,
      number: `0${idx + 1}`,
    }))

    setPillars(updatedWithNumbers)

    const batchUpdates = updatedWithNumbers.map((p, idx) => ({
      id: p.id,
      sort_order: idx + 1,
    }))

    const success = await planService.updatePillarsOrder(batchUpdates)
    if (success) {
      await Promise.all(updatedWithNumbers.map((p, idx) => planService.savePlanPillar(p, idx + 1)))
      toast.success('Pillars sorting synchronized')
      fetchPillars()
    } else {
      toast.error('Failed to save sorting order')
    }
  }

  const handleResetToDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to seed the database with the default pillars from the code configuration? This will overwrite existing pillars with the same IDs.'
      )
    ) {
      return
    }

    const toastId = toast.loading('Seeding initial plan pillars database…')
    const success = await planService.seedDefaultPillars()
    if (success) {
      toast.success('Database seeded successfully!', { id: toastId })
      fetchPillars()
    } else {
      toast.error('Failed to seed database.', { id: toastId })
    }
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PlanManagerHeader
        onResetDefaults={handleResetToDefaults}
        onCreate={() => handleOpenModal(null)}
      />

      <PlanManagerPillarsPanel
        pillars={pillars}
        isLoading={isLoading}
        onEdit={handleOpenModal}
        onDelete={handleDeletePillar}
        onMove={handleMovePillar}
        onResetToDefaults={handleResetToDefaults}
      />

      <PlanEditorModal
        showModal={showModal}
        editingPillar={editingPillar}
        isSaving={isSaving}
        formId={formId}
        formNumber={formNumber}
        formTitle={formTitle}
        formIcon={formIcon}
        formColor={formColor}
        formSummary={formSummary}
        formObjectives={formObjectives}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onFormIdChange={setFormId}
        onFormNumberChange={setFormNumber}
        onFormTitleChange={setFormTitle}
        onFormIconChange={setFormIcon}
        onFormColorChange={setFormColor}
        onFormSummaryChange={setFormSummary}
        onAddObjective={handleAddObjective}
        onRemoveObjective={handleRemoveObjective}
        onObjectiveTitleChange={handleObjectiveTitleChange}
        onAddChecklistItem={handleAddChecklistItem}
        onRemoveChecklistItem={handleRemoveChecklistItem}
        onChecklistItemChange={handleChecklistItemChange}
      />

      {deleteModal}
    </div>
  )
}
