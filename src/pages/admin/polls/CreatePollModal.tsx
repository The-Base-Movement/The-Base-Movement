/**
 * polls/CreatePollModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Portal modal for creating a new poll/campaign.
 * Rendered via createPortal into document.body.
 *
 * Form fields:
 *  - Campaign question / topic (text input)
 *  - Target Audience Base (GHANA / DIASPORA select)
 *  - Specific Region or Target Country (dynamic select based on targetBase)
 *  - Operational end date (date picker)
 *  - Engagement Options (dynamic list, minimum 2 required)
 *
 * Validation: at least 2 non-empty options required before submit.
 *
 * Props:
 *  newPoll           — Controlled form state object
 *  setNewPoll        — State setter for newPoll
 *  availableRegions  — Ghana regions from adminService.getGhanaRegions()
 *  availableCountries— Countries from adminService.getCountries()
 *  isSubmitting      — Drives loading state on submit button
 *  onSubmit          — Form submit handler
 *  onClose           — Closes the modal without saving
 */

import { createPortal } from 'react-dom'
import { inputSt, selectSt, labelSt, modalBackdrop, modalBox, modalCloseBtn } from './styles'

interface NewPoll {
  question: string
  targetBase: string
  region: string
  country: string
  status: string
  endDate: string
  options: string[]
}

interface CreatePollModalProps {
  newPoll: NewPoll
  setNewPoll: (poll: NewPoll) => void
  availableRegions: { id: string; name: string }[]
  availableCountries: { name: string; dialing_code: string; is_diaspora: boolean }[]
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function CreatePollModal({
  newPoll,
  setNewPoll,
  availableRegions,
  availableCountries,
  isSubmitting,
  onSubmit,
  onClose,
}: CreatePollModalProps) {
  return createPortal(
    <div style={modalBackdrop}>
      <div style={modalBox(720)}>
        {/* Modal header */}
        <div className="ph">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13.5,
              color: 'hsl(var(--on-surface))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}
            >
              add
            </span>
            Create Campaign
          </span>
          <button aria-label="Close creation modal" style={modalCloseBtn} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ padding: 24 }}>
            <div className="settings-form-grid">
              {/* Left: core details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Question */}
                <div>
                  <label htmlFor="input-poll-question" style={labelSt}>
                    Campaign question / topic
                  </label>
                  <input
                    id="input-poll-question"
                    aria-label="e.g. Should we increase regional chapter funding?"
                    name="question"
                    style={inputSt}
                    required
                    placeholder="e.g. Should we increase regional chapter funding?"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  />
                </div>

                {/* Target Base */}
                <div>
                  <label htmlFor="select-target-base" style={labelSt}>
                    Target Audience Base
                  </label>
                  <select
                    name="targetBase"
                    id="select-target-base"
                    style={selectSt}
                    value={newPoll.targetBase}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewPoll({
                        ...newPoll,
                        targetBase: val,
                        region: val === 'GHANA' ? 'National' : 'International',
                      })
                    }}
                  >
                    <option value="GHANA">Ghana Local Base</option>
                    <option value="DIASPORA">Diaspora Global Base</option>
                  </select>
                </div>

                {/* Region or Country — changes based on targetBase */}
                <div>
                  <label htmlFor="select-target-region" style={labelSt}>
                    {newPoll.targetBase === 'GHANA' ? 'Specific Region' : 'Target Country'}
                  </label>
                  <select
                    name="targetRegion"
                    id="select-target-region"
                    style={selectSt}
                    value={newPoll.targetBase === 'GHANA' ? newPoll.region : newPoll.country}
                    onChange={(e) => {
                      if (newPoll.targetBase === 'GHANA')
                        setNewPoll({ ...newPoll, region: e.target.value })
                      else setNewPoll({ ...newPoll, country: e.target.value })
                    }}
                  >
                    {newPoll.targetBase === 'GHANA' ? (
                      <>
                        <option value="National">All Regions (National)</option>
                        {availableRegions.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option value="International">All Countries (Global)</option>
                        {availableCountries.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* End date */}
                <div>
                  <label htmlFor="input-poll-end-date" style={labelSt}>
                    Operational end date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 15,
                        color: 'hsl(var(--on-surface-muted))',
                        pointerEvents: 'none',
                      }}
                    >
                      calendar_today
                    </span>
                    <input
                      name="endDate"
                      id="input-poll-end-date"
                      type="date"
                      style={{ ...inputSt, paddingLeft: 34 }}
                      value={newPoll.endDate}
                      onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right: poll options builder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <label style={{ ...labelSt, marginBottom: 0 }}>Engagement Options</label>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Min 2 Required
                  </span>
                </div>

                {/* Dynamic option inputs */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}
                >
                  {newPoll.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8 }}>
                      <input
                        name={`opt-${idx}`}
                        id={`input-395525-${idx}`}
                        style={inputSt}
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newPoll.options]
                          updated[idx] = e.target.value
                          setNewPoll({ ...newPoll, options: updated })
                        }}
                      />
                      {/* Remove option button — only shown when > 2 options exist */}
                      {newPoll.options.length > 2 && (
                        <button
                          type="button"
                          style={{
                            flexShrink: 0,
                            width: 40,
                            height: 40,
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 4,
                            background: 'hsl(var(--container-low))',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'hsl(var(--destructive))',
                          }}
                          onClick={() =>
                            setNewPoll({
                              ...newPoll,
                              options: newPoll.options.filter((_, i) => i !== idx),
                            })
                          }
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add option button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    add
                  </span>
                  Add Selection
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: 'center', height: 44 }}
              onClick={onClose}
            >
              Discard
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', height: 44 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Launching…' : 'Deploy Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
