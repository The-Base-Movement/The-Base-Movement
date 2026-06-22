import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { registrationService } from '@/services/registrationService'
import type { SubmitConfig } from '@/services/registrationService'
import { trackEvent } from '@/lib/analytics'

export function useRegistrationSubmit() {
  const [isLoading, setIsLoading] = useState(false)
  const [regNumber, setRegNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [cooldown])

  const submitRegistration = useCallback(
    async (config: SubmitConfig) => {
      if (cooldown > 0) {
        toast.error(`Please wait ${cooldown} seconds before trying again.`)
        return
      }
      setIsLoading(true)
      try {
        const result = await registrationService.submit(config)
        setRegNumber(result.regNo)
        setSubmitted(true)
        trackEvent('registration_complete', { platform: config.platform })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (error) {
        const msg = (error as Error)?.message || ''
        if (msg.startsWith('RATE_LIMIT:')) {
          const seconds = parseInt(msg.split(':')[1], 10) || 60
          setCooldown(seconds)
          toast.error(`For security purposes, please wait ${seconds} seconds before trying again.`)
        } else {
          toast.error(msg || 'Registration failed. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [cooldown]
  )

  return { isLoading, regNumber, submitted, setSubmitted, submitRegistration, cooldown }
}
