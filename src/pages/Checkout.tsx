import React, { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'
import { userActivityService } from '@/services/userActivityService'
import type { Region } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { discordService } from '@/services/discordService'
import { DeliveryForm } from './checkout/DeliveryForm'
import { PaymentMethodSelector } from './checkout/PaymentMethodSelector'
import { initiateHubtelCheckout, openHubtelCheckout } from '@/components/payment/hubtelCheckout'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname.includes('/dashboard')
  const { cart, clearCart } = useStore()
  const { session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<'idle' | 'starting' | 'checkout' | 'failed'>(
    'idle'
  )
  const [isDiaspora, setIsDiaspora] = useState(false)
  const [dbCountries, setDbCountries] = useState<{ name: string; is_diaspora: boolean }[]>([])
  const [dbRegions, setDbRegions] = useState<Region[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [usePoints, setUsePoints] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Ghana',
    otherCountry: '',
    region: 'Greater Accra',
    stateProvince: '',
    postalCode: '',
  })

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const [cList, rList] = await Promise.all([
          adminService.getCountries(),
          adminService.getRegions(),
        ])
        if (session?.user?.id) {
          const points = await adminService.getMemberPoints(session.user.id)
          if (isMounted) setUserPoints(points)
        }
        if (isMounted) {
          setDbCountries(cList)
          setDbRegions(rList)
          const ghana = cList.find((c) => c.name.toLowerCase() === 'ghana')
          if (ghana) setFormData((prev) => ({ ...prev, country: ghana.name }))
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'country') {
      const selected = dbCountries.find((c) => c.name === value)
      setIsDiaspora(selected ? selected.is_diaspora : value.toLowerCase() !== 'ghana')
    }
    setFormData({ ...formData, [name]: value })
  }

  const subtotal = cart.reduce((sum, item) => {
    const price =
      typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
    return sum + price * item.quantity
  }, 0)
  const shipping = cart.length > 0 ? 25.0 : 0
  const pointsValue = Math.floor(userPoints / 100)
  const appliedPointsValue = usePoints ? Math.min(pointsValue, subtotal) : 0
  const total = subtotal + shipping - appliedPointsValue
  const pointsToRedeem = appliedPointsValue * 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error('Your shopping bag is empty.')
      return
    }
    setIsSubmitting(true)
    setPaymentState('starting')
    setCheckoutUrl(null)
    try {
      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .insert({
          customer_id: session?.user?.id || null,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          shipping_address: formData.address,
          city: formData.city,
          country: formData.country,
          region_or_state: isDiaspora ? formData.stateProvince : formData.region,
          payment_method: 'Hubtel',
          subtotal,
          shipping_fee: shipping,
          total_amount: total,
          points_redeemed: usePoints ? pointsToRedeem : 0,
          points_value_ghs: appliedPointsValue,
          status: 'Pending',
          payment_status: 'Unpaid',
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase:
          typeof item.price === 'string'
            ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
            : item.price,
      }))

      const { error: itemsError } = await supabase.from('store_order_items').insert(orderItems)
      if (itemsError) throw itemsError

      if (session?.user?.id) {
        await userActivityService.logActivity(
          session.user.id,
          'store_order',
          `Placed an order (${cart.length} item${cart.length === 1 ? '' : 's'})`,
          { order_id: order.id }
        )
      }

      const summaryPath = isDashboard ? '/dashboard/store/summary' : '/store/summary'
      const summaryUrl = `${window.location.origin}${summaryPath}?orderId=${order.id}`
      const url = await initiateHubtelCheckout({
        reference: order.id,
        amount: total,
        currency: 'GHS',
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        returnUrl: summaryUrl,
        cancellationUrl: window.location.href,
        metadata: {
          orderId: order.id,
          memberId: session?.user?.id,
          itemCount: cart.length,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
          pointsValueGhs: appliedPointsValue,
          country: formData.country,
          regionOrState: isDiaspora ? formData.stateProvince : formData.region,
        },
      })

      setCheckoutUrl(url)
      setPaymentState('checkout')
      discordService.storeOrderPlaced(
        order.id,
        formData.fullName,
        total,
        cart.length,
        'Hubtel secure checkout',
        isDiaspora ? formData.stateProvince : formData.region
      )
      trackEvent('store_payment_started', { total, items: cart.length, provider: 'Hubtel' })
      toast.success('Secure checkout opened. Complete payment to confirm your order.')
      const popup = openHubtelCheckout(url)
      if (!popup) toast.info('Allow popups or use the checkout button to complete payment.')
      clearCart()
      navigate(summaryPath, {
        state: { orderId: order.id, checkoutUrl: url, awaitingPayment: true },
      })
    } catch (err: unknown) {
      console.error('Checkout failed:', err)
      setPaymentState('failed')
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start secure checkout. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-off-white min-h-screen">
      <SEO
        title="Secure Checkout"
        description="Finalize your order and equip yourself for the movement."
        canonical="/store/checkout"
        noindex
      />
      <div className="page-container py-12">
        <Breadcrumbs />
        <header className="mb-12">
          <Link
            to={isDashboard ? '/dashboard/store/cart' : '/store/cart'}
            className="inline-flex items-center gap-2 hover:text-brand-green transition-colors mb-4 group"
            style={{ color: 'hsl(var(--on-surface-muted))' }}
          >
            <span
              className="material-symbols-outlined group-hover:-translate-x-1 transition-transform"
              style={{ fontSize: 16 }}
            >
              arrow_back
            </span>
            <span className="font-meta text-micro font-bold tracking-tight">Back to bag</span>
          </Link>
          <h1
            className="font-h1 text-2xl sm:text-h2 flex items-center gap-3"
            style={{ color: 'hsl(var(--on-surface))' }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: 32, color: 'hsl(var(--brand-green))' }}
            >
              check_circle
            </span>
            <span>Secure Checkout</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <DeliveryForm
              formData={formData}
              isDiaspora={isDiaspora}
              dbCountries={dbCountries}
              dbRegions={dbRegions}
              onChange={handleChange}
            />
            <PaymentMethodSelector />
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white border border-border p-8 rounded-sm shadow-sm sticky top-24">
              <h2
                className="font-h3 text-xl mb-6 pb-4 border-b border-border"
                style={{ color: 'hsl(var(--on-surface))' }}
              >
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex justify-between items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold line-clamp-1"
                        style={{ color: 'hsl(var(--on-surface))' }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-micro tracking-tight"
                        style={{ color: 'hsl(var(--on-surface-muted))' }}
                      >
                        Qty: {item.quantity} | {item.selectedSize}
                      </p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: 'hsl(var(--on-surface))' }}>
                      ₵
                      {(
                        item.quantity *
                        (typeof item.price === 'string'
                          ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
                          : item.price)
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-border mb-8">
                <div
                  className="flex justify-between text-xs tracking-tight"
                  style={{ color: 'hsl(var(--on-surface-muted))' }}
                >
                  <span>Subtotal</span>
                  <span className="font-bold" style={{ color: 'hsl(var(--on-surface))' }}>
                    ₵{subtotal.toFixed(2)}
                  </span>
                </div>
                <div
                  className="flex justify-between text-xs tracking-tight"
                  style={{ color: 'hsl(var(--on-surface-muted))' }}
                >
                  <span>Shipping</span>
                  <span className="font-bold" style={{ color: 'hsl(var(--on-surface))' }}>
                    ₵{shipping.toFixed(2)}
                  </span>
                </div>

                {userPoints > 100 && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          name="name-e1342c"
                          type="checkbox"
                          id="usePoints"
                          checked={usePoints}
                          onChange={(e) => setUsePoints(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-brand-green focus:ring-brand-green"
                        />
                        <label
                          htmlFor="usePoints"
                          className="text-micro font-bold tracking-tight cursor-pointer"
                          style={{ color: 'hsl(var(--on-surface))' }}
                        >
                          Redeem Points
                        </label>
                      </div>
                      <span className="text-micro font-bold text-brand-green tracking-tight">
                        {userPoints.toLocaleString()} Available
                      </span>
                    </div>
                    {usePoints && (
                      <div className="flex justify-between text-xs text-brand-green tracking-tight animate-in fade-in slide-in-from-top-1">
                        <span>Points Discount</span>
                        <span className="font-bold">- ₵{appliedPointsValue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-h3 text-lg" style={{ color: 'hsl(var(--on-surface))' }}>
                    Total
                  </span>
                  <span className="font-h3 text-xl text-brand-green">₵{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || paymentState === 'checkout'}
                className="btn btn-primary w-full disabled:opacity-60"
                style={{ height: 56 }}
              >
                {paymentState === 'starting'
                  ? 'Opening secure checkout...'
                  : paymentState === 'checkout'
                    ? 'Checkout opened'
                    : paymentState === 'failed'
                      ? 'Try secure checkout again'
                      : 'Finish payment'}
              </button>

              {checkoutUrl && (
                <button
                  type="button"
                  className="btn btn-outline w-full mt-3"
                  onClick={() => openHubtelCheckout(checkoutUrl)}
                  style={{ height: 46, justifyContent: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                    open_in_new
                  </span>
                  Reopen Hubtel checkout
                </button>
              )}

              <div className="mt-8 space-y-4">
                <div
                  className="flex items-center gap-3"
                  style={{ color: 'hsl(var(--on-surface-muted))' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    verified_user
                  </span>
                  <span className="text-micro font-bold tracking-tight">Encrypted checkout</span>
                </div>
                <div
                  className="flex items-center gap-3"
                  style={{ color: 'hsl(var(--on-surface-muted))' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    public
                  </span>
                  <span className="text-micro font-bold tracking-tight">Worldwide shipping</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
