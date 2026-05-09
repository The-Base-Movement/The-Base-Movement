import { Link } from 'react-router-dom'
import { MapPin, Users, ShieldCheck, Zap } from 'lucide-react'
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <div 
        className="group relative bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col h-full"
      >
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-stone-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] opacity-80 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Header & Main Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 group-hover:text-[var(--brand-green)] group-hover:border-[var(--brand-green)]/20 group-hover:bg-[var(--brand-green)]/5 transition-all duration-500">
                {chapter.country === 'Ghana' ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all duration-500">
                    {countryFlags[chapter.country] || '🌍'}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1 gap-2">
                <h3 className="text-stone-900 group-hover:text-[var(--brand-green)] transition-colors text-base font-bold tracking-tight font-meta leading-tight normal-case truncate">
                  {chapter.name}
                </h3>
                <div className={cn(
                  "px-2 py-0.5 text-[9px] font-bold tracking-tight normal-case flex-shrink-0",
                  isRequestPending 
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : isActive
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-stone-50 text-stone-400 border border-stone-100"
                )}>
                  {isRequestPending ? 'Pending' : (isActive ? 'Active' : 'Hub')}
                </div>
              </div>
              
              <div className="flex justify-between items-center gap-4 mt-2">
                <p className="text-[10px] font-medium tracking-tight normal-case text-stone-400 truncate">
                  {chapter.city_or_region} • {chapter.country}
                </p>
                
                <Link to={`/dashboard/chapters/${chapter.id}`} className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 text-[10px] font-bold tracking-tight normal-case rounded-none border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-none"
                  >
                    View details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50 mt-auto">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-[var(--brand-green)]" />
              <p className="text-[10px] font-medium text-stone-500 normal-case tracking-tight">
                <span className="font-bold text-stone-900 mr-1">{chapter.member_count}</span> members
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Zap className="w-3 h-3 text-warm-gold" />
              <p className="text-[10px] font-medium text-stone-500 normal-case tracking-tight">
                Active Hub
              </p>
            </div>
          </div>
        </div>
        
        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-green)]/0 to-transparent group-hover:via-[var(--brand-green)]/20 transition-all duration-700"></div>
      </div>
    </motion.div>
  )
}
