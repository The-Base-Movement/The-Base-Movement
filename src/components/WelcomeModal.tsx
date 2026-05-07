import { useNavigate } from 'react-router-dom'
import { X, MapPin, Globe, Check, ChevronDown, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  assignedChapter: {
    name: string;
    region: string;
  };
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
          <X className="w-4 h-4" />
        </button>

        <div className="p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[var(--brand-green)]/10 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-[var(--brand-green)]" />
            </div>
            <h2 className="text-stone-900 mb-3">
              Your Chapter Assignment
            </h2>
            <p className="text-stone-500 max-w-sm mx-auto mb-0">
              Welcome to the movement, <span className="font-bold text-stone-800">{userName}</span>. You've been automatically assigned to a chapter based on your registration details.
            </p>
          </div>

          {/* Assignment Card */}
          <div className="border-2 border-[var(--brand-green)] bg-emerald-50/30 p-6 mb-8 relative group">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[var(--brand-green)] text-white flex items-center justify-center rounded-none shadow-lg">
                <Globe className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-stone-900 leading-tight mb-1">
                    {assignedChapter.name}
                  </h5>
                  <span className="text-[10px] font-bold text-white bg-[var(--brand-green)] px-2 py-0.5 rounded-none tracking-tight">
                    Assigned
                  </span>
                </div>
                <p className="text-xs font-bold text-[var(--brand-green)] tracking-tight mb-0">
                  {assignedChapter.region}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button 
              onClick={onClose}
              className="w-full h-14 bg-[var(--brand-green)] text-white hover:bg-emerald-800 rounded-none font-bold text-sm tracking-tight shadow-xl shadow-brand-green/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Check className="w-5 h-5" />
              Confirm this chapter
            </Button>
            
            <button 
              onClick={handleChooseDifferent}
              className="w-full py-4 text-xs font-bold text-stone-400 hover:text-[var(--brand-green)] tracking-tight transition-colors flex items-center justify-center gap-2 group"
            >
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              Choose a different chapter
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-stone-100">
            <div className="flex items-center gap-3 text-stone-400">
              <Building2 className="w-4 h-4" />
              <p className="text-[10px] font-bold tracking-tight mb-0">
                Assigned based on your region: {assignedChapter.region}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
