/**
 * @file PerformanceContext.tsx
 * @description Provides a performance configuration state (like lowBandwidthMode) for optimizing
 * client rendering. Automatically detects network conditions (2G/3G connections or saving-data preferences)
 * on first visit and persists user setting in localStorage.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useIsClient } from '@/hooks/useIsClient'

/**
 * Performance Context Values
 */
interface PerformanceContextValue {
  /** Indicates whether the application is running in low-bandwidth optimization mode */
  lowBandwidthMode: boolean
  /** Sets or toggles the low-bandwidth optimization mode status */
  setLowBandwidthMode: (enabled: boolean) => void
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null)

/**
 * Provider component for managing performance/bandwidth optimizations.
 * Persists settings to localStorage and applies a global `.low-bandwidth` class to the document body.
 *
 * @param props - Component props
 * @param props.children - Child elements to wrap with the PerformanceProvider
 */
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
          interface NetworkInformation {
            saveData: boolean
            effectiveType: string
          }
          const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection
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

/**
 * Custom React hook to access the performance settings context.
 * Must be used within a PerformanceProvider.
 *
 * @returns The performance context state and settings update action.
 * @throws Error if used outside of a PerformanceProvider.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePerformance = () => {
  const ctx = useContext(PerformanceContext)
  if (!ctx) throw new Error('usePerformance must be used inside <PerformanceProvider>')
  return ctx
}
