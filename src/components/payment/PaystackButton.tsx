import { usePaystackPayment } from 'react-paystack'
import { useEffect, useState } from 'react'

interface PaystackButtonProps {
  amount: number // GHS — multiplied ×100 internally (Paystack uses pesewas)
  name: string
  phone: string
  email?: string // falls back to donations@thebasemovement.com
  reference: string // our DB record UUID passed as Paystack reference
  metadata?: {
    donationId?: string
    orderId?: string
    memberId?: string
    context?: { type: 'chapter' | 'constituency'; name: string; id: string }
  }
  label?: string
  onSuccess: (paystackRef: string) => void
  onClose?: () => void
  disabled?: boolean
  autoOpen?: boolean // render nothing and fire popup immediately on mount
}

export default function PaystackButton({
  amount,
  name,
  phone,
  email,
  reference,
  metadata,
  label,
  onSuccess,
  onClose,
  disabled,
  autoOpen,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false)

  const config = {
    reference,
    email: email || 'donations@thebasemovement.com',
    amount: Math.round(amount * 100),
    publicKey: import.meta.env.PAYSTACK_PUBLIC_KEY as string,
    currency: 'GHS',
    channels: ['card', 'mobile_money', 'bank_transfer'],
    metadata: {
      ...(metadata || {}),
      custom_fields: [
        { display_name: 'Name', variable_name: 'name', value: name },
        { display_name: 'Phone', variable_name: 'phone', value: phone },
        ...(metadata?.custom_fields ?? []),
      ],
    },
  }

  const initializePayment = usePaystackPayment(config)

  const handleSuccess = (ref: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    setLoading(false)
    // ref.reference === the UUID we passed; Paystack echoes it back
    onSuccess(ref.reference || ref.trxref || reference)
  }

  const handleClose = () => {
    setLoading(false)
    onClose?.()
  }

  // Fire popup once on mount. Empty deps intentional — stale closure is OK
  // because autoOpen components are unmounted immediately after success/close.
  // 50ms: Paystack iframe needs one tick after mount to attach to the DOM.
  useEffect(() => {
    if (!autoOpen) return
    const t = setTimeout(
      () => initializePayment({ onSuccess: handleSuccess, onClose: handleClose }),
      50
    )
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (autoOpen) return null

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={disabled || loading}
      onClick={() => {
        setLoading(true)
        try {
          initializePayment({ onSuccess: handleSuccess, onClose: handleClose })
        } catch {
          setLoading(false)
        }
      }}
    >
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : (
        label || `Pay GHS ${amount.toFixed(2)}`
      )}
    </button>
  )
}
