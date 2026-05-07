import { Link } from 'react-router-dom'
import { MapPin, Users, ArrowRight } from 'lucide-react'

import { type Chapter } from '@/services/adminService'

interface ChapterCardProps {
  chapter: Chapter
  requestSent: Record<string, boolean>
  countryFlags: Record<string, string>
  handleJoinRequest: (e: React.MouseEvent, chapterId: string) => void
}

export function ChapterCard({ chapter, requestSent, countryFlags, handleJoinRequest }: ChapterCardProps) {
  return (
    <Link 
      to={`/dashboard/chapters/${chapter.id}`}
      className="group bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-xl hover:border-[var(--brand-green)] transition-all duration-500 flex flex-col"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] opacity-80 group-hover:opacity-100 transition-opacity"></div>
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-stone-50 rounded-none flex items-center justify-center text-stone-400 group-hover:text-[var(--brand-green)] transition-colors">
            {chapter.country === 'Ghana' ? <MapPin className="w-6 h-6" /> : <span className="text-2xl">{countryFlags[chapter.country] || '🌍'}</span>}
          </div>
          <span className={`px-3 py-1 rounded-none text-[10px] font-bold tracking-tight ${
            requestSent[chapter.id] 
              ? 'bg-amber-50 text-amber-600'
              : (chapter.status as string) === 'Active' || (chapter.status as string) === 'Member' 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-stone-50 text-stone-600'
          }`}>
            {requestSent[chapter.id] ? 'Request Pending' : chapter.status}
          </span>
        </div>
        
        <h3 className="text-stone-900 mb-1 group-hover:text-[var(--brand-green)] transition-colors text-lg">
          {chapter.name}
        </h3>
        <p className="text-stone-400 text-[10px] font-bold tracking-tight mb-6">
          {chapter.city_or_region}, {chapter.country}
        </p>
        
        <div className="space-y-4 pt-6 border-t border-stone-50 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-stone-400 tracking-tight">Strength</span>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-[var(--brand-green)]" />
              <span className="text-sm font-bold text-stone-700">{chapter.member_count}</span>
            </div>
          </div>
        </div>
        
        {(chapter.status as string) === 'Join Chapter' && !requestSent[chapter.id] ? (
          <button 
            onClick={(e) => handleJoinRequest(e, chapter.id)}
            className="w-full mt-8 h-12 border border-[var(--brand-green)] bg-[var(--brand-green)] text-white rounded-none text-[10px] font-bold tracking-tight hover:bg-white hover:text-[var(--brand-green)] transition-all flex items-center justify-center gap-2"
          >
            Join chapter <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <div className={`w-full mt-8 h-12 border rounded-none text-[10px] font-bold tracking-tight transition-all flex items-center justify-center gap-2 ${
            requestSent[chapter.id] 
              ? 'border-amber-200 bg-amber-50 text-amber-600' 
              : 'border-stone-100 text-stone-400 group-hover:bg-[var(--brand-green)] group-hover:text-white group-hover:border-[var(--brand-green)]'
          }`}>
            {requestSent[chapter.id] ? 'Request sent' : 'View details'} <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </Link>
  )
}
