import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, CreditCard, Smartphone, CheckCircle, Truck, ShieldCheck, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/Breadcrumbs'

const regions = [
  'Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Western', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
]

const countries = [
  { code: 'GH', name: 'Ghana' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CN', name: 'China' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'OTHER', name: 'Other International' }
]

const checkoutItems = [
  { id: 1, name: 'The Base Premium T-Shirt', price: 85, quantity: 1, size: 'M', color: 'Jet Black' },
  { id: 2, name: 'Ghana First Signature Cap', price: 55, quantity: 2, size: 'One Size', color: 'Green' }
]

export default function Checkout() {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo')
  const [isDiaspora, setIsDiaspora] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'GH',
    otherCountry: '',
    region: 'Greater Accra',
    stateProvince: '',
    postalCode: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'country') {
      setIsDiaspora(value !== 'GH')
    }
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const path = window.location.pathname.includes('/dashboard') ? '/dashboard/store/summary' : '/store/summary'
    navigate(path)
  }

  const backToCartPath = window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'

  return (
    <div className="w-full px-6 md:px-12 py-12 bg-off-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs />
        <Link 
          to={backToCartPath}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-meta text-[10px] font-bold uppercase tracking-widest">Return to Bag</span>
        </Link>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Checkout Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Delivery Details */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-brand-green/10 flex items-center justify-center rounded-full text-brand-green">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h2 className="font-h3 text-2xl text-stone-900 uppercase tracking-tight">Delivery Details</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
                  {/* Country Selector */}
                  <div className={`space-y-2 ${formData.country === 'OTHER' ? 'md:col-span-1' : 'md:col-span-2'}`}>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                      <Globe className="w-3 h-3" /> Shipping Country
                    </label>
                    <select 
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm cursor-pointer"
                    >
                      {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>

                  {formData.country === 'OTHER' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Specify Country</label>
                      <input 
                        required
                        name="otherCountry"
                        value={formData.otherCountry}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                        placeholder="Enter country name"
                      />
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Full Name</label>
                    <input 
                      required
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Email Address</label>
                    <input 
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Phone Number</label>
                    <input 
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                      placeholder={isDiaspora ? "+1 (000) 000-0000" : "024 000 0000"}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Delivery Address</label>
                    <input 
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                      placeholder="Street name, Building number, Apartment"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">City</label>
                    <input 
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                      placeholder="Accra / London / NYC"
                    />
                  </div>

                  {!isDiaspora ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Region</label>
                      <select 
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm cursor-pointer"
                      >
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">State / Province / ZIP</label>
                      <input 
                        required
                        name="stateProvince"
                        value={formData.stateProvince}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm focus:ring-1 focus:ring-brand-green outline-none transition-all text-sm"
                        placeholder="State, ZIP Code"
                      />
                    </div>
                  )}
                </div>

                {isDiaspora && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-sm flex gap-3">
                    <Truck className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      <span className="font-bold">Diaspora Shipping Note:</span> International delivery takes 7-14 business days. Additional shipping costs will be calculated based on your destination country.
                    </p>
                  </div>
                )}
              </section>

              {/* Payment Method */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-brand-green/10 flex items-center justify-center rounded-full text-brand-green">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="font-h3 text-2xl text-stone-900 uppercase tracking-tight">Payment Method</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`p-6 border rounded-sm transition-all flex items-start gap-4 text-left ${
                      paymentMethod === 'momo' 
                        ? 'border-brand-green bg-emerald-50/30 ring-1 ring-brand-green shadow-md' 
                        : 'border-stone-200 bg-white hover:border-brand-green'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'momo' ? 'border-brand-green' : 'border-stone-300'
                    }`}>
                      {paymentMethod === 'momo' && <div className="w-3 h-3 bg-brand-green rounded-full" />}
                    </div>
                    <div>
                      <Smartphone className="w-6 h-6 text-stone-900 mb-2" />
                      <p className="font-bold text-stone-900 text-sm mb-1 uppercase tracking-tight">Mobile Money</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">MTN, Vodafone, AirtelTigo</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-6 border rounded-sm transition-all flex items-start gap-4 text-left ${
                      paymentMethod === 'card' 
                        ? 'border-brand-green bg-emerald-50/30 ring-1 ring-brand-green shadow-md' 
                        : 'border-stone-200 bg-white hover:border-brand-green'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'card' ? 'border-brand-green' : 'border-stone-300'
                    }`}>
                      {paymentMethod === 'card' && <div className="w-3 h-3 bg-brand-green rounded-full" />}
                    </div>
                    <div>
                      <CreditCard className="w-6 h-6 text-stone-900 mb-2" />
                      <p className="font-bold text-stone-900 text-sm mb-1 uppercase tracking-tight">
                        {isDiaspora ? 'International Card' : 'Debit / Credit Card'}
                      </p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">Visa, Mastercard, Amex</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="mt-6 bg-white p-8 border border-stone-200 rounded-sm shadow-sm space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Card Number</label>
                      <div className="relative">
                        <input className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm outline-none" placeholder="0000 0000 0000 0000" />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Expiry Date</label>
                        <input className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm outline-none" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">CVC / CVV</label>
                        <input className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-sm outline-none" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </form>
          </div>

          {/* Right Sidebar - Order Recap */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-stone-200 rounded-sm shadow-sm sticky top-24 overflow-hidden">
              <div className="p-8 border-b border-stone-100">
                <h2 className="font-h3 text-xl text-stone-900 uppercase tracking-tight">Order Recap</h2>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-sm flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-6 h-6 text-stone-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Qty: {item.quantity} • {item.size}</p>
                      </div>
                      <p className="text-xs font-bold text-brand-green">GHS {item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-stone-100 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>GHS 195.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    <span>Shipping ({isDiaspora ? 'Diaspora' : 'Local'})</span>
                    <span>{isDiaspora ? 'GHS 120.00' : 'GHS 25.00'}</span>
                  </div>
                  <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                    <span className="font-h3 text-base text-stone-900 uppercase">Total Amount</span>
                    <span className="font-h3 text-xl text-brand-green">GHS {isDiaspora ? '315.00' : '220.00'}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  className="w-full h-14 bg-brand-green hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-lg shadow-brand-green/20"
                >
                  Pay Now & Complete Order
                </Button>

                <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-stone-100">
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Secure</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
