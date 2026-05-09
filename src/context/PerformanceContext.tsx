import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface PerformanceContextValue {
  lowBandwidthMode: boolean
  setLowBandwidthMode: (enabled: boolean) => void
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('low_bandwidth_mode') === 'true'
    if (saved) setLowBandwidthMode(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('low_bandwidth_mode', String(lowBandwidthMode))
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
