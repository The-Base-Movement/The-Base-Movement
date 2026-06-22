/**
 * @file useInactivityTimeout.ts
 * @description Custom React hook to track user inactivity. Fires callbacks when the warning threshold
 * is reached and when the inactivity limit is exceeded. Tracks common mouse/keyboard/touch events.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

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
 * Hook that sets up inactivity timers and event listeners for keydown/mousedown/scroll/touchstart/click.
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
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isWarningVisible, setIsWarningVisible] = useState(false)

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    const warningMs = (inactivityMinutes - warningMinutes) * 60 * 1000
    const logoutMs = inactivityMinutes * 60 * 1000

    // Set warning timeout (5 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarningVisible(true)
      onWarning?.()
    }, warningMs)

    // Set logout timeout
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsWarningVisible(false)
      onTimeout?.()
    }, logoutMs)
  }, [inactivityMinutes, warningMinutes, onWarning, onTimeout])

  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false)
    resetTimeout()
  }, [resetTimeout])

  useEffect(() => {
    resetTimeout()

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetTimeout()
    }

    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [resetTimeout])

  return { isWarningVisible, dismissWarning }
}
