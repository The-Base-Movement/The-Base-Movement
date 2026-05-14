import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 64, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'hsl(var(--primary))' }}>vital_signs</span>
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'hsl(var(--primary))', borderRadius: '50%' }} className="animate-ping"></span>
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'hsl(var(--primary))', borderRadius: '50%' }}></span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.01em', margin: 0, textTransform: 'lowercase' }}>global deployment feed</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'hsla(var(--primary), 0.08)', border: '1px solid hsla(var(--primary), 0.18)', borderRadius: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--primary))' }}>public</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>live uplink active</span>
        </div>
      </div>

      <div 
        ref={feedRef}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto', paddingRight: 8 }}
        className="custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {donations.map((donation) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div style={{ 
                padding: 20, 
                background: '#fff', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: 4, 
                position: 'relative', 
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }} className="hover:border-primary/50 hover:shadow-xl">
                {/* Accent */}
                <div style={{ 
                  position: 'absolute', top: 0, right: 0, width: 128, height: 128, 
                  background: 'hsla(var(--primary), 0.05)', marginRight: -64, marginTop: -64, 
                  filter: 'blur(40px)', pointerEvents: 'none' 
                }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      width: 48, height: 48, background: 'hsl(var(--container-low))', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      borderRadius: 4, border: '1px solid hsl(var(--border))' 
                    }}>
                      {donation.fullName !== 'anonymous patriot' ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'hsla(var(--primary), 0.6)' }}>public</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'hsla(var(--on-surface-muted), 0.4)' }}>shield_person</span>
                      )}
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))', 
                        margin: 0, textTransform: 'lowercase', lineHeight: 1.2, fontFamily: "'Public Sans', sans-serif"
                      }}>
                        {donation.fullName}
                      </p>
                      <p style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                        mobilizing <span style={{ color: 'hsl(var(--primary))' }}>{donation.campaignTitle || 'strategic fund'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>
                      ₵ {Number(donation.amount).toLocaleString()}
                    </p>
                    <p style={{ 
                      fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 900, 
                      marginTop: 4, background: 'hsl(var(--container-low))', padding: '2px 8px', borderRadius: 20, display: 'inline-block' 
                    }}>
                      {new Date(donation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {donations.length === 0 && (
          <div style={{ padding: 80, textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))', marginBottom: 16 }}>sensors_off</span>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>awaiting mobilization uplink...</p>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic', margin: 0 }}>
          * immutable strategic ledger. redacted entries respect patriot privacy.
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 4, height: 4, background: 'hsl(var(--primary))', borderRadius: '50%' }}></div>
          <div style={{ width: 4, height: 4, background: 'hsla(var(--primary), 0.4)', borderRadius: '50%' }}></div>
          <div style={{ width: 4, height: 4, background: 'hsla(var(--primary), 0.2)', borderRadius: '50%' }}></div>
        </div>
      </div>
    </div>
  )
}
