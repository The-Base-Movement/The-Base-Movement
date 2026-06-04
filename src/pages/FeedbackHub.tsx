import { useState } from 'react'
import { sessionStore } from '@/lib/sessionStore'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { FeedbackSidebar } from './feedback/components/FeedbackSidebar'
import { FeedbackSummaryRow } from './feedback/components/FeedbackSummaryRow'

const CATEGORIES = [
  { id: 'Policy', icon: 'policy', label: 'Policy' },
  { id: 'Logistics', icon: 'local_shipping', label: 'Logistics' },
  { id: 'Leadership', icon: 'military_tech', label: 'Leadership' },
  { id: 'Local Action', icon: 'location_on', label: 'Local Action' },
  { id: 'Media', icon: 'campaign', label: 'Media' },
  { id: 'Other', icon: 'more_horiz', label: 'Other' },
]

const getSimulatedSentiment = (
  text: string
): { score: number; label: 'Positive' | 'Neutral' | 'Negative' } => {
  const lower = text.toLowerCase()
  let score = 0
  if (
    lower.includes('great') ||
    lower.includes('support') ||
    lower.includes('strong') ||
    lower.includes('win') ||
    lower.includes('excellent') ||
    lower.includes('good')
  )
    score += 0.5
  if (
    lower.includes('bad') ||
    lower.includes('weak') ||
    lower.includes('fail') ||
    lower.includes('disappointed') ||
    lower.includes('terrible') ||
    lower.includes('wrong')
  )
    score -= 0.5
  if (
    lower.includes('need') ||
    lower.includes('should') ||
    lower.includes('must') ||
    lower.includes('improve')
  )
    score -= 0.2
  const final = Math.max(-1, Math.min(1, score))
  const label = final > 0.2 ? 'Positive' : final < -0.2 ? 'Negative' : 'Neutral'
  return { score: final, label }
}

export default function FeedbackHub() {
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState('Policy')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const sentiment = feedback.trim().length > 10 ? getSimulatedSentiment(feedback) : null
  const charPct = Math.min(100, Math.round((feedback.length / 500) * 100))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return
    setSubmitting(true)
    try {
      const regNo = sessionStore.getItem('userRegNo')
      if (!regNo) throw new Error('User not authenticated')
      const profile = await adminService.getMemberProfile(regNo)
      if (!profile) throw new Error('Profile not found')
      const { score, label } = getSimulatedSentiment(feedback)
      const success = await adminService.submitMemberFeedback({
        user_id: profile.id,
        feedback_text: feedback,
        category,
        sentiment_score: score,
        sentiment_label: label,
        region: profile.region,
        constituency: profile.constituency,
      })
      if (success) {
        toast.success('Feedback recorded. HQ appreciates your ground-level intelligence.')
        navigate('/dashboard')
      } else {
        toast.error('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('[FEEDBACK] Submission error:', error)
      toast.error('A secure connection could not be established.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="main">
      {/* Page header */}
      <div className="top">
        <div>
          <div className="crumbs">Dashboard · Feedback</div>
          <h2 style={{ margin: '4px 0 0' }}>Feedback hub</h2>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12.5,
              marginTop: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            Submit ground-level intelligence directly to the national steering committee.
          </p>
        </div>
        <div className="actions">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: 'rgba(0,107,63,.07)',
              border: '1px solid rgba(0,107,63,.2)',
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
            >
              verified_user
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11.5,
                color: 'hsl(var(--primary))',
              }}
            >
              Secure channel · Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* ── Sidebar ── */}
        <FeedbackSidebar sentiment={sentiment} />

        {/* ── Main: form ── */}
        <form onSubmit={handleSubmit}>
          {/* Category */}
          <div className="panel" style={{ marginBottom: 14 }}>
            <div className="ph2">
              <h3>Strategic category</h3>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10.5,
                  color: 'hsl(var(--primary))',
                }}
              >
                {category}
              </span>
            </div>
            <div
              style={{
                padding: '14px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 8,
              }}
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '14px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      border: `2px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      borderRadius: 4,
                      background: active ? 'rgba(0,107,63,.06)' : 'hsl(var(--container-low))',
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 20,
                        color: active ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {cat.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: active ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                        letterSpacing: '-.005em',
                      }}
                    >
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message */}
          <div className="panel" style={{ marginBottom: 14 }}>
            <div className="ph2">
              <h3>Your intelligence report</h3>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10.5,
                  color:
                    feedback.length > 450
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--on-surface-muted))',
                }}
              >
                {feedback.length} / 500
              </span>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  name="feedback"
                  id="textarea-d2d71b"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                  placeholder="Detail your observations, concerns, or tactical suggestions. Be specific and constructive — your input shapes national strategy."
                  required
                  style={{
                    width: '100%',
                    height: 180,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '14px 14px 40px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    background: 'hsl(var(--container-low))',
                    outline: 'none',
                    lineHeight: 1.65,
                  }}
                />
                {/* Progress bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'hsl(var(--border))',
                    borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${charPct}%`,
                      background:
                        charPct > 90
                          ? 'hsl(var(--destructive))'
                          : charPct > 70
                            ? 'hsl(var(--accent))'
                            : 'hsl(var(--primary))',
                      transition: 'width .2s ease, background .3s ease',
                    }}
                  />
                </div>
              </div>
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                All submissions are securely logged and reviewed monthly by the National Steering
                Committee.
              </p>
            </div>
          </div>

          {/* Summary row before submit */}
          <FeedbackSummaryRow
            category={category}
            feedbackLength={feedback.length}
            sentiment={sentiment}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={submitting || !feedback.trim()}
            >
              {submitting ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                  >
                    refresh
                  </span>
                  Transmitting…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    send
                  </span>
                  Dispatch intelligence
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
