import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useStore } from '@/hooks/useStore'
import SEO from '@/components/SEO'

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity } = useStore()

  const subtotal = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
    return sum + (price * item.quantity)
  }, 0)
  const shipping = cart.length > 0 ? 25.00 : 0
  const total = subtotal + shipping

  return (
    <div className="bg-off-white min-h-screen">
      <SEO 
        title="Your Shopping Bag"
        description="Review your items and proceed to secure checkout."
        canonical="/store/cart"
        noindex
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />
        <header className="mb-12">
          <h1 className="font-h1 text-2xl sm:text-h2 text-stone-900 mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 32, color: 'var(--brand-green)' }}>shopping_bag</span>
            <span>Your Shopping Bag</span>
          </h1>
          <p className="text-muted-gray font-body-md">
            Review your items and proceed to secure checkout.
          </p>
        </header>

        {cart.length > 0 ? (
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm flex flex-col md:flex-row gap-6 relative group">
                  <div className="w-24 h-24 bg-stone-100 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                    ) : (
                      <span className="material-symbols-outlined text-stone-300" style={{ fontSize: 40 }}>shopping_bag</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                      <Link 
                        to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${item.slug}` : `/store/product/${item.slug}`}
                        className="font-bold text-stone-900 text-sm sm:text-base leading-tight hover:text-[var(--brand-green)] transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="font-bold text-[var(--brand-green)] text-sm sm:text-base whitespace-nowrap shrink-0">
                        {typeof item.price === 'string' && item.price.startsWith('₵') ? item.price : `₵${parseFloat(String(item.price)).toFixed(2)}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-micro font-bold text-stone-500 tracking-tight mb-4">
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center h-9 border border-stone-200 bg-white rounded-sm overflow-hidden">
                        <button 
                          onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-9 h-full flex items-center justify-center hover:bg-stone-50"
                        >
                          <span className="material-symbols-outlined text-stone-500" style={{ fontSize: 12 }}>remove</span>
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-stone-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-9 h-full flex items-center justify-center hover:bg-stone-50"
                        >
                          <span className="material-symbols-outlined text-stone-500" style={{ fontSize: 12 }}>add</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center gap-2 text-stone-400 hover:text-[var(--brand-red)] transition-colors text-micro font-bold tracking-tight"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link 
                to="/store"
                className="inline-flex items-center gap-2 text-stone-500 hover:text-[var(--brand-green)] transition-colors mt-4 group"
              >
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform" style={{ fontSize: 16 }}>arrow_back</span>
                <span className="font-meta text-micro font-bold tracking-tight">Continue shopping</span>
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm sticky top-24">
                <h2 className="font-h3 text-xl text-stone-900 mb-6 pb-4 border-b border-stone-100">Order Summary</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-stone-600 font-meta tracking-tight">
                    <span>Subtotal</span>
                    <span className="font-bold text-stone-900">₵{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600 font-meta tracking-tight">
                    <span>Shipping Estimate</span>
                    <span className="font-bold text-stone-900">₵{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600 font-meta tracking-tight">
                    <span>Taxes</span>
                    <span className="font-bold text-stone-900">Calculated at checkout</span>
                  </div>
                  <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                    <span className="font-h3 text-lg text-stone-900">Total</span>
                    <span className="font-h3 text-xl text-[var(--brand-green)]">₵{total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/checkout' : '/store/checkout'}
                  className="w-full h-14 text-xs font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 bg-primary text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Proceed to Checkout
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </Link>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-stone-500">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    <span className="text-micro font-bold tracking-tight">100% Secure transaction</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-500">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    <span className="text-micro font-bold tracking-tight">Free shipping over ₵500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 py-24 px-6 rounded-sm text-center shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-stone-300" style={{ fontSize: 40 }}>shopping_bag</span>
            </div>
            <h2 className="font-h3 text-2xl text-stone-900 mb-2">Your bag is empty</h2>
            <p className="text-muted-gray font-body-md mb-8">Looks like you haven't added anything to your bag yet.</p>
            <Link to="/store" className="inline-flex items-center px-8 h-12 text-xs font-bold tracking-tight rounded-sm bg-primary text-white hover:opacity-90 transition-opacity">
              Explore the Store
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
