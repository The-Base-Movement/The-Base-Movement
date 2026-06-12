import { createPortal } from 'react-dom'
import type { Chapter } from '@/services/adminService'

interface PollSummary {
  id: string
  title: string
  description: string | null
  ends_at: string
  banner_url: string | null
  total_votes: number
  candidates: { id: string; name: string; position: string | null; avatar_url: string | null }[]
}

interface PollManagementModalProps {
  managePollChapterName: string
  managePollChapterId: string
  chapterPolls: PollSummary[]
  loadingPolls: boolean
  chapters: Chapter[]
  onClose: () => void
  onNewPoll: (chapter: Chapter) => void
  onEditPoll: (chapter: Chapter, poll: PollSummary) => void
  onClosePollEarly: (pollId: string) => void
  onDeletePoll: (pollId: string) => void
}

export function PollManagementModal({
  managePollChapterName,
  managePollChapterId,
  chapterPolls,
  loadingPolls,
  chapters,
  onClose,
  onNewPoll,
  onEditPoll,
  onClosePollEarly,
  onDeletePoll,
}: PollManagementModalProps) {
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
          maxWidth: 520,
          background: 'hsl(var(--surface))',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                Chapter polls
              </p>
            </div>
            <button
              onClick={() => {
                const ch = chapters.find((c) => c.id === managePollChapterId)
                if (ch) {
                  onClose()
                  onNewPoll(ch)
                }
              }}
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                add
              </span>
              New poll
            </button>
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
            {managePollChapterName}
          </p>
        </div>

        {/* Poll list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingPolls ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                fontWeight: 'var(--font-weight-normal, 400)',
              }}
            >
              Loading polls…
            </div>
          ) : chapterPolls.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 36,
                  color: 'hsl(var(--border))',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                how_to_vote
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No polls yet for this chapter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {chapterPolls.map((poll, i) => {
                const isOpen = new Date(poll.ends_at) > new Date()
                const ch = chapters.find((c) => c.id === managePollChapterId)
                return (
                  <div
                    key={poll.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom:
                        i < chapterPolls.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 13,
                              color: 'hsl(var(--on-surface))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {poll.title}
                          </span>
                          <span
                            className={`pill ${isOpen ? 'pill-ok' : 'pill-mute'}`}
                            style={{ flexShrink: 0, fontSize: 9 }}
                          >
                            {isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 'var(--font-weight-normal, 400)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {isOpen ? 'Closes' : 'Closed'}{' '}
                            {new Date(poll.ends_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 'var(--font-weight-normal, 400)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 'var(--font-weight-normal, 400)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {poll.candidates.length} candidate
                            {poll.candidates.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => {
                          if (ch) {
                            onClose()
                            onEditPoll(ch, poll)
                          }
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          edit
                        </span>
                        Edit
                      </button>
                      {isOpen && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11 }}
                          onClick={() => onClosePollEarly(poll.id)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            lock
                          </span>
                          Close early
                        </button>
                      )}
                      <button
                        className="btn btn-dest btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => onDeletePoll(poll.id)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          delete
                        </span>
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ width: '100%', height: 40 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
