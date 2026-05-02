import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Calendar,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistrationFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function RegistrationForm({ onClose, onSuccess }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate high-fidelity processing
    setTimeout(() => {
      setIsSubmitting(false)
      onSuccess()
    }, 1500)
  }

  return (
    <div className="bg-white p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-300">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-900"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </Button>

      <div className="mb-8">
        <h2 className="text-2xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Member Registration</h2>
        <p className="text-stone-500 text-sm mt-1 uppercase tracking-widest font-bold text-[10px]">Movement Identity Hub</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Personal Intelligence</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-900 uppercase tracking-tight">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input className="pl-10 h-11 border-stone-200 rounded-none focus:ring-[var(--brand-gold)]" placeholder="Kwame Mensah" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-900 uppercase tracking-tight">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input type="email" className="pl-10 h-11 border-stone-200 rounded-none focus:ring-[var(--brand-gold)]" placeholder="kwame@thebase.org" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-900 uppercase tracking-tight">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input type="tel" className="pl-10 h-11 border-stone-200 rounded-none focus:ring-[var(--brand-gold)]" placeholder="+233 24 000 0000" required />
              </div>
            </div>
          </div>

          {/* Location & Chapters */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Regional Deployment</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-900 uppercase tracking-tight">Region</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <select className="w-full h-11 pl-10 pr-4 bg-white border border-stone-200 text-sm font-medium focus:ring-1 focus:ring-[var(--brand-gold)] appearance-none rounded-none">
                  <option>Greater Accra</option>
                  <option>Ashanti</option>
                  <option>Western</option>
                  <option>Central</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-900 uppercase tracking-tight">Constituency</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input className="pl-10 h-11 border-stone-200 rounded-none focus:ring-[var(--brand-gold)]" placeholder="Ayawaso West Wuogon" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-900 uppercase tracking-tight">Profession</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input className="pl-10 h-11 border-stone-200 rounded-none focus:ring-[var(--brand-gold)]" placeholder="Software Engineer" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100 flex gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-[2] h-12 bg-[var(--brand-black)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-stone-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'PROCESSING...' : 'Register Member'}
          </Button>
        </div>
      </form>
    </div>
  )
}
