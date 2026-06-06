import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { planService } from '@/services/planService'
import { type AgendaPillar, type AgendaObjective } from '@/pages/ouragenda/agendaData'
import { toast } from 'sonner'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { BrandLine } from '@/components/ui/BrandLine'

export default function PlanManager() {
  const [pillars, setPillars] = useState<AgendaPillar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPillar, setEditingPillar] = useState<AgendaPillar | null>(null)
  const { openDelete, modal: deleteModal } = useDeleteModal()

  // Form states
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
    fetchPillars()
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
      setFormObjectives(JSON.parse(JSON.stringify(pillar.objectives))) // deep copy
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

  const handleChecklistItemChange = (objIndex: number, itemIndex: number, val: string) => {
    const updated = [...formObjectives]
    updated[objIndex].items[itemIndex] = val
    setFormObjectives(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Calculate sort order (keep existing or push to end)
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

    // Recalculate number attributes sequentially for clean branding UI
    const updatedWithNumbers = newPillars.map((p, idx) => ({
      ...p,
      number: `0${idx + 1}`,
    }))

    setPillars(updatedWithNumbers)

    // Save batch sort order updates
    const batchUpdates = updatedWithNumbers.map((p, idx) => ({
      id: p.id,
      sort_order: idx + 1,
    }))

    const success = await planService.updatePillarsOrder(batchUpdates)
    if (success) {
      // Re-save modified aim numbers
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
      {/* Page Header */}
      <div
        className="top"
        style={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 0,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              route
            </span>
            Mission Plan Manager
          </h2>
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <BrandLine />
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12.5,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Manage the strategic plan pillars, key summaries, specific objectives, and actionable
            checklist points.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-outline btn-sm" onClick={handleResetToDefaults}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              database
            </span>
            Seed Defaults
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal(null)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            Create Pillar
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="panel" style={{ padding: 24 }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '3px solid hsl(var(--primary))',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Loading plan pillars from command center…
            </p>
          </div>
        ) : pillars.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              gap: 16,
              textAlign: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.5 }}
            >
              folder_open
            </span>
            <div>
              <h4
                style={{ margin: 0, fontWeight: 'var(--font-weight-semibold, 600)', fontSize: 15 }}
              >
                No plan pillars seeded in the database
              </h4>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12.5,
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: 6,
                  maxWidth: 380,
                }}
              >
                The `plan_pillars` table is currently empty. Click the button below to automatically
                seed the database with the default six aims.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleResetToDefaults}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                database
              </span>
              Seed initial default plan
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10.5,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              Pillars of the Movement ({pillars.length})
            </p>
            <div className="table-responsive desktop-only">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                      }}
                    >
                      Aim
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                      }}
                    >
                      Pillar details
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                      }}
                    >
                      Objectives
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        width: 100,
                      }}
                    >
                      Order
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        width: 120,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pillars.map((pillar, idx) => (
                    <tr
                      key={pillar.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border))',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Aim and Icon */}
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 4,
                              background: `${pillar.color}15`,
                              color: pillar.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              {pillar.icon}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 10,
                                color: pillar.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Aim {pillar.number}
                            </span>
                            <div
                              style={{
                                fontFamily: "'Courier New', monospace",
                                fontSize: 10,
                                color: 'hsl(var(--on-surface-muted))',
                                marginTop: 2,
                              }}
                            >
                              #{pillar.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pillar Title and Summary */}
                      <td style={{ padding: '16px', verticalAlign: 'top', maxWidth: 360 }}>
                        <div
                          style={{
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {pillar.title}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 11.5,
                            color: 'hsl(var(--on-surface-muted))',
                            marginTop: 6,
                            lineHeight: 1.4,
                          }}
                        >
                          {pillar.summary}
                        </div>
                      </td>

                      {/* Objectives count and overview */}
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {pillar.objectives.length === 0 ? (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                color: 'hsl(var(--on-surface-muted))',
                                background: 'rgba(0,0,0,0.05)',
                                padding: '2px 6px',
                                borderRadius: 2,
                              }}
                            >
                              No objectives defined
                            </span>
                          ) : (
                            pillar.objectives.map((obj, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  color: 'hsl(var(--on-surface))',
                                  background: 'hsl(var(--container-low))',
                                  border: '1px solid hsl(var(--border))',
                                  padding: '2px 8px',
                                  borderRadius: 2,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                {obj.title}
                                <span
                                  style={{
                                    fontSize: 9,
                                    opacity: 0.5,
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                  }}
                                >
                                  ({obj.items.length})
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Sort Order Up/Down buttons */}
                      <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            className="ico"
                            style={{ width: 28, height: 28 }}
                            disabled={idx === 0}
                            onClick={() => handleMovePillar(idx, 'up')}
                            title="Move Up"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              arrow_upward
                            </span>
                          </button>
                          <button
                            className="ico"
                            style={{ width: 28, height: 28 }}
                            disabled={idx === pillars.length - 1}
                            onClick={() => handleMovePillar(idx, 'down')}
                            title="Move Down"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              arrow_downward
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenModal(pillar)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                              edit
                            </span>
                            Edit
                          </button>
                          <button
                            className="btn btn-dest btn-sm"
                            onClick={() => handleDeletePillar(pillar)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div
              className="mobile-only"
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {pillars.map((pillar, idx) => (
                <div
                  key={pillar.id}
                  className="panel"
                  style={{ overflow: 'hidden', position: 'relative' }}
                >
                  {/* Color bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: pillar.color,
                    }}
                  />

                  <div style={{ padding: '14px 16px 14px 20px' }}>
                    {/* Aim + Icon row */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-sm)',
                          background: `${pillar.color}15`,
                          color: pillar.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          {pillar.icon}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 10,
                            color: pillar.color,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.05em',
                          }}
                        >
                          Aim {pillar.number}
                        </span>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            marginTop: 2,
                          }}
                        >
                          {pillar.title}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11.5,
                        color: 'hsl(var(--on-surface-muted))',
                        lineHeight: 1.5,
                        margin: '0 0 10px',
                      }}
                    >
                      {pillar.summary}
                    </p>

                    {/* Objectives chips */}
                    {pillar.objectives.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {pillar.objectives.map((obj, i) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 10,
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {obj.title} <span style={{ opacity: 0.5 }}>({obj.items.length})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action footer */}
                  <div
                    style={{
                      padding: '10px 16px 10px 20px',
                      borderTop: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--container-low))',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
                      <button
                        className="ico"
                        style={{ width: 28, height: 28 }}
                        disabled={idx === 0}
                        onClick={() => handleMovePillar(idx, 'up')}
                        title="Move up"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          arrow_upward
                        </span>
                      </button>
                      <button
                        className="ico"
                        style={{ width: 28, height: 28 }}
                        disabled={idx === pillars.length - 1}
                        onClick={() => handleMovePillar(idx, 'down')}
                        title="Move down"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          arrow_downward
                        </span>
                      </button>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleOpenModal(pillar)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        edit
                      </span>
                      Edit
                    </button>
                    <button
                      className="btn btn-dest btn-sm"
                      style={{ padding: '0 10px' }}
                      onClick={() => handleDeletePillar(pillar)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 16,
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              className="panel"
              style={{
                width: '100%',
                maxWidth: 720,
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 16,
                    }}
                  >
                    {editingPillar ? 'Edit Strategic Pillar' : 'Create New Plan Pillar'}
                  </h4>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Compose aims, objectives, and text checklist descriptions.
                  </p>
                </div>
                <button
                  className="ico"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setShowModal(false)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  padding: 24,
                  margin: 0,
                }}
              >
                {/* Form Fields: Slug, Aim Number, Color */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      htmlFor="pillar-slug"
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 6,
                      }}
                    >
                      Pillar Unique Slug
                    </label>
                    <input
                      id="pillar-slug"
                      type="text"
                      required
                      disabled={!!editingPillar}
                      value={formId}
                      onChange={(e) =>
                        setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                      }
                      placeholder="e.g. education"
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: "'Courier New', monospace",
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pillar-number"
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 6,
                      }}
                    >
                      Aim Indicator Number
                    </label>
                    <input
                      id="pillar-number"
                      type="text"
                      required
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      placeholder="e.g. 01"
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: "'Public Sans', sans-serif",
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pillar-color"
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 6,
                      }}
                    >
                      Accent Theme Color
                    </label>
                    <select
                      id="pillar-color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 12,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      <option value="hsl(var(--primary))">Primary Green</option>
                      <option value="hsl(var(--destructive))">Destructive Red</option>
                      <option value="hsl(var(--accent))">Accent Gold</option>
                      <option value="hsl(156 100% 21%)">Base Emerald</option>
                      <option value="hsl(45 80% 45%)">Base Gold</option>
                      <option value="hsl(0 85% 45%)">Base Crimson</option>
                      <option value="hsl(210 100% 40%)">Patriot Blue</option>
                    </select>
                  </div>
                </div>

                {/* Title, Icon */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      htmlFor="pillar-title"
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 6,
                      }}
                    >
                      Pillar Headline Title
                    </label>
                    <input
                      id="pillar-title"
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Quality Education for Every Ghanaian"
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 12,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pillar-icon"
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 6,
                      }}
                    >
                      Material Icon
                    </label>
                    <input
                      id="pillar-icon"
                      type="text"
                      required
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder="e.g. school"
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 10px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: "'Courier New', monospace",
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface))',
                      }}
                    />
                  </div>
                </div>

                {/* Summary description */}
                <div>
                  <label
                    htmlFor="pillar-summary"
                    style={{
                      display: 'block',
                      fontSize: 10.5,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 6,
                    }}
                  >
                    Aim Narrative Summary
                  </label>
                  <textarea
                    id="pillar-summary"
                    required
                    rows={3}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Summarize the core vision and aim of this strategic pillar…"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      fontSize: 12,
                      lineHeight: 1.4,
                      background: 'hsl(var(--container-low))',
                      color: 'hsl(var(--on-surface))',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Nested Objectives array editor */}
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      Actionable Objectives
                    </h5>
                    <p
                      style={{
                        margin: '2px 0 10px',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      Break this aim down into core objectives with actionable text bullet checklist
                      items.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%' }}
                      onClick={handleAddObjective}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        add
                      </span>
                      Add Objective
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {formObjectives.length === 0 ? (
                      <div
                        style={{
                          padding: '24px',
                          border: '1px dashed hsl(var(--border))',
                          borderRadius: 4,
                          textAlign: 'center',
                          color: 'hsl(var(--on-surface-muted))',
                          fontSize: 12,
                        }}
                      >
                        No objectives created yet. Click the "Add Objective" button to start
                        building.
                      </div>
                    ) : (
                      formObjectives.map((obj, objIdx) => (
                        <div
                          key={objIdx}
                          style={{
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 4,
                            padding: 16,
                            background: 'rgba(0,0,0,0.02)',
                            position: 'relative',
                          }}
                        >
                          {/* Header for objective block */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                color: 'hsl(var(--primary))',
                              }}
                            >
                              Obj #{objIdx + 1}
                            </span>
                            <input
                              type="text"
                              required
                              aria-label={`Objective ${objIdx + 1} Title`}
                              value={obj.title}
                              onChange={(e) => handleObjectiveTitleChange(objIdx, e.target.value)}
                              placeholder="e.g. Universal Access"
                              style={{
                                flex: 1,
                                height: 30,
                                padding: '0 8px',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                background: 'hsl(var(--surface))',
                                color: 'hsl(var(--on-surface))',
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-dest btn-sm"
                              onClick={() => handleRemoveObjective(objIdx)}
                              title="Remove Objective Block"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                delete
                              </span>
                            </button>
                          </div>

                          {/* Checklist items nesting list */}
                          <div
                            style={{
                              paddingLeft: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  color: 'hsl(var(--on-surface-muted))',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Bullet Checklist Points
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '2px 6px', fontSize: 9.5 }}
                                onClick={() => handleAddChecklistItem(objIdx)}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 11 }}
                                >
                                  add
                                </span>
                                Add Bullet
                              </button>
                            </div>

                            {obj.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
                                >
                                  circle
                                </span>
                                <input
                                  type="text"
                                  required
                                  aria-label={`Checklist Item ${itemIdx + 1} under Objective ${objIdx + 1}`}
                                  value={item}
                                  onChange={(e) =>
                                    handleChecklistItemChange(objIdx, itemIdx, e.target.value)
                                  }
                                  placeholder="Enter actionable detail summary sentence…"
                                  style={{
                                    flex: 1,
                                    height: 28,
                                    padding: '0 8px',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 4,
                                    fontSize: 11.5,
                                    background: 'hsl(var(--surface))',
                                    color: 'hsl(var(--on-surface-muted))',
                                  }}
                                />
                                <button
                                  type="button"
                                  className="ico"
                                  style={{ width: 24, height: 24 }}
                                  onClick={() => handleRemoveChecklistItem(objIdx, itemIdx)}
                                  title="Remove Bullet Point"
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 13 }}
                                  >
                                    close
                                  </span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Modal Footer / Save Buttons */}
                <div
                  style={{
                    borderTop: '1px solid hsl(var(--border))',
                    paddingTop: 20,
                    marginTop: 10,
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    disabled={isSaving}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#fff',
                            animation: 'spin 0.7s linear infinite',
                            flexShrink: 0,
                          }}
                        />
                        Saving changes…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          save
                        </span>
                        Save Pillar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {deleteModal}
    </div>
  )
}
