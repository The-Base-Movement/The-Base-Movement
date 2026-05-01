import { Card, CardContent } from '@/components/ui/card'
import { User, MapPin, Globe } from 'lucide-react'

interface Member {
  id: number
  name: string
  platform: 'GHANA' | 'DIASPORA'
  region: string | null
  constituency: string | null
  country: string
  profession: string
  avatar: string | null
}

interface MemberProfileCardProps {
  member: Member
  setSelectedMember: (member: Member) => void
}

export function MemberProfileCard({ member, setSelectedMember }: MemberProfileCardProps) {
  return (
    <div 
      onClick={() => setSelectedMember(member)}
      className="group relative p-[1px] transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-brand-green/10"
    >
      {/* Ghana First Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#CE1126] via-[#DAA520] to-[#006B3F] opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <Card className="relative border-none shadow-none bg-white rounded-none overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-none bg-brand-green/5 border border-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green transition-colors duration-500">
              <User className="w-7 h-7 text-brand-green group-hover:text-white transition-colors duration-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-charcoal-dark truncate text-base font-bold uppercase tracking-tight">
                {member.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 mb-0">{member.profession}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-3 h-3 text-brand-green" />
              <span className="text-[10px] font-bold uppercase tracking-tight truncate">
                {member.platform === 'GHANA' ? `${member.constituency}, ${member.region}` : member.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Globe className="w-3 h-3 text-warm-gold" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{member.platform} PLATFORM</span>
            </div>
          </div>

          <div className="mt-6">
            <button className="w-full py-2.5 bg-slate-50 group-hover:bg-brand-green group-hover:text-white text-[9px] font-bold tracking-[0.2em] rounded-none transition-all uppercase">
              View Profile
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
