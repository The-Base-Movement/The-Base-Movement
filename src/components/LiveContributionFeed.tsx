import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Globe, Shield, Activity } from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/types/admin'



export function LiveContributionFeed() {
  const [donations, setDonations] = useState<DonationDetail[]>([])
  const [loading, setLoading] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initial fetch of recent donations
    async function fetchRecentDonations() {
      try {
        const data = await adminService.getPublicDonationFeed(15)
        setDonations(data)
      } catch (error) {
        console.error('[LIVE FEED] Initial fetch failed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentDonations()

    // Subscribe to real-time updates via central service
    const subscription = adminService.subscribeToPublicDonations((newDonation) => {
      setDonations(prev => {
        // Prevent duplicates in case of race conditions
        if (prev.some(d => d.id === newDonation.id)) return prev
        return [newDonation, ...prev.slice(0, 14)]
      })

      // Auto-scroll to top when a new donation arrives
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-sm border border-border/40" />
        ))}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-5 h-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
          </div>
          <h3 className="font-bold text-on-surface font-meta tracking-tight text-base normal-case">Global Deployment Feed</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <Globe className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-bold text-primary tracking-tight normal-case">Live Uplink Active</span>
        </div>
      </div>

      <div 
        ref={feedRef}
        className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {donations.map((donation) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="group"
            >
              <div className="p-5 bg-white/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 rounded-sm relative overflow-hidden group/item">
                {/* Dynamic Energy Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -mr-16 -mt-16 blur-3xl group-hover/item:bg-primary/20 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent/5 -ml-8 -mb-8 blur-2xl transition-all"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white shadow-sm flex items-center justify-center rounded-sm border border-border/10 group-hover/item:scale-110 group-hover/item:border-primary/30 transition-all duration-500">
                      {donation.fullName !== 'Anonymous Patriot' ? (
                        <Globe className="w-6 h-6 text-primary/60 group-hover/item:text-primary transition-colors" />
                      ) : (
                        <Shield className="w-6 h-6 text-accent/60 group-hover/item:text-accent transition-colors" />
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-on-surface tracking-tight normal-case leading-tight">
                        {donation.fullName}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-bold tracking-tight mt-1 normal-case">
                        Mobilizing <span className="text-primary font-meta">{donation.campaignTitle || 'Strategic Fund'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-base font-bold text-on-surface font-meta tracking-tight">
                      GH₵ {Number(donation.amount).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground/40 font-bold tracking-tight normal-case mt-1 tabular-nums bg-muted/20 px-2 py-0.5 rounded-full inline-block">
                      {new Date(donation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {donations.length === 0 && (
          <div className="py-20 text-center border border-dashed border-border/40 rounded-sm">
            <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-[10px] font-bold text-muted-foreground/40 tracking-tight uppercase">Awaiting mobilization uplink...</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-border/40 flex items-center justify-between">
        <p className="text-[9px] font-bold text-muted-foreground/40 tracking-tight normal-case italic">
          * Immutable strategic ledger. Redacted entries respect patriot privacy.
        </p>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 bg-primary rounded-full"></span>
          <span className="w-1 h-1 bg-primary/40 rounded-full"></span>
          <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
        </div>
      </div>
    </div>
  )
}
