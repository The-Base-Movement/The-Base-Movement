import { Card, CardContent } from '@/components/ui/card'
import { User, MapPin, Globe } from 'lucide-react'
import type { Member } from '@/types/admin'

interface MemberProfileCardProps {
  member: Member
  setSelectedMember: (member: Member) => void
}

export function MemberProfileCard({ member, setSelectedMember }: MemberProfileCardProps) {
  return (
    <article 
      aria-labelledby={`member-name-${member.id}`}
      onClick={() => setSelectedMember(member)}
      className="group relative p-[1px] transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/10"
    >
      {/* Ghana First Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive via-accent to-primary opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <Card className="relative border-none shadow-none bg-white rounded-none overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-none bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-500">
                <User className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-500" />
              </div>
              <div className="min-w-0">
                <h3 
                  id={`member-name-${member.id}`}
                  className="text-charcoal-dark truncate text-base font-bold tracking-tight"
                >
                  {member.name}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-tight mt-0.5 mb-0">{member.profession}</p>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[7px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-none tracking-tight">
                {member.status === 'Active' || member.status === 'Approved' || !member.status ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold tracking-tight truncate">
                {member.platform === 'GHANA' ? `${member.constituency}, ${member.region}` : member.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Globe className="w-3 h-3 text-accent" />
              <span className="text-[10px] font-bold tracking-tight">{member.platform} platform</span>
            </div>
          </div>

          <div className="mt-6">
            <button className="w-full py-2.5 bg-slate-50 group-hover:bg-primary group-hover:text-white text-[9px] font-bold tracking-tight rounded-none transition-all">
              View profile
            </button>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
