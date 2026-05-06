import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, Heart } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareModal } from '@/components/ShareModal'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'

const categories = ['All', 'Apparel', 'Accessories', 'Stationery', 'Limited Edition']

export default function Store() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState({ title: '', url: '' })
  const { wishlist, cart } = useStore()
  const cartCount = cart.length
  const wishlistCount = wishlist.length

  const handleShare = (product: Product) => {
    setShareData({
      title: `Check out the ${product.name} at The Base Movement Supplies!`,
      url: window.location.origin + '/store/product/' + product.slug
    })
    setIsShareModalOpen(true)
  }

  // Items per page based on responsive design
  const [itemsPerPage, setItemsPerPage] = useState(12)

  useEffect(() => {
    let isMounted = true
    async function fetchProducts() {
      setLoading(true)
      try {
        const data = await adminService.getStoreProducts()
        if (isMounted) {
          setProducts(data)
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProducts()

    const updateItemsPerPage = () => {
      const width = window.innerWidth
      let perPage = 12
      if (width < 640) perPage = 6
      else if (width < 1024) perPage = 8
      
      if (isMounted) setItemsPerPage(perPage)
    }
    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => {
      isMounted = false
      window.removeEventListener('resize', updateItemsPerPage)
    }
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )


  return (
    <div className="bg-off-white min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
      <Breadcrumbs />
      {/* Store Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-stone-900 mb-2 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-brand-green" />
              Supplies
            </h1>
            <p className="text-muted-gray max-w-xl mb-0">
              Equip yourself with official movement gear. Every purchase directly funds our grassroots organizing and civic education programs.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link 
              to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/wishlist' : '/store/wishlist'}
              className="relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-red transition-all rounded-sm bg-white shadow-sm"
            >
              <Heart className="w-4 h-4 text-stone-500 group-hover:text-brand-red transition-all" />
              <span className="font-meta text-[10px] font-bold uppercase tracking-widest text-stone-600 group-hover:text-brand-red">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link 
              to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'}
              className="relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-stone-500 group-hover:text-brand-green transition-all" />
              <span className="font-meta text-[10px] font-bold uppercase tracking-widest text-stone-600 group-hover:text-brand-green">Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-green text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-10 flex flex-col lg:flex-row gap-6 items-center justify-between bg-white p-4 border border-stone-200 rounded-sm shadow-sm">
          {/* Category Filters */}
          <div className="w-full lg:w-auto">
            {/* Mobile Dropdown */}
            <div className="relative sm:hidden">
              <select
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-xs font-meta font-bold uppercase tracking-widest appearance-none focus:ring-1 focus:ring-brand-green outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </div>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden sm:flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category)
                    setCurrentPage(1)
                  }}
                  className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                    activeCategory === category
                      ? 'bg-brand-green text-white shadow-md'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-sm text-xs font-meta focus:ring-1 focus:ring-brand-green focus:outline-none transition-all"
            />
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-stone-200 animate-pulse rounded-sm" />
          ))
        ) : paginatedProducts.length > 0 ? (
          paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onShare={handleShare} />
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <h3 className="text-stone-400">No products found in this category.</h3>
          </div>
        )}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 text-xs font-meta font-bold uppercase tracking-widest text-stone-500 hover:border-brand-green hover:text-brand-green disabled:opacity-30 disabled:hover:border-stone-200 disabled:hover:text-stone-500 transition-all rounded-sm"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            Prev
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 flex items-center justify-center text-xs font-meta font-bold border transition-all rounded-sm ${
                  currentPage === page
                    ? 'bg-brand-green border-brand-green text-white shadow-md'
                    : 'bg-white border-stone-200 text-stone-500 hover:border-brand-green hover:text-brand-green'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 text-xs font-meta font-bold uppercase tracking-widest text-stone-500 hover:border-brand-green hover:text-brand-green disabled:opacity-30 disabled:hover:border-stone-200 disabled:hover:text-stone-500 transition-all rounded-sm"
          >
            Next
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      )}

      {/* Trust Badges */}
      <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-stone-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100">
            <span className="material-symbols-outlined text-brand-green">local_shipping</span>
          </div>
          <div>
            <h4 className="text-stone-900 mb-1">Nationwide Delivery</h4>
            <p className="text-xs text-muted-gray mb-0">Prompt shipping to all 16 regions.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100">
            <span className="material-symbols-outlined text-brand-green">verified_user</span>
          </div>
          <div>
            <h4 className="text-stone-900 mb-1">Secure Payment</h4>
            <p className="text-xs text-muted-gray mb-0">MoMo and Card payments protected.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100">
            <span className="material-symbols-outlined text-brand-green">volunteer_activism</span>
          </div>
          <div>
            <h4 className="text-stone-900 mb-1">Movement Impact</h4>
            <p className="text-xs text-muted-gray mb-0">100% profit goes to the cause.</p>
          </div>
        </div>
      </section>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={shareData.title}
        url={shareData.url}
      />
      </div>
    </div>
  )
}
