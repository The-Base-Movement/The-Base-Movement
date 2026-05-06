import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, Truck, ShieldCheck, Globe } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'
import type { Region } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, clearCart } = useStore()
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
        const { data: { session } } = await supabase.auth.getSession()
        
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
  }, [])

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
  
  // Point conversion logic: 100 points = 1 GHS
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
      const { data: { session } } = await supabase.auth.getSession()

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
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />
        <header className="mb-12">
          <Link 
            to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-[var(--brand-green)] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-meta text-[10px] font-bold uppercase tracking-widest">Back to Bag</span>
          </Link>
          <h1 className="font-h1 text-2xl sm:text-h2 text-stone-900 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-[var(--brand-green)] shrink-0" />
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
                  <Truck className="w-5 h-5 text-[var(--brand-green)]" />
                </div>
                <h2 className="font-h3 text-xl text-stone-900">1. Delivery Information</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">Full Name</label>
                  <input
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
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">Email Address</label>
                  <input
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
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
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
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">Shipping Address</label>
                  <input
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
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">Country</label>
                  <select
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
                    <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">State / Province</label>
                    <input
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
                    <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">Region</label>
                    <select
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
                  <CreditCard className="w-5 h-5 text-[var(--brand-green)]" />
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
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">Mobile Money</p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider">MTN, Telecel, AT Money</p>
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
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">Credit / Debit Card</p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider">Visa, Mastercard, AMEX</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'momo' && (
                <div className="mt-8 p-6 bg-stone-50 border border-stone-100 rounded-sm">
                  <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4">Select Network</label>
                  <div className="flex flex-wrap gap-4">
                    {['MTN', 'Telecel', 'AT Money'].map(network => (
                      <label key={network} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="network" className="w-4 h-4 text-[var(--brand-green)] focus:ring-[var(--brand-green)]" />
                        <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900 uppercase tracking-wider">{network}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-6">
                    <label className="block text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-2">MoMo Number</label>
                    <input
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
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">Qty: {item.quantity} | {item.selectedSize}</p>
                    </div>
                    <p className="text-xs font-bold text-stone-900">
                      GHS {(item.quantity * (typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-stone-100 mb-8">
                <div className="flex justify-between text-xs text-stone-600 uppercase tracking-wider">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">GHS {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600 uppercase tracking-wider">
                  <span>Shipping</span>
                  <span className="font-bold text-stone-900">GHS {shipping.toFixed(2)}</span>
                </div>

                {userPoints > 100 && (
                  <div className="pt-4 border-t border-stone-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="usePoints"
                          checked={usePoints}
                          onChange={(e) => setUsePoints(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-300 text-[var(--brand-green)] focus:ring-[var(--brand-green)]"
                        />
                        <label htmlFor="usePoints" className="text-[10px] font-bold text-stone-900 uppercase tracking-widest cursor-pointer">
                          Redeem Points
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--brand-green)] uppercase tracking-widest">
                        {userPoints.toLocaleString()} Available
                      </span>
                    </div>
                    {usePoints && (
                      <div className="flex justify-between text-xs text-[var(--brand-green)] uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                        <span>Points Discount</span>
                        <span className="font-bold">- GHS {appliedPointsValue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                  <span className="font-h3 text-lg text-stone-900">Total</span>
                  <span className="font-h3 text-xl text-[var(--brand-green)]">GHS {total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 bg-[var(--brand-green)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-lg shadow-brand-green/20"
              >
                {isSubmitting ? 'Processing Order...' : 'Complete Purchase'}
              </Button>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-stone-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Checkout</span>
                </div>
                <div className="flex items-center gap-3 text-stone-500">
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Worldwide Shipping</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
