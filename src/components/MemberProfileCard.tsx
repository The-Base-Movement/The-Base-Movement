import { Card, CardContent } from '@/components/ui/card'
import { User, MapPin, Globe, ChevronRight } from 'lucide-react'
import type { Member } from '@/types/admin'
import { cn } from '@/lib/utils'

interface MemberProfileCardProps {
  member: Member
  setSelectedMember: (member: Member) => void
}

export function MemberProfileCard({ member, setSelectedMember }: MemberProfileCardProps) {
  const isVerified = member.status === 'Active' || member.status === 'Approved' || !member.status;

  return (
    <article 
      aria-labelledby={`member-name-${member.id}`}
      onClick={() => setSelectedMember(member)}
      className="group block bg-white border border-stone-100 rounded-[28px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:border-emerald-100 hover:-translate-y-1 cursor-pointer"
    >
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors duration-500">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <User className="w-6 h-6 text-stone-400 group-hover:text-emerald-600 transition-colors duration-500" />
              )}
            </div>
            
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
              isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isVerified ? "bg-emerald-400" : "bg-amber-400")} />
              {isVerified ? 'Verified' : 'Pending'}
            </div>
          </div>

          <div className="mb-6">
            <h3 
              id={`member-name-${member.id}`}
              className="text-stone-900 text-base font-bold group-hover:text-emerald-700 transition-colors duration-300 truncate"
            >
              {member.name}
            </h3>
            <p className="text-xs text-stone-400 font-medium mt-0.5">{member.profession}</p>
          </div>

          <div className="space-y-3 pt-6 border-t border-stone-50">
            <div className="flex items-center gap-2 text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-stone-300" />
              <span className="text-[11px] font-medium truncate">
                {member.platform === 'GHANA' ? `${member.constituency}, ${member.region}` : member.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-500">
              <Globe className="w-3.5 h-3.5 text-stone-300" />
              <span className="text-[11px] font-medium">{member.platform === 'GHANA' ? 'Ghana' : 'Diaspora'} platform</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-emerald-600">
             <span className="text-[11px] font-bold">View profile</span>
             <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
          </div>
        </CardContent>
      </Card>
    </article>
  )
}

