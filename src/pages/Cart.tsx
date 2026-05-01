import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'

const initialCart = [
  {
    id: 1,
    name: 'The Base Premium T-Shirt',
    price: 85.00,
    quantity: 1,
    size: 'M',
    color: 'Jet Black',
    image: null
  },
  {
    id: 2,
    name: 'Ghana First Signature Cap',
    price: 55.00,
    quantity: 2,
    size: 'One Size',
    color: 'Movement Green',
    image: null
  }
]

export default function Cart() {
  const [items, setItems] = useState(initialCart)

  const updateQuantity = (id: number, delta: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ))
  }

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 25.00
  const total = subtotal + shipping

  return (
    <div className="w-full px-6 md:px-12 py-12 bg-off-white min-h-screen">
      <Breadcrumbs />
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="font-h1 text-2xl sm:text-h2 text-stone-900 mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-brand-green shrink-0" />
            <span>Your Shopping Bag</span>
          </h1>
          <p className="text-muted-gray font-body-md">
            Review your items and proceed to secure checkout.
          </p>
        </header>

        {items.length > 0 ? (
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm flex flex-col md:flex-row gap-6 relative group">
                  <div className="w-24 h-24 bg-stone-100 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-stone-300" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                      <Link 
                        to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${item.id}` : `/store/product/${item.id}`}
                        className="font-bold text-stone-900 text-sm sm:text-base leading-tight hover:text-brand-green transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="font-bold text-brand-green text-sm sm:text-base whitespace-nowrap shrink-0">GHS {item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center h-9 border border-stone-200 bg-white rounded-sm overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-9 h-full flex items-center justify-center hover:bg-stone-50"
                        >
                          <Minus className="w-3 h-3 text-stone-500" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-stone-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-9 h-full flex items-center justify-center hover:bg-stone-50"
                        >
                          <Plus className="w-3 h-3 text-stone-500" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-2 text-stone-400 hover:text-[var(--brand-red)] transition-colors text-[10px] font-bold uppercase tracking-widest"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link 
                to="/store"
                className="inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors mt-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-meta text-[10px] font-bold uppercase tracking-widest">Continue Shopping</span>
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm sticky top-24">
                <h2 className="font-h3 text-xl text-stone-900 mb-6 pb-4 border-b border-stone-100">Order Summary</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-stone-600 font-meta uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span className="font-bold text-stone-900">GHS {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600 font-meta uppercase tracking-wider">
                    <span>Shipping Estimate</span>
                    <span className="font-bold text-stone-900">GHS {shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600 font-meta uppercase tracking-wider">
                    <span>Taxes</span>
                    <span className="font-bold text-stone-900">Calculated at checkout</span>
                  </div>
                  <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                    <span className="font-h3 text-lg text-stone-900">Total</span>
                    <span className="font-h3 text-xl text-brand-green">GHS {total.toFixed(2)}</span>
                  </div>
                </div>

                <Button asChild className="w-full h-14 bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-lg shadow-brand-green/20">
                  <Link to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/checkout' : '/store/checkout'}>
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-stone-500">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">100% Secure Transaction</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-500">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Free Shipping over GHS 500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 py-24 px-6 rounded-sm text-center shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-stone-300" />
            </div>
            <h2 className="font-h3 text-2xl text-stone-900 mb-2">Your bag is empty</h2>
            <p className="text-muted-gray font-body-md mb-8">Looks like you haven't added anything to your bag yet.</p>
            <Button asChild className="bg-brand-green hover:bg-emerald-700 text-white px-8 h-12 text-xs font-bold uppercase tracking-widest rounded-sm">
              <Link to="/store">Explore the Store</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
