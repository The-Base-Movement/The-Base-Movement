import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminService } from '@/services/adminService'
import { usePerformance } from '@/context/PerformanceContext'
import type { DonationDetail } from '@/types/admin'

function maskName(fullName: string): string {
  if (!fullName || fullName.toLowerCase() === 'anonymous patriot') return 'Anonymous Patriot'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const AVATAR_COLORS = [
  ['#e8f5e9', 'hsl(var(--primary))'],
  ['#fff8e1', '#b08800'],
  ['#fce4ec', '#c62828'],
  ['#e3f2fd', '#1565c0'],
  ['#f3e5f5', '#6a1b9a'],
]

function InitialAvatar({ name }: { name: string }) {
  const isAnon = name.toLowerCase().includes('anonymous')
  const initial = isAnon ? '?' : name.trim()[0]?.toUpperCase() || '?'
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const [bg, color] = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  return (
    <div
      style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: '50%',
        background: bg,
        border: `1.5px solid ${color}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isAnon ? (
        <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>
          shield_person
        </span>
      ) : (
        <span
          style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Public Sans', sans-serif" }}
        >
          {initial}
        </span>
      )}
    </div>
  )
}

export function LiveContributionFeed() {
  const { lowBandwidthMode } = usePerformance()
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

    // Disable real-time in Low-Bandwidth mode to save data/battery
    if (lowBandwidthMode) return

    // Subscribe to real-time updates via central service
    const subscription = adminService.subscribeToPublicDonations((newDonation) => {
      setDonations((prev) => {
        // Prevent duplicates in case of race conditions
        if (prev.some((d) => d.id === newDonation.id)) return prev
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
  }, [lowBandwidthMode])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 64,
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
            }}
            className="animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
            >
              vital_signs
            </span>
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 7,
                height: 7,
                background: 'hsl(var(--primary))',
                borderRadius: '50%',
              }}
              className="animate-ping"
            />
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 7,
                height: 7,
                background: 'hsl(var(--primary))',
                borderRadius: '50%',
              }}
            />
          </div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Global deployment feed
          </h3>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            background: 'hsla(var(--primary), 0.08)',
            border: '1px solid hsla(var(--primary), 0.18)',
            borderRadius: 20,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: 'hsl(var(--primary))',
              borderRadius: '50%',
              display: 'block',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'hsl(var(--primary))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            Live
          </span>
        </span>
      </div>

      <div
        ref={feedRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: 480,
          overflowY: 'auto',
          paddingRight: 4,
        }}
        className="custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {donations.map((donation) => (
            <motion.div
              key={donation.id}
              initial={!lowBandwidthMode ? { opacity: 0, x: -20, height: 0 } : {}}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={!lowBandwidthMode ? { opacity: 0, x: 20, height: 0 } : {}}
              transition={!lowBandwidthMode ? { duration: 0.4, ease: 'easeOut' } : { duration: 0 }}
            >
              <div
                style={{
                  padding: '11px 14px',
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <InitialAvatar name={donation.fullName} />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {maskName(donation.fullName)}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--primary))',
                        fontWeight: 500,
                        margin: '1px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {donation.campaignTitle || 'Strategic fund'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ₵ {Number(donation.amount).toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      fontWeight: 500,
                      margin: '2px 0 0',
                    }}
                  >
                    {new Date(donation.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {donations.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px dashed hsl(var(--border))',
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 36,
                color: 'hsl(var(--border))',
                display: 'block',
                marginBottom: 12,
              }}
            >
              sensors_off
            </span>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--on-surface-muted))' }}>
              No contributions yet — be the first to mobilise.
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'hsl(var(--on-surface-muted))',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          Names are partially redacted to protect contributor privacy.
        </p>
      </div>
    </div>
  )
}
