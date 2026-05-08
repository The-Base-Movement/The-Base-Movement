import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { RegionalStat } from '@/services/adminService'

interface GhanaGrowthMapProps {
  data: RegionalStat[]
  onRegionClick?: (region: string) => void
}

// Simplified high-fidelity paths for Ghana's 16 regions
// Note: These are representative paths for visualization
const REGION_PATHS = [
  { id: 'Greater Accra', d: 'M160 380 L180 385 L185 395 L170 400 L160 395 Z', name: 'Greater Accra' },
  { id: 'Ashanti', d: 'M100 280 L140 280 L150 320 L120 340 L90 320 Z', name: 'Ashanti' },
  { id: 'Western', d: 'M60 320 L90 320 L80 380 L50 380 L40 350 Z', name: 'Western' },
  { id: 'Central', d: 'M90 320 L120 340 L130 380 L100 390 L80 380 Z', name: 'Central' },
  { id: 'Eastern', d: 'M140 280 L170 290 L180 340 L150 360 L140 320 Z', name: 'Eastern' },
  { id: 'Volta', d: 'M170 290 L200 300 L210 380 L185 395 L180 340 Z', name: 'Volta' },
  { id: 'Northern', d: 'M90 150 L160 150 L180 220 L130 250 L80 220 Z', name: 'Northern' },
  { id: 'Upper East', d: 'M130 100 L170 110 L160 150 L120 150 Z', name: 'Upper East' },
  { id: 'Upper West', d: 'M70 100 L120 100 L110 150 L60 150 Z', name: 'Upper West' },
  { id: 'Bono', d: 'M50 220 L90 220 L80 270 L40 270 Z', name: 'Bono' },
  { id: 'Bono East', d: 'M90 220 L130 220 L140 280 L100 280 Z', name: 'Bono East' },
  { id: 'Ahafo', d: 'M60 270 L90 270 L100 300 L70 300 Z', name: 'Ahafo' },
  { id: 'Savannah', d: 'M50 150 L90 150 L100 220 L40 220 Z', name: 'Savannah' },
  { id: 'North East', d: 'M120 120 L170 130 L180 160 L130 160 Z', name: 'North East' },
  { id: 'Oti', d: 'M170 230 L200 240 L200 300 L170 290 Z', name: 'Oti' },
  { id: 'Western North', d: 'M40 270 L60 270 L70 320 L40 320 Z', name: 'Western North' },
]

export function GhanaGrowthMap({ data, onRegionClick }: GhanaGrowthMapProps) {
  const statsMap = useMemo(() => {
    return data.reduce((acc, curr) => {
      acc[curr.region] = curr
      return acc
    }, {} as Record<string, RegionalStat>)
  }, [data])

  const getIntensity = (region: string) => {
    const stat = statsMap[region]
    if (!stat) return 0.1
    // Scale density based on member count (example logic)
    return Math.min(Math.max(stat.memberCount / 50000, 0.2), 1)
  }

  return (
    <div className="relative w-full aspect-[3/4] bg-muted/10 flex items-center justify-center p-8 overflow-hidden group rounded-sm border border-border/40">
      {/* Map Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--accent))_0%,_transparent_70%)] opacity-5 pointer-events-none" />
      
      <TooltipProvider>
        <svg 
          viewBox="30 80 200 340" 
          className="w-full h-full drop-shadow-2xl filter saturate-[0.8] group-hover:saturate-[1.2] transition-all duration-700"
        >
          {REGION_PATHS.map((path) => {
            const stat = statsMap[path.name]
            const intensity = getIntensity(path.name)
            
            return (
              <Tooltip key={path.id}>
                <TooltipTrigger asChild>
                  <motion.path
                    d={path.d}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ 
                      scale: 1.05, 
                      strokeWidth: 2, 
                      stroke: 'hsl(var(--accent))',
                      zIndex: 50
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    fill={stat ? stat.color : '#e2e8f0'}
                    fillOpacity={intensity}
                    stroke="#ffffff"
                    strokeWidth={1}
                    className="cursor-pointer transition-colors duration-300"
                    onClick={() => onRegionClick?.(path.name)}
                  />
                </TooltipTrigger>
                <TooltipContent className="rounded-sm border-border/10 bg-on-surface text-white p-5 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-3">
                    <p className="text-micro font-bold text-destructive tracking-tight">{path.name} region</p>
                    <div className="flex justify-between gap-8 items-end">
                      <div>
                        <p className="text-2xl font-bold font-meta tracking-tight">
                          {stat ? stat.memberCount.toLocaleString() : '0'}
                        </p>
                        <p className="text-micro font-bold text-white/40 tracking-tight mt-1">Total members</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white/80 tracking-tight">
                          {stat ? stat.chapters : '0'}
                        </p>
                        <p className="text-micro font-bold text-white/40 tracking-tight mt-1">Chapters</p>
                      </div>
                    </div>
                    {stat && (
                      <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[8px] font-bold tracking-tight px-2 py-0.5 bg-white/10 rounded">
                            {stat.performance} impact
                          </span>
                          <span className="text-[8px] font-bold text-white/20">Click for details</span>
                        </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </svg>
      </TooltipProvider>

      {/* Map Legend */}
      <div className="absolute bottom-6 left-6 space-y-3 bg-white/80 backdrop-blur-md p-5 border border-border/10 shadow-xl rounded-sm">
        <p className="text-micro font-bold text-on-surface/40 mb-2 tracking-tight">Expansion density</p>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((op, i) => (
                <div 
                  key={i} 
                  className="w-4 h-4 rounded-sm" 
                  style={{ backgroundColor: 'hsl(var(--destructive))', opacity: op }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[8px] font-bold text-on-surface/40 tracking-tight mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compass / Branding */}
      <div className="absolute top-8 right-8 opacity-20 pointer-events-none">
        <div className="w-12 h-12 border border-on-surface/20 rounded-full flex items-center justify-center relative">
          <div className="absolute top-0 w-px h-2 bg-on-surface/40" />
          <span className="text-[8px] font-bold text-on-surface/40 tracking-tight">N</span>
        </div>
      </div>
    </div>
  )
}
