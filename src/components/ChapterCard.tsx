import { Link } from 'react-router-dom'
import { MapPin, Users, Zap, Clock, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Chapter } from '@/services/adminService'
import { Button } from '@/components/ui/neon-button'

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
      <div 
        className="group relative bg-white border border-stone-100 rounded-[20px] overflow-hidden hover:shadow-xl hover:shadow-stone-200/50 hover:border-stone-200 transition-all duration-500 flex flex-col h-full"
      >
        {/* Top accent bar - movement identity */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] opacity-80 group-hover:opacity-100 transition-opacity" />

        <div className="p-6 flex-1 flex flex-col">
          {/* Header: Status & Badge */}
          <div className="flex justify-between items-center mb-4">
            <span className={cn(
              "text-[10px] font-bold px-3 py-1 rounded-full tracking-tight",
              isRequestPending 
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-stone-50 text-stone-500 border border-stone-200"
            )}>
              {isRequestPending ? 'Pending' : (isActive ? 'Active Hub' : 'Regional Hub')}
            </span>

            <div className={cn(
              "flex items-center gap-1.5 text-[10px] font-bold tracking-tight",
              isActive ? "text-[var(--brand-green)]" : "text-stone-400"
            )}>
              {isRequestPending ? (
                <Clock className="w-3 h-3" />
              ) : isActive ? (
                <Zap className="w-3 h-3 fill-current" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              <span>{isRequestPending ? 'Pending' : (isActive ? 'Active' : 'Join Chapter')}</span>
            </div>
          </div>

          {/* Chapter Identity */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-stone-900 group-hover:text-[var(--brand-green)] transition-colors leading-tight mb-2">
              {chapter.name}
            </h3>
            <p className="text-[10px] text-stone-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-stone-300" />
              {chapter.city_or_region} • {chapter.country}
              {chapter.country !== 'Ghana' && countryFlags[chapter.country] && (
                <span className="ml-1 filter grayscale group-hover:grayscale-0 transition-all">{countryFlags[chapter.country]}</span>
              )}
            </p>
          </div>

          {/* Members Stats - Dedicated Row */}
          <div className="mb-6 flex items-center gap-3 text-stone-400">
            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100 group-hover:bg-stone-100 transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-stone-900 leading-none">{chapter.member_count}</span>
              <span className="text-[10px] font-bold text-stone-400">members</span>
            </div>
          </div>

          {/* Action Button - Dedicated Row/Footer */}
          <div className="mt-auto pt-6 border-t border-stone-50">
            <Link to={`/dashboard/chapters/${chapter.id}`} className="block">
              <Button 
                variant="default" 
                className="w-full h-11 text-xs font-bold tracking-tight normal-case rounded-none shadow-none"
              >
                View Chapter details
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-green)]/0 to-transparent group-hover:via-[var(--brand-green)]/20 transition-all duration-700"></div>
      </div>
    </motion.div>
  )
}
