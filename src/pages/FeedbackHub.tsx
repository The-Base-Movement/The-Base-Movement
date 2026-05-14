import { useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function FeedbackHub() {
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState('Policy')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // Simulate a quick client-side AI sentiment calculation for immediate UI feedback
  const getSimulatedSentiment = (text: string) => {
    const lower = text.toLowerCase()
    let score = 0
    if (lower.includes('great') || lower.includes('support') || lower.includes('strong') || lower.includes('win')) score += 0.5
    if (lower.includes('bad') || lower.includes('weak') || lower.includes('fail') || lower.includes('disappointed')) score -= 0.5
    if (lower.includes('need') || lower.includes('should') || lower.includes('must')) score -= 0.2 // Critical/constructive
    
    // Normalize between -1 and 1
    return Math.max(-1, Math.min(1, score))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setSubmitting(true)
    try {
      const regNo = localStorage.getItem('userRegNo')
      if (!regNo) throw new Error('User not authenticated')
      
      const profile = await adminService.getMemberProfile(regNo)
      if (!profile) throw new Error('Profile not found')

      const score = getSimulatedSentiment(feedback)
      const label = score > 0.2 ? 'Positive' : score < -0.2 ? 'Negative' : 'Neutral'

      const success = await adminService.submitMemberFeedback({
        user_id: profile.id,
        feedback_text: feedback,
        category,
        sentiment_score: score,
        sentiment_label: label,
        region: profile.region,
        constituency: profile.constituency
      })

      if (success) {
        toast.success('Your sentiment has been recorded. HQ appreciates your tactical insight.')
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
    <div className="bg-stone-50/50 min-h-screen pb-20">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-[var(--brand-red)] animate-ping"></span>
              <span className="text-micro font-bold text-[var(--brand-red)] tracking-tight">Direct line to HQ</span>
            </div>
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-brand-red" style={{ fontSize: 40 }}>chat_bubble</span>
              Feedback Hub
            </h1>
            <div className="bl"><div /><div /><div /></div>
            <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Your ground-level intelligence powers our national strategy. Submit raw, unfiltered feedback directly to the movement's AI sentiment engine.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-8 mt-12">
        <div className="bg-white border border-stone-200 shadow-sm p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Category Selection */}
            <div className="space-y-4">
              <label className="text-micro font-bold text-stone-900 flex items-center gap-2 tracking-tight">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--brand-red)' }}>track_changes</span> Strategic category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Policy', 'Logistics', 'Leadership', 'Local Action'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "p-4 text-center border-2 transition-all duration-300",
                      category === cat 
                        ? "border-[var(--brand-red)] bg-red-50/50" 
                        : "border-stone-100 hover:border-stone-200 bg-stone-50"
                    )}
                  >
                    <span className={cn(
                      "text-micro font-bold block tracking-tight",
                      category === cat ? "text-[var(--brand-red)]" : "text-stone-500"
                    )}>
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Textarea */}
            <div className="space-y-4">
              <label className="text-micro font-bold text-stone-900 flex items-center justify-between tracking-tight">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--brand-red)' }}>chat_bubble</span> Raw intelligence report
                </span>
                <span className={cn(
                  "text-micro text-stone-400",
                  feedback.length > 500 ? "text-red-500 animate-pulse" : ""
                )}>
                  {feedback.length}/500 chars
                </span>
              </label>
              <div className="relative">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                  placeholder="Detail your observations, concerns, or tactical suggestions..."
                  className="w-full h-48 p-6 bg-stone-50 border border-stone-200 focus:border-[var(--brand-red)] focus:ring-0 text-stone-900 resize-none font-medium text-sm leading-relaxed"
                  required
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-micro font-bold text-stone-400 bg-white/80 px-2 py-1 tracking-tight">
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--brand-red)' }}>psychology</span> Secure channel
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
              <p className="text-micro font-bold text-stone-400 tracking-tight max-w-[200px] leading-tight">
                All transmissions are securely logged and analyzed by the National Steering Committee.
              </p>
              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="bg-[var(--brand-red)] text-white hover:bg-red-700 h-14 px-8 rounded-none text-tiny font-bold tracking-tight shadow-xl flex items-center gap-3 cursor-pointer border-none disabled:opacity-60"
              >
                {submitting ? 'Transmitting...' : 'Dispatch intelligence'}
                {!submitting && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
