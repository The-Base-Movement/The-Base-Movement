import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'
import type { Region } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, clearCart } = useStore()
  const { session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo')
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
    postalCode: ''
  })

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        
        const [cList, rList] = await Promise.all([
          adminService.getCountries(),
          adminService.getRegions()
        ])

        if (session?.user?.id) {
          const points = await adminService.getMemberPoints(session.user.id)
          if (isMounted) setUserPoints(points)
        }

        if (isMounted) {
          setDbCountries(cList)
          setDbRegions(rList)
          
          // Set default country if available
          const ghana = cList.find(c => c.name.toLowerCase() === 'ghana')
          if (ghana) {
            setFormData(prev => ({ ...prev, country: ghana.name }))
          }
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'country') {
      const selected = dbCountries.find(c => c.name === value)
      setIsDiaspora(selected ? selected.is_diaspora : value.toLowerCase() !== 'ghana')
    }
    setFormData({ ...formData, [name]: value })
  }

  const subtotal = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
    return sum + (price * item.quantity)
  }, 0)
  const shipping = cart.length > 0 ? 25.00 : 0
  
  // Point conversion logic: 100 points = 1 ₵
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
    try {

      // 1. Insert Master Order Record
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
          payment_method: paymentMethod,
          subtotal,
          shipping_fee: shipping,
          total_amount: total,
          points_redeemed: usePoints ? pointsToRedeem : 0,
          points_value_ghs: appliedPointsValue,
          status: 'Pending'
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      // 2. Insert Associated Order Line Items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
      }))

      const { error: itemsError } = await supabase
        .from('store_order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Deduct points if used
      if (usePoints && session?.user?.id) {
        await supabase.from('member_points').insert({
          user_id: session.user.id,
          points: -pointsToRedeem,
          reason: `Store Redemption: Order #${order.id.substring(0,8)}`,
          reference_id: order.id
        })
      }

      // 4. Cleanup & Forward
      toast.success('Order placed successfully! Check your email for details.')
      clearCart()
      
      const path = window.location.pathname.includes('/dashboard') ? '/dashboard/store/summary' : '/store/summary'
      navigate(path, { state: { orderId: order.id } })
      
    } catch (err: unknown) {
      console.error('Checkout failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to process checkout. Please try again.'
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
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />
        <header className="mb-12">
          <Link 
            to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-[var(--brand-green)] transition-colors mb-4 group"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform" style={{ fontSize: 16 }}>arrow_back</span>
            <span className="font-meta text-micro font-bold tracking-tight">Back to bag</span>
          </Link>
          <h1 className="font-h1 text-2xl sm:text-h2 text-stone-900 flex items-center gap-3">
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 32, color: 'var(--brand-green)' }}>check_circle</span>
            <span>Secure Checkout</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-12">
          {/* Shipping & Payment Form */}
          <div className="lg:col-span-8 space-y-8">
            {/* Delivery Information */}
            <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--brand-green)' }}>local_shipping</span>
                </div>
                <h2 className="font-h3 text-xl text-stone-900">1. Delivery Information</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">Full name</label>
                  <input aria-label="Enter your full name" id="input-9f4084"
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">Email address</label>
                  <input aria-label="email@example.com" id="input-94b596"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">Phone number</label>
                  <input aria-label="+233 00 000 0000" id="input-6781fb"
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
                    placeholder="+233 00 000 0000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">Shipping address</label>
                  <input aria-label="House Number, Street Name" id="input-5705f2"
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
                    placeholder="House Number, Street Name"
                  />
                </div>
                <div>
                  <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">Country</label>
                  <select id="select-5d78b8"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm appearance-none"
                  >
                    {dbCountries.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                    {dbCountries.length === 0 && <option value="Ghana">Ghana</option>}
                  </select>
                </div>
                {isDiaspora ? (
                  <div>
                    <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">State / Province</label>
                    <input aria-label="State or Province" id="input-c53526"
                      type="text"
                      name="stateProvince"
                      value={formData.stateProvince}
                      onChange={handleChange}
                      className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
                      placeholder="State or Province"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">Region</label>
                    <select id="select-12f928"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm appearance-none"
                    >
                      {dbRegions.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                      {dbRegions.length === 0 && <option value="Greater Accra">Greater Accra</option>}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--brand-green)' }}>credit_card</span>
                </div>
                <h2 className="font-h3 text-xl text-stone-900">2. Payment Method</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex items-center gap-4 p-6 border rounded-sm transition-all text-left ${
                    paymentMethod === 'momo' 
                      ? 'border-[var(--brand-green)] bg-[var(--brand-green)]/5 ring-1 ring-[var(--brand-green)]' 
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'momo' ? 'bg-[var(--brand-green)] text-white' : 'bg-stone-200 text-stone-500'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>smartphone</span>
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">Mobile money</p>
                    <p className="text-micro text-stone-500 tracking-tight">MTN, Telecel, AT money</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-4 p-6 border rounded-sm transition-all text-left ${
                    paymentMethod === 'card' 
                      ? 'border-[var(--brand-green)] bg-[var(--brand-green)]/5 ring-1 ring-[var(--brand-green)]' 
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'bg-[var(--brand-green)] text-white' : 'bg-stone-200 text-stone-500'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>credit_card</span>
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">Credit / debit card</p>
                    <p className="text-micro text-stone-500 tracking-tight">Visa, Mastercard, AMEX</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'momo' && (
                <div className="mt-8 p-6 bg-stone-50 border border-stone-100 rounded-sm">
                  <label className="block text-micro font-bold text-stone-900 tracking-tight mb-4">Select network</label>
                  <div className="flex flex-wrap gap-4">
                    {['MTN', 'Telecel', 'AT Money'].map(network => (
                      <label key={network} className="flex items-center gap-2 cursor-pointer group">
                        <input id="input-4964d2" type="radio" name="network" className="w-4 h-4 text-[var(--brand-green)] focus:ring-[var(--brand-green)]" />
                        <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900 tracking-tight">{network}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-6">
                    <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">MoMo number</label>
                    <input aria-label="Enter your mobile number" name="name-94ad78" id="input-94ad78"
                      type="tel"
                      className="w-full h-12 bg-white border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
                      placeholder="Enter your mobile number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm sticky top-24">
              <h2 className="font-h3 text-xl text-stone-900 mb-6 pb-4 border-b border-stone-100">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                {cart.map(item => (
                  <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 line-clamp-1">{item.name}</p>
                      <p className="text-micro text-stone-500 tracking-tight">Qty: {item.quantity} | {item.selectedSize}</p>
                    </div>
                    <p className="text-xs font-bold text-stone-900">
                      ₵{(item.quantity * (typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-stone-100 mb-8">
                <div className="flex justify-between text-xs text-stone-600 tracking-tight">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600 tracking-tight">
                  <span>Shipping</span>
                  <span className="font-bold text-stone-900">₵{shipping.toFixed(2)}</span>
                </div>

                {userPoints > 100 && (
                  <div className="pt-4 border-t border-stone-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input name="name-e1342c"
                          type="checkbox"
                          id="usePoints"
                          checked={usePoints}
                          onChange={(e) => setUsePoints(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-300 text-[var(--brand-green)] focus:ring-[var(--brand-green)]"
                        />
                        <label htmlFor="usePoints" className="text-micro font-bold text-stone-900 tracking-tight cursor-pointer">
                          Redeem Points
                        </label>
                      </div>
                      <span className="text-micro font-bold text-[var(--brand-green)] tracking-tight">
                        {userPoints.toLocaleString()} Available
                      </span>
                    </div>
                    {usePoints && (
                      <div className="flex justify-between text-xs text-[var(--brand-green)] tracking-tight animate-in fade-in slide-in-from-top-1">
                        <span>Points Discount</span>
                        <span className="font-bold">- ₵{appliedPointsValue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                  <span className="font-h3 text-lg text-stone-900">Total</span>
                  <span className="font-h3 text-xl text-[var(--brand-green)]">₵{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-xs font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? 'Processing Order...' : 'Complete Purchase'}
              </button>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-stone-500">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                  <span className="text-micro font-bold tracking-tight">Encrypted checkout</span>
                </div>
                <div className="flex items-center gap-3 text-stone-500">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>public</span>
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
