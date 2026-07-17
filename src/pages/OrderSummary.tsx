import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { Order, OrderItem } from '@/types/admin'
import SEO from '@/components/SEO'
import { Skeleton } from '@/components/states'
import { useBranding } from '@/hooks/useBranding'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { HubtelPaymentModal } from '@/components/payment/HubtelPaymentModal'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function OrderSummary() {
  const { settings } = useBranding()
  const location = useLocation()
  const queryOrderId = new URLSearchParams(location.search).get('orderId')
  const orderId = location.state?.orderId ?? queryOrderId
  const checkoutUrl = location.state?.checkoutUrl as string | undefined
  const awaitingPayment = Boolean(location.state?.awaitingPayment)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(awaitingPayment)
  const [checkoutUrlState] = useState<string | null>(checkoutUrl || null)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false)
        return
      }
      const data = await adminService.getOrderSummary(orderId)
      setOrder(data)
      setLoading(false)
    }
    fetchOrder()
  }, [orderId])

  useEffect(() => {
    if (!orderId || (order && order.payment_status === 'Paid')) return

    const table = 'store_orders'
    const channelName = `order_summary_status_${orderId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new.payment_status === 'Paid') {
            toast.success('Payment confirmed! Thank you.')
            void adminService.getOrderSummary(orderId).then(setOrder)
          }
        }
      )
      .subscribe()

    const interval = setInterval(async () => {
      try {
        const data = await adminService.getOrderSummary(orderId)
        if (data && data.payment_status === 'Paid') {
          clearInterval(interval)
          setOrder(data)
          toast.success('Payment confirmed! Thank you.')
        }
      } catch (err) {
        console.warn('Order summary status check failed:', err)
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [orderId, order])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'hsl(var(--background))',
          maxWidth: 680,
          margin: '0 auto',
          padding: '48px 20px',
        }}
      >
        <SEO title="Syncing Order..." noindex />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton variant="text-xl" width="50%" />
          <Skeleton variant="text-sm" width="30%" />
          <Skeleton
            variant="img"
            height={200}
            style={{ borderRadius: 'var(--radius-md)', marginTop: 8 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="text-md" width={i % 2 === 1 ? '60%' : '100%'} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'hsl(var(--background))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <SEO title="Order Not Found" noindex />
        <div
          style={{
            maxWidth: 400,
            width: '100%',
            padding: 32,
            textAlign: 'center',
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: 'hsl(var(--border))',
              display: 'block',
              marginBottom: 16,
            }}
          >
            shopping_bag
          </span>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              marginBottom: 8,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Order not found
          </h2>
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 24,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            The requested order could not be found.
          </p>
          <Link to="/dashboard/store" className="btn btn-primary" style={{ width: '100%' }}>
            Back to store
          </Link>
        </div>
      </div>
    )
  }

  const date = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const orderNumber = order.id.substring(0, 8).toUpperCase()
  const paymentStatus = order.payment_status || 'Unpaid'
  const isPaid = paymentStatus === 'Paid'

  return (
    <main style={{ background: 'hsl(var(--background))', minHeight: '100vh' }}>
      <SEO title={`Order #${orderNumber}`} noindex />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 64px' }}>
        <Breadcrumbs />
        <div
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginTop: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* ── Green header ── */}
          <div
            style={{
              background: 'hsl(var(--primary))',
              padding: '40px 32px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Eagle watermark */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                opacity: 0.07,
                transform: 'rotate(8deg) scale(1.4)',
              }}
            >
              <img
                src="/branding/illustrations/Eagle Head.png"
                alt=""
                style={{ width: 260, height: 260, objectFit: 'contain' }}
                decoding="async"
                loading="lazy"
              />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Logo badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '8px 20px 8px 8px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={settings.logo_url}
                    alt="The Base"
                    style={{ width: 28, height: 28, objectFit: 'contain' }}
                    decoding="async"
                    loading="lazy"
                  />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p
                    style={{
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: "'Public Sans', sans-serif",
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    The Base
                  </p>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 9,
                      fontFamily: "'Public Sans', sans-serif",
                      margin: '3px 0 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Official store
                  </p>
                </div>
              </div>

              <h1
                style={{
                  color: '#fff',
                  fontSize: 'clamp(22px, 4vw, 30px)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontFamily: "'Public Sans', sans-serif",
                  margin: '0 0 8px',
                  letterSpacing: '-0.02em',
                }}
              >
                {isPaid ? 'Order confirmed' : 'Order received'}
              </h1>
              <p
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 12,
                  fontFamily: "'Public Sans', sans-serif",
                  margin: 0,
                }}
              >
                {isPaid
                  ? 'Your support drives the movement forward'
                  : 'Complete payment in Hubtel to confirm this purchase'}
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '32px 28px' }}>
            {/* Order meta row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 20,
                paddingBottom: 24,
                borderBottom: '1px solid hsl(var(--border))',
                marginBottom: 28,
              }}
            >
              {[
                { label: 'Order identifier', value: `#${orderNumber}` },
                { label: 'Date', value: date },
                {
                  label: 'Payment',
                  value: paymentStatus,
                  color: isPaid ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                },
              ].map((item) => (
                <div key={item.label}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '0 0 5px',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: item.color ?? 'hsl(var(--on-surface))',
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      wordBreak: 'break-all',
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Items ordered */}
            <div style={{ position: 'relative', marginBottom: 28 }}>
              {/* Eagle body watermark */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  opacity: 0.025,
                  transform: 'rotate(-8deg)',
                  zIndex: 0,
                }}
              >
                <img
                  src="/branding/patterns/eagle-in-flight.webp"
                  alt=""
                  style={{ width: 320, height: 320, objectFit: 'contain' }}
                  decoding="async"
                  loading="lazy"
                />
              </div>

              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 14px',
                  fontFamily: "'Public Sans', sans-serif",
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Items ordered
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {order.items.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '14px 16px',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 20, color: 'hsl(var(--border))' }}
                        >
                          shopping_bag
                        </span>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            margin: '0 0 3px',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {item.product_name || 'Official gear'}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: 0,
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      ₵{Number(item.price_at_purchase * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals block */}
            <div
              style={{
                background: 'hsl(var(--on-surface))',
                borderRadius: 'var(--radius-md)',
                padding: '24px 28px',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Subtotal', value: `₵${Number(order.subtotal).toFixed(2)}` },
                  { label: 'Shipping', value: `₵${Number(order.shipping_fee).toFixed(2)}` },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.55)',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    paddingTop: 16,
                    marginTop: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: '#fff',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Total {isPaid ? 'paid' : 'due'} via{' '}
                    {order.payment_method?.toUpperCase() ?? 'HUBTEL'}
                  </span>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--accent))',
                      fontFamily: "'Public Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ₵{Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!isPaid && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '18px 20px',
                    background: 'rgba(217,119,6,0.08)',
                    border: '1px solid rgba(217,119,6,0.25)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'rgba(217,119,6,0.12)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#d97706' }}
                    >
                      payments
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: '0 0 4px',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      Payment awaiting confirmation
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        lineHeight: 1.5,
                      }}
                    >
                      Complete the Hubtel checkout window. This order will update after Hubtel
                      confirms payment.
                    </p>
                    {checkoutUrlState && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: 12 }}
                        onClick={() => setIsPaymentModalOpen(true)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          open_in_new
                        </span>
                        Reopen Hubtel checkout
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '18px 20px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: 'hsl(var(--primary) / 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                  >
                    mail
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      margin: '0 0 4px',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Confirmation sent
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    A detailed receipt has been sent to{' '}
                    <span
                      style={{
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {order.email}
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    print
                  </span>
                  Print invoice
                </button>
                <button
                  onClick={() =>
                    navigator.share?.({ title: 'The Base Store', url: window.location.href })
                  }
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    share
                  </span>
                  Share
                </button>
              </div>

              <Link
                to="/dashboard"
                className="btn btn-primary"
                style={{ height: 52, marginTop: 4, width: '100%', justifyContent: 'center' }}
              >
                Back to dashboard
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>

        <p
          style={{
            marginTop: 28,
            textAlign: 'center',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Problems with your order?{' '}
          <Link
            to="/contact"
            style={{
              color: 'hsl(var(--primary))',
              fontWeight: 'var(--font-weight-medium, 500)',
              textDecoration: 'none',
            }}
          >
            Contact support
          </Link>
        </p>
      </div>

      <HubtelPaymentModal
        isOpen={isPaymentModalOpen}
        checkoutUrl={checkoutUrlState}
        referenceId={orderId}
        type="order"
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={async () => {
          setIsPaymentModalOpen(false)
          if (orderId) {
            const data = await adminService.getOrderSummary(orderId)
            setOrder(data)
          }
          toast.success('Order payment confirmed! Thank you.')
        }}
      />
    </main>
  )
}
