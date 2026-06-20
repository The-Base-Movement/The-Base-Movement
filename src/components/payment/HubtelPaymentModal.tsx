import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface HubtelPaymentModalProps {
  isOpen: boolean
  checkoutUrl: string | null
  referenceId: string | null
  type: 'donation' | 'order'
  onClose: () => void
  onSuccess: () => void
}

export function HubtelPaymentModal({
  isOpen,
  checkoutUrl,
  referenceId,
  type,
  onClose,
  onSuccess,
}: HubtelPaymentModalProps) {
  const [iframeLoading, setIframeLoading] = useState(true)

  const [prevUrl, setPrevUrl] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(false)
  if (checkoutUrl !== prevUrl || isOpen !== prevOpen) {
    setPrevUrl(checkoutUrl)
    setPrevOpen(isOpen)
    if (isOpen) {
      setIframeLoading(true)
    }
  }

  // Real-time listener for database state updates
  useEffect(() => {
    if (!isOpen || !referenceId) return

    const table = type === 'donation' ? 'donations' : 'store_orders'
    const channelName = `hubtel_checkout_${type}_${referenceId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: `id=eq.${referenceId}`,
        },
        (payload) => {
          if (type === 'donation') {
            if (payload.new.status === 'Verified') {
              onSuccess()
            } else if (payload.new.status === 'Rejected') {
              toast.error('The payment was rejected or failed.')
              onClose()
            }
          } else {
            if (payload.new.payment_status === 'Paid') {
              onSuccess()
            } else if (payload.new.status === 'Cancelled') {
              toast.error('The order was cancelled or payment failed.')
              onClose()
            }
          }
        }
      )
      .subscribe()

    // Fallback polling every 3 seconds
    const interval = setInterval(async () => {
      try {
        if (type === 'donation') {
          const { data, error } = await supabase
            .from('donations')
            .select('status')
            .eq('id', referenceId)
            .maybeSingle()

          if (error || !data) return
          if (data.status === 'Verified') {
            onSuccess()
          } else if (data.status === 'Rejected') {
            toast.error('The payment was rejected or failed.')
            onClose()
          }
        } else {
          const { data, error } = await supabase
            .from('store_orders')
            .select('payment_status, status')
            .eq('id', referenceId)
            .maybeSingle()

          if (error || !data) return
          if (data.payment_status === 'Paid') {
            onSuccess()
          } else if (data.status === 'Cancelled') {
            toast.error('The order was cancelled or payment failed.')
            onClose()
          }
        }
      } catch (err) {
        console.warn('Fallback status check failed:', err)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [isOpen, referenceId, type, onSuccess, onClose])

  if (!isOpen || !checkoutUrl) return null

  return (
    <div className="hubtel-modal-overlay">
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => {
          if (
            window.confirm(
              'Are you sure you want to close checkout? Your payment may still be processing.'
            )
          ) {
            onClose()
          }
        }}
      />

      <div className="hubtel-modal-container">
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--card))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
            >
              encrypted
            </span>
            <div>
              <h3
                style={{
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  margin: 0,
                }}
              >
                Secure Payment
              </h3>
              <p
                style={{
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: 0,
                }}
              >
                Powered by Hubtel Checkout
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to close checkout? Your payment may still be processing.'
                )
              ) {
                onClose()
              }
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-xs)',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Content Area with Iframe */}
        <div style={{ flex: 1, position: 'relative', background: '#f5f5f5' }}>
          {iframeLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'hsl(var(--card))',
                gap: 16,
              }}
            >
              <div
                className="spinner"
                style={{
                  width: 36,
                  height: 36,
                  borderWidth: 3,
                  borderStyle: 'solid',
                  borderColor: 'hsl(var(--primary)) transparent transparent transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              ></div>
              <p
                style={{
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Connecting to Hubtel Secure Servers...
              </p>
            </div>
          )}
          <iframe
            src={checkoutUrl || ''}
            title="Hubtel Payment"
            onLoad={() => setIframeLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: iframeLoading ? 'none' : 'block',
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
