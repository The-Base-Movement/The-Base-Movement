import { useState } from 'react'
import { toast } from 'sonner'
import { registrationService } from '@/services/registrationService'
import type { SubmitConfig } from '@/services/registrationService'
import { trackEvent } from '@/lib/analytics'

export function useRegistrationSubmit() {
  const [isLoading, setIsLoading] = useState(false)
  const [regNumber, setRegNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitRegistration = async (config: SubmitConfig) => {
    setIsLoading(true)
    try {
      const result = await registrationService.submit(config)
      setRegNumber(result.regNo)
      setSubmitted(true)
      trackEvent('registration_complete', { platform: config.platform })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error((error as Error)?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, regNumber, submitted, setSubmitted, submitRegistration }
}
