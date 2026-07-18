import { createPortal } from 'react-dom'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

interface PollCandidate {
  name: string
  position: string
  avatar_url: string | null
}

interface PollCandidateMatch {
  id: string
  name: string
  avatar_url: string | null
  registration_number: string
}

interface PollCreateEditModalProps {
  editingPollId: string | null
  pollChapterName: string
  pollTitle: string
  pollDescription: string
  pollEndsAt: string
  pollBannerPreview: string | null
  pollCandidates: PollCandidate[]
  pollCandidateSearch: string
  pollCandidateMatches: PollCandidateMatch[]
  pollCandidateInput: { name: string; position: string; avatar_url: string | null }
  showCandidateDropdown: boolean
  isCreatingPoll: boolean
  onClose: () => void
  onBack: () => void
  onTitleChange: (val: string) => void
  onDescriptionChange: (val: string) => void
  onEndsAtChange: (val: string) => void
  onBannerFileChange: (file: File) => void
  onBannerClear: () => void
  onCandidateSearchChange: (val: string) => void
  onCandidatePositionChange: (val: string) => void
  onSelectCandidate: (m: PollCandidateMatch) => void
  onAddCandidate: () => void
  onRemoveCandidate: (index: number) => void
  onHideCandidateDropdown: () => void
  onCreatePoll: () => void
}

export function PollCreateEditModal({
  editingPollId,
  pollChapterName,
  pollTitle,
  pollDescription,
  pollEndsAt,
  pollBannerPreview,
  pollCandidates,
  pollCandidateSearch,
  pollCandidateMatches,
  pollCandidateInput,
  showCandidateDropdown,
  isCreatingPoll,
  onClose,
  onBack,
  onTitleChange,
  onDescriptionChange,
  onEndsAtChange,
  onBannerFileChange,
  onBannerClear,
  onCandidateSearchChange,
  onCandidatePositionChange,
  onSelectCandidate,
  onAddCandidate,
  onRemoveCandidate,
  onHideCandidateDropdown,
  onCreatePoll,
}: PollCreateEditModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'hsl(var(--card))',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            background: 'hsl(var(--container-low))',
            borderTop: '4px solid hsl(var(--primary))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--accent))' }}
            >
              how_to_vote
            </span>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 15,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {editingPollId ? 'Edit poll' : 'Create chapter poll'}
            </p>
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              margin: '3px 0 0',
              fontWeight: 'var(--font-weight-normal, 400)',
            }}
          >
            {pollChapterName}
          </p>
        </div>

        <div
          style={{
            padding: 20,
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Banner upload */}
          <div>
            <label htmlFor="input-banner-upload" style={labelStyle}>
              Poll banner (optional)
            </label>
            {pollBannerPreview ? (
              <div
                style={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid hsl(var(--border))',
                  marginBottom: 8,
                }}
              >
                <img
                  src={pollBannerPreview}
                  alt="Banner preview"
                  style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={onBannerClear}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    color: 'hsl(var(--on-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    close
                  </span>
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  border: '1px dashed hsl(var(--border))',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
                >
                  add_photo_alternate
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Click to upload banner image
                </span>
                <input
                  type="file"
                  id="input-banner-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    onBannerFileChange(file)
                  }}
                />
              </label>
            )}
          </div>

          <div>
            <label htmlFor="input-poll-title" style={labelStyle}>
              Poll title
            </label>
            <input
              id="input-poll-title"
              type="text"
              value={pollTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Diaspora Leadership Election 2025"
              style={fieldStyle}
            />
          </div>
          <div>
            <label htmlFor="textarea-poll-desc" style={labelStyle}>
              Description (optional)
            </label>
            <textarea
              id="textarea-poll-desc"
              value={pollDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe what members are voting on…"
              rows={2}
              style={{
                ...fieldStyle,
                height: 'auto',
                padding: '10px 12px',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>
          <div>
            <label htmlFor="input-poll-ends" style={labelStyle}>
              Voting ends
            </label>
            <input
              id="input-poll-ends"
              type="datetime-local"
              value={pollEndsAt}
              onChange={(e) => onEndsAtChange(e.target.value)}
              style={fieldStyle}
            />
          </div>

          {/* Candidates */}
          <div>
            <label style={labelStyle}>Candidates</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 2, position: 'relative' }}>
                <label htmlFor="input-poll-cand-search" style={{ display: 'none' }}>
                  Search candidates
                </label>
                <input
                  id="input-poll-cand-search"
                  type="text"
                  value={pollCandidateSearch}
                  onChange={(e) => onCandidateSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddCandidate()}
                  placeholder="Search member or type name…"
                  style={fieldStyle}
                />
                {showCandidateDropdown && pollCandidateMatches.length > 0 && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                      onClick={onHideCandidateDropdown}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        zIndex: 20,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                      }}
                    >
                      {pollCandidateMatches.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onSelectCandidate(m)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid hsl(var(--border))',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container-low))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              flexShrink: 0,
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {m.avatar_url ? (
                              <img
                                src={m.avatar_url}
                                alt={m.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                crossOrigin="anonymous"
                              />
                            ) : (
                              m.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                color: 'hsl(var(--on-surface))',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {m.name}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 10,
                                fontWeight: 'var(--font-weight-normal, 400)',
                                color: 'hsl(var(--on-surface-muted))',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {m.registration_number}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                aria-label="Candidate position (optional)"
                type="text"
                value={pollCandidateInput.position}
                onChange={(e) => onCandidatePositionChange(e.target.value)}
                placeholder="Position (optional)"
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button
                className="btn btn-outline btn-sm"
                onClick={onAddCandidate}
                style={{ height: 42, flexShrink: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  add
                </span>
              </button>
            </div>

            {pollCandidates.length === 0 ? (
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                }}
              >
                Add at least 2 candidates to proceed.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pollCandidates.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        background: 'hsl(var(--border))',
                        flexShrink: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {c.avatar_url ? (
                        <img
                          src={c.avatar_url}
                          alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {c.name}
                      </span>
                      {c.position && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-normal, 400)',
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {c.position}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveCandidate(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button onClick={onBack} className="btn btn-outline" style={{ flex: 1, height: 42 }}>
            Back
          </button>
          <button
            onClick={onCreatePoll}
            disabled={isCreatingPoll}
            className="btn btn-primary"
            style={{ flex: 1, height: 42 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              how_to_vote
            </span>
            {isCreatingPoll
              ? editingPollId
                ? 'Saving…'
                : 'Creating…'
              : editingPollId
                ? 'Save changes'
                : 'Create poll'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
