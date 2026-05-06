import { Link } from 'react-router-dom'
import { Heart, ArrowLeft, Trash2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'

import { useStore } from '@/hooks/useStore'
import type { Product } from '@/types/product'

export default function Wishlist() {
  const { wishlist, cart, removeFromWishlist } = useStore()
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="bg-off-white min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />
        
        <header className="mb-12 mt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Link 
                to={window.location.pathname.includes('/dashboard') ? '/dashboard/store' : '/store'}
                className="inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-meta text-[10px] font-bold uppercase tracking-widest">Back to Store</span>
              </Link>
              <h1 className="text-stone-900 mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8 text-brand-red fill-brand-red" />
                My Wishlist
              </h1>
              <p className="text-muted-gray max-w-xl">
                Save your favorite items for later. Curate your movement gear and keep track of limited edition releases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'}
                className="relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm"
              >
                <ShoppingCart className="w-4 h-4 text-stone-500 group-hover:text-brand-green transition-all" />
                <span className="font-meta text-[10px] font-bold uppercase tracking-widest text-stone-600 group-hover:text-brand-green">Bag</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-green text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main>
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wishlist.map((item: Product) => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-xl transition-all duration-500 group">
                  <div className="relative aspect-square bg-stone-50 flex items-center justify-center overflow-hidden">
                    <img src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                     decoding="async" loading="lazy" />
                    <button 
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white shadow-md flex items-center justify-center hover:text-brand-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-stone-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-none shadow-sm border border-stone-100">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-900 group-hover:text-brand-green transition-colors text-base uppercase tracking-tight">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-sm font-bold text-brand-green mb-4">{item.price}</p>
                    
                    <div className="pt-6 border-t border-stone-100 flex gap-3">
                      <Button className="flex-1 bg-brand-green hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-none h-11 flex items-center gap-2">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
                      </Button>
                      <Button asChild variant="default" className="flex-1 border-stone-200 hover:border-brand-green hover:text-brand-green text-[10px] font-bold uppercase tracking-widest rounded-none h-11">
                        <Link to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${item.slug}` : `/store/product/${item.slug}`}>Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white border border-stone-200 rounded-none shadow-sm">
              <Heart className="w-16 h-16 text-stone-100 mx-auto mb-6" />
              <h2 className="text-stone-400 mb-4 uppercase tracking-widest">Your wishlist is empty</h2>
              <p className="text-muted-gray mb-10 max-w-sm mx-auto">
                Start curating your movement collection. Explore our store and save items you'd love to own.
              </p>
              <Button asChild className="bg-brand-green hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-none px-12 h-12">
                <Link to={window.location.pathname.includes('/dashboard') ? '/dashboard/store' : '/store'}>Explore Store</Link>
              </Button>
            </div>
          )}
        </main>

        {/* Recommended Section */}
        <section className="mt-24">
          <h2 className="text-stone-900 mb-12 uppercase tracking-tight">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-stone-100 rounded-none animate-pulse border border-stone-200" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
