import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { initiateHubtelCheckout } from './hubtelCheckout'
import { HubtelPaymentModal } from './HubtelPaymentModal'

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
    jurisdiction?: string
    context?: { type: 'chapter' | 'constituency'; name: string; id: string }
  }
  label?: string
  onStarted?: () => void
  onCheckoutReady?: (checkoutUrl: string) => void
  onError?: () => void
  onPaymentComplete?: (success: boolean, reference: string) => void
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
  onPaymentComplete,
  disabled,
  autoOpen,
}: HubtelButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkoutUrlState, setCheckoutUrlState] = useState<string | null>(null)

  const startPayment = async () => {
    if (loading || disabled) return
    setLoading(true)

    try {
      const url = await initiateHubtelCheckout({
        reference,
        amount,
        name,
        phone,
        email,
        metadata,
      })

      setCheckoutUrlState(url)
      setIsModalOpen(true)
      onStarted?.()
      onCheckoutReady?.(url)
    } catch (err) {
      console.error('[HubtelButton] payment initiation failed:', err)
      toast.error('Could not start secure payment. Please try again.')
      onError?.()
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoOpen) return
    const t = setTimeout(() => void startPayment(), 50)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MessageEvent<{ type?: string; success?: boolean; reference?: string }>) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type !== 'hubtel_complete') return
      setLoading(false)
      onPaymentComplete?.(e.data.success ?? false, e.data.reference ?? '')
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onPaymentComplete])

  return (
    <>
      {!autoOpen && (
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
      )}

      <HubtelPaymentModal
        isOpen={isModalOpen}
        checkoutUrl={checkoutUrlState}
        referenceId={reference}
        type={metadata?.orderId ? 'order' : 'donation'}
        onClose={() => {
          setIsModalOpen(false)
          setLoading(false)
        }}
        onSuccess={() => {
          setIsModalOpen(false)
          setLoading(false)
          onPaymentComplete?.(true, reference)
        }}
      />
    </>
  )
}
