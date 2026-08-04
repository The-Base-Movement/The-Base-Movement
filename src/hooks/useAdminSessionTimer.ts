import { useEffect, useRef, useState } from 'react'
import { ACTIVITY_EVENTS, getLastActivity, markActivity } from '@/lib/lastActivity'

function getTimeoutMinutes(): number {
  const stored = Number(localStorage.getItem('admin_session_timeout_minutes'))
  return stored > 0 && stored <= 30 ? stored : 30
}

interface UseAdminSessionTimerOptions {
  onTimeout: () => void
}

export function useAdminSessionTimer({ onTimeout }: UseAdminSessionTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(() => getTimeoutMinutes() * 60)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  const hasTimedOutRef = useRef(false)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    markActivity()

    const handleActivity = () => markActivity()
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))

    tickRef.current = setInterval(() => {
      const timeoutMs = getTimeoutMinutes() * 60 * 1000
      const remaining = Math.max(0, Math.round((getLastActivity() + timeoutMs - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0 && !hasTimedOutRef.current) {
        // logout is async and the interval keeps running; only fire once.
        hasTimedOutRef.current = true
        onTimeoutRef.current()
      }
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity))
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  return { secondsLeft }
}
