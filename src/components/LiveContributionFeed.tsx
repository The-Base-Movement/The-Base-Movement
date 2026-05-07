import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Globe, Shield, Activity } from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/types/admin'
import { RealtimeChannel } from '@supabase/supabase-js'


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
              <div className="p-4 bg-white/40 backdrop-blur-md border border-border/40 hover:border-primary/40 transition-all duration-500 rounded-sm shadow-sm relative overflow-hidden group/item">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 blur-2xl group-hover/item:bg-primary/10 transition-colors"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-sm border border-border/10 group-hover/item:bg-primary/5 group-hover/item:border-primary/20 transition-all">
                      {donation.fullName !== 'Anonymous Patriot' ? (
                        <Globe className="w-5 h-5 text-on-surface/40 group-hover/item:text-primary transition-colors" />
                      ) : (
                        <Shield className="w-5 h-5 text-on-surface/40 group-hover/item:text-primary transition-colors" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-on-surface tracking-tight normal-case leading-tight">
                        {donation.fullName}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 font-bold tracking-tight mt-0.5 normal-case">
                        Deployed to <span className="text-primary/80">{donation.campaignTitle || 'Strategic Fund'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface font-meta tracking-tight">
                      GHS {Number(donation.amount).toLocaleString()}
                    </p>
                    <p className="text-[8px] text-muted-foreground/40 font-bold tracking-tight normal-case mt-0.5 tabular-nums">
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
