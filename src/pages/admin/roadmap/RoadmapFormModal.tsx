import { createPortal } from 'react-dom'
import type { Milestone } from '@/services/adminService'
import { inputSt, selectSt, labelSt } from './utils'

interface RoadmapFormModalProps {
  isOpen: boolean
  isEdit: boolean
  onClose: () => void
  formData: {
    title: string
    description: string
    target_date: string
    status: Milestone['status']
    category: string
    importance_level: Milestone['importance_level']
    target_members: number
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string
      description: string
      target_date: string
      status: Milestone['status']
      category: string
      importance_level: Milestone['importance_level']
      target_members: number
    }>
  >
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function RoadmapFormModal({
  isOpen,
  isEdit,
  onClose,
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
}: RoadmapFormModalProps) {
  if (!isOpen) return null

  return createPortal(
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--surface))',
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
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 15,
              color: 'hsl(var(--on-surface))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}
            >
              {isEdit ? 'edit' : 'add'}
            </span>
            {isEdit ? 'Refine objective' : 'Add milestone'}
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
            onClick={onClose}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
            >
              close
            </span>
          </button>
        </div>
        <form onSubmit={onSubmit}>
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
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              Discard
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Syncing…' : isEdit ? 'Commit changes' : 'Add milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
