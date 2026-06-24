import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = [
  'pointermove',
  'mousemove',
  'mousedown',
  'click',
  'keydown',
  'touchstart',
  'wheel',
  'scroll',
  'focus',
] as const

function getTimeoutMinutes(): number {
  const stored = Number(localStorage.getItem('admin_session_timeout_minutes'))
  return stored > 0 && stored <= 30 ? stored : 30
}

interface UseAdminSessionTimerOptions {
  onTimeout: () => void
}

export function useAdminSessionTimer({ onTimeout }: UseAdminSessionTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(() => getTimeoutMinutes() * 60)
  const deadlineRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeoutRef = useRef(onTimeout)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const resetDeadline = useCallback(() => {
    const ms = getTimeoutMinutes() * 60 * 1000
    deadlineRef.current = Date.now() + ms
  }, [])

  useEffect(() => {
    resetDeadline()

    const handleActivity = () => resetDeadline()
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))

    tickRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        onTimeoutRef.current()
      }
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity))
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [resetDeadline])

  return { secondsLeft }
}
