import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
  onError,
  disabled,
  autoOpen,
}: HubtelButtonProps) {
  const [loading, setLoading] = useState(false)

  const startPayment = async () => {
    if (loading || disabled) return
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('hubtel-initiate-payment', {
        body: {
          type: metadata?.donationId ? 'donation' : metadata?.orderId ? 'order' : 'payment',
          reference,
          amount,
          name,
          phone,
          email,
          metadata,
          returnUrl: window.location.href,
          cancellationUrl: window.location.href,
        },
      })

      if (error) throw error

      const checkoutUrl = data?.checkoutUrl || data?.data?.checkoutUrl || data?.data?.paymentUrl
      if (!checkoutUrl) throw new Error('Hubtel did not return a checkout URL.')

      onStarted?.()
      window.location.assign(checkoutUrl)
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
