import { Link } from 'react-router-dom'
import { MapPin, Zap, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Chapter } from '@/types/admin'

interface ChapterCardProps {
  chapter: Chapter
  countryFlags: Record<string, string>
}

export function ChapterCard({ chapter, countryFlags }: ChapterCardProps) {
  const isRequestPending = (chapter.status as string) === 'Pending'
  const isActive = (chapter.status as string) === 'Active' || (chapter.status as string) === 'Member'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Link 
        to={`/dashboard/chapters/${chapter.id}`}
        className="group block h-full relative"
      >
        <div 
          className="relative h-full bg-white border border-stone-100 rounded-[32px] p-8 flex flex-col transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:border-emerald-100 hover:-translate-y-1"
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-8">
            <div className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2",
              isRequestPending 
                ? "bg-amber-50 text-amber-600"
                : isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-stone-50 text-stone-500"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isRequestPending ? "bg-amber-400" : isActive ? "bg-emerald-400" : "bg-stone-300"
              )} />
              {isRequestPending ? 'Pending' : (isActive ? 'Active Hub' : 'Regional Hub')}
            </div>
            
            <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-500">
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
            </div>
          </div>

          {/* Chapter Identity */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-700 transition-colors duration-300 mb-2 leading-tight">
              {chapter.name}
            </h3>
            <div className="flex items-center gap-2 text-stone-400 font-medium">
              <MapPin className="w-4 h-4" />
              <span className="text-xs">{chapter.city_or_region} • {chapter.country}</span>
              {chapter.country !== 'Ghana' && countryFlags[chapter.country] && (
                <span className="ml-1 text-sm">{countryFlags[chapter.country]}</span>
              )}
            </div>
          </div>

          {/* Stats Bar - Members Count */}
          <div className="mt-auto mb-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-stone-100" />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-stone-900 leading-none">{chapter.member_count}</span>
              <span className="text-[10px] text-stone-400 font-bold mt-0.5">Members</span>
            </div>
          </div>

          {/* Footer - Hub Status */}
          <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
            {isActive ? (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-black italic">Elite Hub</span>
              </div>
            ) : (
              <div className="text-stone-300 font-bold text-[10px]">
                {chapter.country === 'Ghana' ? 'Regional Hub' : 'Diaspora Hub'}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

