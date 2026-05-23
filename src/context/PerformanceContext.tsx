import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useIsClient } from '@/hooks/useIsClient'

interface PerformanceContextValue {
  lowBandwidthMode: boolean
  setLowBandwidthMode: (enabled: boolean) => void
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient()
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false)

  useEffect(() => {
    if (isClient) {
      const handle = requestAnimationFrame(() => {
        const saved = localStorage.getItem('low_bandwidth_mode')
        if (saved === 'true') {
          setLowBandwidthMode(true)
        } else if (saved === null) {
          // Auto-detect slow connection on first visit
          const conn = (navigator as any).connection
          if (conn && (conn.saveData || /2g|3g/.test(conn.effectiveType))) {
            console.warn('[PERFORMANCE] Slow connection detected. Activating Low-Bandwidth Mode.')
            setLowBandwidthMode(true)
          }
        }
      })
      return () => cancelAnimationFrame(handle)
    }
  }, [isClient])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('low_bandwidth_mode', String(lowBandwidthMode))
      
      // Global CSS Hook
      if (lowBandwidthMode) {
        document.body.classList.add('low-bandwidth')
      } else {
        document.body.classList.remove('low-bandwidth')
      }
    }
  }, [lowBandwidthMode])

  return (
    <PerformanceContext.Provider value={{ lowBandwidthMode, setLowBandwidthMode }}>
      {children}
    </PerformanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePerformance = () => {
  const ctx = useContext(PerformanceContext)
  if (!ctx) throw new Error('usePerformance must be used inside <PerformanceProvider>')
  return ctx
}
