import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'
import { Skeleton } from '@/components/states'

import { useStore } from '@/hooks/useStore'
import type { Product } from '@/types/product'

export default function Wishlist() {
  const { wishlist, cart, removeFromWishlist } = useStore()
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="bg-off-white min-h-screen">
      <SEO
        title="My Wishlist"
        description="Curate your favorite movement gear and keep track of limited edition releases."
        canonical="/store/wishlist"
        noindex
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />

        <header className="mb-12 mt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Link
                to={
                  typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')
                    ? '/dashboard/store'
                    : '/store'
                }
                className="inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors mb-6 group"
              >
                <span
                  className="material-symbols-outlined group-hover:-translate-x-1 transition-transform"
                  style={{ fontSize: 16 }}
                >
                  arrow_back
                </span>
                <span className="font-meta text-micro font-bold tracking-tight">Back to store</span>
              </Link>
              <h1 className="text-stone-900 mb-2 flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-brand-red"
                  style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                My Wishlist
              </h1>
              <p className="text-muted-gray max-w-xl">
                Save your favorite items for later. Curate your movement gear and keep track of
                limited edition releases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={
                  typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')
                    ? '/dashboard/store/cart'
                    : '/store/cart'
                }
                className="relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm"
              >
                <span
                  className="material-symbols-outlined text-stone-500 group-hover:text-brand-green transition-all"
                  style={{ fontSize: 16 }}
                >
                  shopping_cart
                </span>
                <span className="font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-green">
                  Bag
                </span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-green text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
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
                <div
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-xl transition-all duration-500 group"
                >
                  <div className="relative aspect-square bg-stone-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      decoding="async"
                      loading="lazy"
                    />
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white shadow-md flex items-center justify-center hover:text-brand-red transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        delete
                      </span>
                    </button>
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-stone-800 text-micro font-bold tracking-tight px-2.5 py-1 rounded-none shadow-sm border border-stone-100">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-900 group-hover:text-brand-green transition-colors text-base tracking-tight">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-sm font-bold text-brand-green mb-4">{item.price}</p>

                    <div className="pt-6 border-t border-stone-100 flex gap-3">
                      <button className="btn btn-primary flex-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          shopping_cart
                        </span>
                        Add to Cart
                      </button>
                      <Link
                        to={
                          typeof window !== 'undefined' &&
                          window.location.pathname.includes('/dashboard')
                            ? `/dashboard/store/product/${item.slug}`
                            : `/store/product/${item.slug}`
                        }
                        className="btn btn-outline flex-1"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white border border-stone-200 rounded-none shadow-sm">
              <span
                className="material-symbols-outlined text-stone-200 block mx-auto mb-6"
                style={{ fontSize: 64 }}
              >
                favorite
              </span>
              <h2 className="text-stone-400 mb-4 tracking-tight">Your wishlist is empty</h2>
              <p className="text-muted-gray mb-10 max-w-sm mx-auto">
                Start curating your movement collection. Explore our store and save items you'd love
                to own.
              </p>
              <Link
                to={
                  typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')
                    ? '/dashboard/store'
                    : '/store'
                }
                className="btn btn-primary"
              >
                Explore Store
              </Link>
            </div>
          )}
        </main>

        {/* Recommended Section */}
        <section className="mt-24">
          <h2 className="text-stone-900 mb-12 tracking-tight">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton variant="img" style={{ aspectRatio: '3/4', height: 'auto' }} />
                <Skeleton variant="text-md" width="75%" />
                <Skeleton variant="text-sm" width="40%" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
