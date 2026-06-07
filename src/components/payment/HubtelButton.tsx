import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { initiateHubtelCheckout, openHubtelCheckout } from './hubtelCheckout'

interface HubtelButtonProps {
  amount: number
  name: string
  phone: string
  email?: string
  reference: string
  metadata?: {
    donationId?: string
    orderId?: string
    memberId?: string
    context?: { type: 'chapter' | 'constituency'; name: string; id: string }
  }
  label?: string
  onStarted?: () => void
  onCheckoutReady?: (checkoutUrl: string) => void
  onError?: () => void
  disabled?: boolean
  autoOpen?: boolean
}

export default function HubtelButton({
  amount,
  name,
  phone,
  email,
  reference,
  metadata,
  label,
  onStarted,
  onCheckoutReady,
  onError,
  disabled,
  autoOpen,
}: HubtelButtonProps) {
  const [loading, setLoading] = useState(false)

  const startPayment = async () => {
    if (loading || disabled) return
    setLoading(true)

    try {
      const checkoutUrl = await initiateHubtelCheckout({
        reference,
        amount,
        name,
        phone,
        email,
        metadata,
      })

      onStarted?.()
      onCheckoutReady?.(checkoutUrl)
      const popup = openHubtelCheckout(checkoutUrl)
      if (!popup) toast.info('Allow popups or use the checkout button to complete payment.')
    } catch (err) {
      console.error('[HubtelButton] payment initiation failed:', err)
      toast.error('Could not start Hubtel payment. Please try again.')
      onError?.()
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoOpen) return
    const t = setTimeout(() => void startPayment(), 50)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (autoOpen) return null

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={disabled || loading}
      onClick={startPayment}
    >
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : (
        label || `Pay GHS ${amount.toFixed(2)}`
      )}
    </button>
  )
}
