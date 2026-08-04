/**
 * @file useInactivityTimeout.ts
 * @description Custom React hook to track user inactivity. Fires callbacks when the warning threshold
 * is reached and when the inactivity limit is exceeded. Idleness is measured against the cross-tab
 * activity clock in `@/lib/lastActivity`, so a background tab cannot time out a session the user is
 * actively using elsewhere.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ACTIVITY_EVENTS, getLastActivity, markActivity } from '@/lib/lastActivity'

/** How often idleness is re-evaluated. Well below the smallest threshold it checks. */
const TICK_MS = 5000

/**
 * Options parameters for configuring inactivity detection hook
 */
interface UseInactivityTimeoutOptions {
  /** Maximum minutes of inactivity allowed before firing onTimeout */
  inactivityMinutes?: number
  /** Minutes before the timeout limit to fire onWarning */
  warningMinutes?: number
  /** Callback fired when the warning threshold is reached */
  onWarning?: () => void
  /** Callback fired when the inactivity duration threshold is reached */
  onTimeout?: () => void
}

/**
 * Hook that polls the shared activity clock and reports warning / timeout thresholds.
 *
 * Callbacks are held in refs rather than listed as effect dependencies: callers pass inline
 * arrows, and depending on them would tear down and restart the timers on every render,
 * silently extending the idle window.
 *
 * @param options - Configuration options for inactivity check
 * @returns Object enclosing warning visibility status and the warning dismissal handler.
 */
export function useInactivityTimeout({
  inactivityMinutes = 30,
  warningMinutes = 5,
  onWarning,
  onTimeout,
}: UseInactivityTimeoutOptions) {
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const onWarningRef = useRef(onWarning)
  const onTimeoutRef = useRef(onTimeout)
  const hasWarnedRef = useRef(false)
  const hasTimedOutRef = useRef(false)

  useEffect(() => {
    onWarningRef.current = onWarning
    onTimeoutRef.current = onTimeout
  })

  const dismissWarning = useCallback(() => {
    markActivity()
    hasWarnedRef.current = false
    setIsWarningVisible(false)
  }, [])

  useEffect(() => {
    markActivity()

    const handleActivity = () => markActivity()
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    )

    const warningMs = (inactivityMinutes - warningMinutes) * 60 * 1000
    const logoutMs = inactivityMinutes * 60 * 1000

    const tick = setInterval(() => {
      const idleMs = Date.now() - getLastActivity()

      if (idleMs >= logoutMs) {
        // signOut is async and the interval keeps running; only fire once.
        if (hasTimedOutRef.current) return
        hasTimedOutRef.current = true
        setIsWarningVisible(false)
        onTimeoutRef.current?.()
        return
      }

      const shouldWarn = idleMs >= warningMs
      setIsWarningVisible(shouldWarn)
      if (shouldWarn && !hasWarnedRef.current) {
        hasWarnedRef.current = true
        onWarningRef.current?.()
      } else if (!shouldWarn) {
        hasWarnedRef.current = false
      }
    }, TICK_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity))
      clearInterval(tick)
    }
  }, [inactivityMinutes, warningMinutes])

  return { isWarningVisible, dismissWarning }
}
