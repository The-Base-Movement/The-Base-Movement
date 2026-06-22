/**
 * WelcomeModal Component
 * -------------------------------------------------------------
 * First-login welcome modal shown to newly registered members after their
 * automatic chapter assignment.
 *
 * Displays:
 * - Brand accent bar (red / gold / green)
 * - Assigned chapter name and region
 * - Two CTAs:
 *   1. "Confirm this chapter" → closes the modal (keeps assignment).
 *   2. "Choose a different chapter" → closes the modal and navigates to
 *      /dashboard/chapters so the member can join a different one.
 *
 * The modal uses Tailwind animate-in classes (zoom-in-95, fade-in). The public
 * site's design token variables (--brand-red/gold/green) are used for colours.
 */

import { useNavigate } from 'react-router-dom'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  assignedChapter: {
    name: string
    region: string
  }
}

export function WelcomeModal({ isOpen, onClose, userName, assignedChapter }: WelcomeModalProps) {
  const navigate = useNavigate()
  if (!isOpen) return null

  const handleChooseDifferent = () => {
    onClose()
    navigate('/dashboard/chapters')
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-charcoal-dark/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Accent Bar */}
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-[var(--brand-red)]"></div>
          <div className="flex-1 bg-[var(--brand-gold)]"></div>
          <div className="flex-1 bg-[var(--brand-green)]"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-none bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-colors z-10"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            close
          </span>
        </button>

        <div className="p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[var(--brand-green)]/10 flex items-center justify-center mx-auto mb-6">
              <span
                className="material-symbols-outlined text-[var(--brand-green)]"
                style={{ fontSize: 32 }}
              >
                location_on
              </span>
            </div>
            <h2 className="text-stone-900 mb-3">Welcome to the Movement</h2>
            <p className="text-stone-500 max-w-sm mx-auto mb-0">
              Welcome to the movement,{' '}
              <span className="font-medium text-stone-800">{userName}</span>. You've been
              automatically assigned to a chapter based on your registration details.
            </p>
          </div>

          {/* Assignment Card */}
          <div className="border-2 border-[var(--brand-green)] bg-emerald-50/30 p-6 mb-8 relative group">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[var(--brand-green)] text-white flex items-center justify-center rounded-none shadow-lg">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  public
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-stone-900 leading-tight mb-1">{assignedChapter.name}</h5>
                  <span className="text-micro font-medium text-white bg-[var(--brand-green)] px-2 py-0.5 rounded-none tracking-tight">
                    Assigned
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--brand-green)] tracking-tight mb-0">
                  {assignedChapter.region}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={onClose}
              className="w-full h-14 rounded-none font-medium text-sm tracking-tight shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-primary text-white border-none cursor-pointer hover:opacity-90"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                check
              </span>
              Confirm this chapter
            </button>

            <button
              onClick={handleChooseDifferent}
              className="w-full py-4 text-xs font-medium text-stone-400 hover:text-[var(--brand-green)] tracking-tight transition-colors flex items-center justify-center gap-2 group"
            >
              <span
                className="material-symbols-outlined group-hover:translate-y-0.5 transition-transform"
                style={{ fontSize: 16 }}
              >
                expand_more
              </span>
              Choose a different chapter
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-stone-100">
            <div className="flex items-center gap-3 text-stone-400">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                account_balance
              </span>
              <p className="text-micro font-medium tracking-tight mb-0">
                Assigned based on your region: {assignedChapter.region}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
