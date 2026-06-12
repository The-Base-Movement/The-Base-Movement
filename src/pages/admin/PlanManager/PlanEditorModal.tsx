import { createPortal } from 'react-dom'
import type { AgendaPillar, AgendaObjective } from '@/pages/ouragenda/agendaData'
import type { FormEvent } from 'react'

interface Props {
  showModal: boolean
  editingPillar: AgendaPillar | null
  isSaving: boolean
  formId: string
  formNumber: string
  formTitle: string
  formIcon: string
  formColor: string
  formSummary: string
  formObjectives: AgendaObjective[]
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  onFormIdChange: (value: string) => void
  onFormNumberChange: (value: string) => void
  onFormTitleChange: (value: string) => void
  onFormIconChange: (value: string) => void
  onFormColorChange: (value: string) => void
  onFormSummaryChange: (value: string) => void
  onAddObjective: () => void
  onRemoveObjective: (objIndex: number) => void
  onObjectiveTitleChange: (objIndex: number, title: string) => void
  onAddChecklistItem: (objIndex: number) => void
  onRemoveChecklistItem: (objIndex: number, itemIndex: number) => void
  onChecklistItemChange: (objIndex: number, itemIndex: number, value: string) => void
}

export default function PlanEditorModal({
  showModal,
  editingPillar,
  isSaving,
  formId,
  formNumber,
  formTitle,
  formIcon,
  formColor,
  formSummary,
  formObjectives,
  onClose,
  onSubmit,
  onFormIdChange,
  onFormNumberChange,
  onFormTitleChange,
  onFormIconChange,
  onFormColorChange,
  onFormSummaryChange,
  onAddObjective,
  onRemoveObjective,
  onObjectiveTitleChange,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onChecklistItemChange,
}: Props) {
  if (!showModal) return null

  return createPortal(
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
      onClick={onClose}
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
          <button className="ico" style={{ width: 32, height: 32 }} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: 24,
            margin: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label htmlFor="pillar-slug" style={labelStyle}>
                Pillar Unique Slug
              </label>
              <input
                id="pillar-slug"
                type="text"
                required
                disabled={!!editingPillar}
                value={formId}
                onChange={(e) =>
                  onFormIdChange(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                }
                placeholder="e.g. education"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="pillar-number" style={labelStyle}>
                Aim Indicator Number
              </label>
              <input
                id="pillar-number"
                type="text"
                required
                value={formNumber}
                onChange={(e) => onFormNumberChange(e.target.value)}
                placeholder="e.g. 01"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="pillar-color" style={labelStyle}>
                Accent Theme Color
              </label>
              <select
                id="pillar-color"
                value={formColor}
                onChange={(e) => onFormColorChange(e.target.value)}
                style={inputStyle}
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label htmlFor="pillar-title" style={labelStyle}>
                Pillar Headline Title
              </label>
              <input
                id="pillar-title"
                type="text"
                required
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                placeholder="e.g. Quality Education for Every Ghanaian"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="pillar-icon" style={labelStyle}>
                Material Icon
              </label>
              <input
                id="pillar-icon"
                type="text"
                required
                value={formIcon}
                onChange={(e) => onFormIconChange(e.target.value)}
                placeholder="e.g. school"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pillar-summary" style={labelStyle}>
              Aim Narrative Summary
            </label>
            <textarea
              id="pillar-summary"
              required
              rows={3}
              value={formSummary}
              onChange={(e) => onFormSummaryChange(e.target.value)}
              placeholder="Summarize the core vision and aim of this strategic pillar…"
              style={textareaStyle}
            />
          </div>

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
                onClick={onAddObjective}
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
                    padding: 24,
                    border: '1px dashed hsl(var(--border))',
                    borderRadius: 4,
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                  }}
                >
                  No objectives created yet. Click the "Add Objective" button to start building.
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
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
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
                        onChange={(e) => onObjectiveTitleChange(objIdx, e.target.value)}
                        placeholder="e.g. Universal Access"
                        style={objectiveTitleInputStyle}
                      />
                      <button
                        type="button"
                        className="btn btn-dest btn-sm"
                        onClick={() => onRemoveObjective(objIdx)}
                        title="Remove Objective Block"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          delete
                        </span>
                      </button>
                    </div>

                    <div
                      style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
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
                          onClick={() => onAddChecklistItem(objIdx)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
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
                            onChange={(e) => onChecklistItemChange(objIdx, itemIdx, e.target.value)}
                            placeholder="Enter actionable detail summary sentence…"
                            style={checklistInputStyle}
                          />
                          <button
                            type="button"
                            className="ico"
                            style={{ width: 24, height: 24 }}
                            onClick={() => onRemoveChecklistItem(objIdx, itemIdx)}
                            title="Remove Bullet Point"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
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
              onClick={onClose}
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
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  height: 34,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "'Public Sans', sans-serif",
  background: 'hsl(var(--container-low))',
  color: 'hsl(var(--on-surface))',
}

const textareaStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontSize: 12,
  lineHeight: 1.4,
  background: 'hsl(var(--container-low))',
  color: 'hsl(var(--on-surface))',
  resize: 'vertical' as const,
}

const objectiveTitleInputStyle = {
  flex: 1,
  height: 30,
  padding: '0 8px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 'var(--font-weight-medium, 500)',
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--on-surface))',
}

const checklistInputStyle = {
  flex: 1,
  height: 28,
  padding: '0 8px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontSize: 11.5,
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--on-surface-muted))',
}
