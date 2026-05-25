import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { Order, OrderItem } from '@/types/admin'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function OrderSummary() {
  const { settings } = useBranding()
  const location = useLocation()
  const orderId = location.state?.orderId
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false)
        return
      }
      const data = await adminService.getOrderById(orderId)
      setOrder(data)
      setLoading(false)
    }
    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <SEO title="Syncing Order..." noindex />
        <div className="flex flex-col items-center gap-4">
          <span
            className="material-symbols-outlined animate-spin"
            style={{ fontSize: 40, color: 'var(--brand-green)' }}
          >
            progress_activity
          </span>
          <p className="text-micro font-bold tracking-tight text-stone-400">
            Retrieving transaction data...
          </p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <SEO title="Order Not Found" noindex />
        <div className="max-w-md w-full p-8 text-center bg-white border border-stone-200">
          <span
            className="material-symbols-outlined text-stone-200 block mx-auto mb-4"
            style={{ fontSize: 48 }}
          >
            shopping_bag
          </span>
          <h2 className="text-xl font-bold font-meta tracking-tight text-stone-900">
            Order not found
          </h2>
          <p className="text-xs text-stone-500 mt-2 mb-6 tracking-tight">
            The requested order could not be synchronized with the vault.
          </p>
          <Link to="/store" className="btn btn-primary w-full">
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

  return (
    <main className="bg-off-white min-h-screen">
      <SEO title={`Order Confirmed #${orderNumber}`} noindex />
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-brand-green p-10 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center rotate-12 scale-150">
                <img
                  src={settings.logo_url}
                  alt=""
                  className="w-64 h-64 object-contain"
                  decoding="async"
                  loading="lazy"
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white rounded-none flex items-center justify-center shadow-lg p-2">
                    <img
                      src={settings.logo_url}
                      alt="The Base"
                      className="w-10 h-10 object-contain"
                      decoding="async"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-left border-l border-white/20 pl-4">
                    <h2 className="font-h1 text-2xl tracking-tight leading-none">The Base</h2>
                    <p className="text-[8px] font-bold tracking-tight opacity-80">Official store</p>
                  </div>
                </div>
                <h1 className="font-h1 text-h3 mb-1 tracking-tight">Order confirmed</h1>
                <p className="font-meta text-micro opacity-90 tracking-tight">
                  Your support drives the movement forward
                </p>
              </div>
            </div>

            <div className="p-6">
              {/* Order Info Bar */}
              <div className="flex flex-col gap-6 py-6 border-b border-stone-100 mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">
                      Order identifier
                    </p>
                    <p className="font-bold text-stone-900 break-all sm:break-normal">
                      #{orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-micro font-bold text-stone-400 tracking-tight mb-1 sm:text-right">
                      Date
                    </p>
                    <p className="font-bold text-stone-900 sm:text-right">{date}</p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-8 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-10deg]">
                  <img
                    src={settings.logo_url}
                    alt=""
                    className="w-80 h-80 object-contain"
                    decoding="async"
                    loading="lazy"
                  />
                </div>

                <div className="relative z-10">
                  <h3 className="font-h3 text-xl text-stone-900 mb-6 tracking-tight">
                    Items ordered
                  </h3>
                  <div className="space-y-4">
                    {order.items.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 bg-stone-50 px-4 rounded-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white flex items-center justify-center border border-stone-100 shrink-0">
                            <span
                              className="material-symbols-outlined text-stone-300"
                              style={{ fontSize: 24 }}
                            >
                              shopping_bag
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-sm leading-tight tracking-tight">
                              {item.product_name || 'Official gear'}
                            </p>
                            <p className="text-micro font-bold text-stone-400 tracking-tight mt-1">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-stone-900 text-sm whitespace-nowrap">
                          ₵{Number(item.price_at_purchase * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-stone-900 p-8 rounded-sm text-white mb-10">
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-meta tracking-tight opacity-60">
                    <span>Subtotal</span>
                    <span>₵{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-meta tracking-tight opacity-60">
                    <span>Shipping</span>
                    <span>₵{Number(order.shipping_fee).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="font-h3 text-lg tracking-tight">
                      Total paid via {order.payment_method?.toUpperCase()}
                    </span>
                    <span className="font-h3 text-2xl text-brand-green whitespace-nowrap">
                      ₵{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 border border-stone-100 rounded-sm bg-white shadow-sm">
                  <div className="w-10 h-10 bg-brand-green/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-brand-green">mail</span>
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm mb-1 tracking-tight">
                      Confirmation sent
                    </p>
                    <p className="text-xs text-stone-500 leading-relaxed font-medium">
                      A detailed receipt and tracking information has been sent to{' '}
                      <span className="font-bold text-stone-900">{order.email}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => window.print()} className="btn btn-outline flex-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      print
                    </span>
                    Print invoice
                  </button>
                  <button
                    onClick={() =>
                      navigator.share?.({ title: 'The Base Store', url: window.location.href })
                    }
                    className="btn btn-outline flex-1"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      share
                    </span>
                    Share support
                  </button>
                </div>

                <Link to="/dashboard" className="btn btn-primary w-full" style={{ height: 56 }}>
                  Back to dashboard
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-stone-400 font-meta tracking-tight flex items-center justify-center flex-wrap gap-1">
              Problems with your order?{' '}
              <Link
                to="/contact"
                className="text-brand-green font-bold hover:underline whitespace-nowrap"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
