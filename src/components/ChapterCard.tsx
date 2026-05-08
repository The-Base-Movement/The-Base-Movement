import { Link } from 'react-router-dom'
import { MapPin, Users, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Chapter } from '@/services/adminService'
import { Button } from '@/components/ui/neon-button'

interface ChapterCardProps {
  chapter: Chapter
  requestSent: Record<string, boolean>
  countryFlags: Record<string, string>
  handleJoinRequest: (e: React.MouseEvent, chapterId: string) => void
}

export function ChapterCard({ chapter, requestSent, countryFlags, handleJoinRequest }: ChapterCardProps) {
  const isRequestPending = requestSent[chapter.id]
  const isActive = (chapter.status as string) === 'Active' || (chapter.status as string) === 'Member'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Link 
        to={`/dashboard/chapters/${chapter.id}`}
        className="group relative bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full"
      >
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-stone-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] opacity-80 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="p-8 flex-1 flex flex-col">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div className="relative">
              <div className="w-14 h-14 bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 group-hover:text-[var(--brand-green)] group-hover:border-[var(--brand-green)]/20 group-hover:bg-[var(--brand-green)]/5 transition-all duration-500">
                {chapter.country === 'Ghana' ? (
                  <MapPin className="w-6 h-6" />
                ) : (
                  <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all duration-500">
                    {countryFlags[chapter.country] || '🌍'}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className={cn(
              "px-3 py-1 text-micro font-bold tracking-tight normal-case",
              isRequestPending 
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-stone-50 text-stone-400 border border-stone-100"
            )}>
              {isRequestPending ? 'Request Pending' : (chapter.status || 'Verified Hub')}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="space-y-2 mb-8">
            <h3 className="text-stone-900 group-hover:text-[var(--brand-green)] transition-colors text-xl font-bold tracking-tight font-meta leading-tight normal-case">
              {chapter.name}
            </h3>
            <div className="flex items-center gap-2 text-stone-400">
              <p className="text-tiny font-bold tracking-tight normal-case">
                {chapter.city_or_region} • {chapter.country}
              </p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 py-6 border-y border-stone-50 mt-auto">
            <div>
              <p className="text-micro font-bold text-stone-400 normal-case tracking-tight mb-1">Active members</p>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[var(--brand-green)]" />
                <span className="text-lg font-bold text-stone-900 font-meta tracking-tight">{chapter.member_count}</span>
              </div>
            </div>
            <div>
              <p className="text-micro font-bold text-stone-400 normal-case tracking-tight mb-1">Status</p>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-warm-gold" />
                <span className="text-tiny font-bold text-stone-900 normal-case tracking-tight">Active Hub</span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="mt-8">
            {(chapter.status as string) === 'Join Chapter' && !isRequestPending ? (
              <Button 
                variant="solid"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleJoinRequest(e, chapter.id)
                }}
                className="w-full h-14 bg-on-surface text-white hover:!bg-white hover:!text-emerald-600 border border-transparent hover:!border-emerald-600 transition-all duration-300 flex items-center justify-center gap-3 text-tiny font-bold tracking-tight normal-case rounded-none"
              >
                Join Chapter <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 border transition-all duration-500 flex items-center justify-center gap-3 text-tiny font-bold tracking-tight normal-case rounded-none",
                  isRequestPending
                    ? "border-amber-200 bg-amber-50 text-amber-600 cursor-default"
                    : "border-stone-100 text-stone-400 group-hover:border-emerald-600/20 group-hover:!text-emerald-600 group-hover:bg-emerald-50/30"
                )}
              >
                {isRequestPending ? 'Request Sent' : 'View Details'} 
                {!isRequestPending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            )}
          </div>
        </div>
        
        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-green)]/0 to-transparent group-hover:via-[var(--brand-green)]/20 transition-all duration-700"></div>
      </Link>
    </motion.div>
  )
}
