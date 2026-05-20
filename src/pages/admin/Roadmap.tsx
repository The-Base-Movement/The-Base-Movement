import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { adminService, type Milestone } from '@/services/adminService'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { useDeleteModal } from '@/hooks/useDeleteModal'

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: '#fff',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}
const selectSt: React.CSSProperties = { ...inputSt, appearance: 'none' }
const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 800,
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}
const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 800,
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
}

const statusStyle = (s: Milestone['status']): React.CSSProperties => {
  if (s === 'Completed')
    return {
      background: 'rgba(34,197,94,0.1)',
      color: 'hsl(var(--primary))',
      border: '1px solid rgba(34,197,94,0.2)',
    }
  if (s === 'In Progress')
    return {
      background: 'rgba(245,158,11,0.1)',
      color: 'hsl(var(--accent))',
      border: '1px solid rgba(245,158,11,0.2)',
    }
  return {
    background: 'rgba(239,68,68,0.1)',
    color: 'hsl(var(--destructive))',
    border: '1px solid rgba(239,68,68,0.2)',
  }
}

const statusDot = (s: Milestone['status']): string => {
  if (s === 'Completed') return 'hsl(var(--primary))'
  if (s === 'In Progress') return 'hsl(var(--accent))'
  return 'hsl(var(--destructive))'
}

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
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: 'hsl(var(--on-surface))',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              flag
            </span>
            National strategic roadmap
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 4,
            }}
          >
            Manage movement objectives, mobilization phases, and strategic timelines.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            add
          </span>
          Add milestone
        </button>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI
          label="Total Milestones"
          value={milestones.length}
          description="Strategic objectives"
          trend={{ direction: 'neutral', value: 'Live' }}
        />
        <TacticalKPI
          label="Completion Rate"
          value={`${milestones.length ? Math.round((milestones.filter((m) => m.status === 'Completed').length / milestones.length) * 100) : 0}%`}
          description="Verified achieved"
          trend={{ direction: 'up', value: 'Optimal' }}
        />
        <TacticalKPI
          label="Active Operations"
          value={milestones.filter((m) => m.status === 'In Progress').length}
          description="In mobilization"
          trend={{ direction: 'up', value: 'Active' }}
        />
        <TacticalKPI
          label="Upcoming Phases"
          value={milestones.filter((m) => m.status === 'Upcoming').length}
          description="Strategic pipeline"
        />
      </div>

      {/* Table panel */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}
            >
              schedule
            </span>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              National objective timeline
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Search milestones…"
              name="searchQuery"
              id="input-1c539d"
              placeholder="Search milestones…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: 36,
                paddingLeft: 30,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                outline: 'none',
                background: '#fff',
                color: 'hsl(var(--on-surface))',
                width: 220,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Milestone objective</th>
                <th>Category</th>
                <th>Status</th>
                <th>Target date</th>
                <th>Priority</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ animation: 'pulse 2s infinite' }}>
                    <td>
                      <div
                        style={{
                          height: 14,
                          background: 'hsl(var(--border))',
                          borderRadius: 4,
                          width: 200,
                        }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          height: 14,
                          background: 'hsl(var(--border))',
                          borderRadius: 4,
                          width: 80,
                        }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          height: 22,
                          background: 'hsl(var(--border))',
                          borderRadius: 4,
                          width: 90,
                        }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          height: 14,
                          background: 'hsl(var(--border))',
                          borderRadius: 4,
                          width: 90,
                        }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          height: 14,
                          background: 'hsl(var(--border))',
                          borderRadius: 4,
                          width: 60,
                        }}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          height: 28,
                          background: 'hsl(var(--border))',
                          borderRadius: 4,
                          width: 70,
                          marginLeft: 'auto',
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : filteredMilestones.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    No strategic objectives found.
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((milestone) => (
                  <tr key={milestone.id}>
                    <td>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          fontSize: 12,
                          color: 'hsl(var(--on-surface))',
                          marginBottom: 3,
                        }}
                      >
                        {milestone.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 280,
                        }}
                      >
                        {milestone.description}
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {milestone.category}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: statusDot(milestone.status),
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ ...pillBase, ...statusStyle(milestone.status) }}>
                          {milestone.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          calendar_today
                        </span>
                        {new Date(milestone.target_date!).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        color:
                          milestone.importance_level === 'Critical'
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {milestone.importance_level}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'hsl(var(--accent))',
                            color: '#fff',
                            border: 'none',
                            width: 34,
                            height: 34,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={() => handleOpenModal(milestone)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            edit
                          </span>
                        </button>
                        <button
                          className="btn btn-dest btn-sm"
                          style={{
                            width: 34,
                            height: 34,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={() => handleDelete(milestone)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 6,
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 15,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}
                  >
                    {editingMilestone ? 'edit' : 'add'}
                  </span>
                  {editingMilestone ? 'Refine objective' : 'Add milestone'}
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setShowModal(false)}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
                  >
                    close
                  </span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    padding: '24px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 20,
                  }}
                >
                  {/* Left */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label htmlFor="input-781ac1" style={labelSt}>
                        Objective title
                      </label>
                      <input
                        aria-label="e.g. National Logistics Hub"
                        name="name-781ac1"
                        id="input-781ac1"
                        required
                        style={inputSt}
                        placeholder="e.g. National Logistics Hub"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="select-1dd723" style={labelSt}>
                        Strategic category
                      </label>
                      <select
                        name="name-1dd723"
                        id="select-1dd723"
                        style={selectSt}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option>Mobilization</option>
                        <option>Infrastructure</option>
                        <option>Policy</option>
                        <option>Logistics</option>
                        <option>Communication</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="input-984beb" style={labelSt}>
                        Target date
                      </label>
                      <input
                        name="name-984beb"
                        id="input-984beb"
                        required
                        type="date"
                        style={inputSt}
                        value={formData.target_date}
                        onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="input-d35a6f" style={labelSt}>
                        Target member count
                      </label>
                      <input
                        aria-label="0"
                        name="name-d35a6f"
                        id="input-d35a6f"
                        type="number"
                        style={inputSt}
                        placeholder="0"
                        value={formData.target_members}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_members: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  {/* Right */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label htmlFor="select-170815" style={labelSt}>
                        Status
                      </label>
                      <select
                        name="name-170815"
                        id="select-170815"
                        style={selectSt}
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as Milestone['status'],
                          })
                        }
                      >
                        <option>Upcoming</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-96c1d5" style={labelSt}>
                        Importance level
                      </label>
                      <select
                        name="name-96c1d5"
                        id="select-96c1d5"
                        style={selectSt}
                        value={formData.importance_level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            importance_level: e.target.value as Milestone['importance_level'],
                          })
                        }
                      >
                        <option>Normal</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="textarea-90ba7c" style={labelSt}>
                        Objective description
                      </label>
                      <textarea
                        aria-label="Detailed breakdown of the milestone…"
                        name="name-90ba7c"
                        id="textarea-90ba7c"
                        required
                        rows={5}
                        style={{
                          ...inputSt,
                          height: 'auto',
                          padding: '10px 12px',
                          resize: 'none',
                          lineHeight: 1.6,
                        }}
                        placeholder="Detailed breakdown of the milestone…"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid hsl(var(--border))',
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowModal(false)}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Syncing…'
                      : editingMilestone
                        ? 'Commit changes'
                        : 'Add milestone'}
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
