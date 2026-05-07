import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, Heart, Filter } from 'lucide-react'
import { Button } from '../components/ui/neon-button'
import { ProductCard } from '@/components/ProductCard'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareModal } from '@/components/ShareModal'
import { BrandLine } from '@/components/ui/BrandLine'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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

  const itemsPerPage = 12

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

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const FilterSection = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-8", isMobile && "pb-20")}>
      <div className={cn("bg-white p-6 shadow-sm", !isMobile && "border border-stone-200")}>
        <h3 className="text-[11px] font-bold text-stone-400 normal-case tracking-tight mb-6">Store Filters</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-tight text-stone-500">Search Supplies</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-11 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-none text-xs focus:ring-1 focus:ring-brand-green outline-none transition-all font-bold tracking-tight"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-tight text-stone-500">Categories</p>
            <div className="flex flex-col gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "w-full h-12 flex items-center justify-between px-4 text-[11px] font-bold tracking-tight border rounded-none transition-all",
                    activeCategory === category 
                      ? 'bg-on-surface text-white hover:bg-on-surface/90' 
                      : 'bg-white text-stone-500 border-stone-200 hover:!text-emerald-600 hover:border-emerald-600/20 hover:bg-emerald-50/30'
                  )}
                >
                  {category}
                  {activeCategory === category && <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-charcoal-dark p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-green)]/10 -mr-12 -mt-12 blur-2xl"></div>
        <div className="relative z-10 space-y-4">
          <p className="text-warm-gold text-[10px] font-bold tracking-tight normal-case">Movement Impact</p>
          <h4 className="text-white text-lg font-meta font-bold tracking-tight leading-snug">Every purchase builds the base</h4>
          <p className="text-[10px] text-stone-400 font-bold tracking-tight leading-relaxed">
            All profits are reinvested into grassroots organizing and community infrastructure across Ghana's 16 regions.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1280px] mx-auto px-8 py-8">
          <Breadcrumbs />
          <div className="mt-4">
            <h1 className="text-stone-900 mb-4 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-brand-green" />
              Movement Supplies
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-2xl mt-4 leading-relaxed font-bold tracking-tight">
              Equip yourself with official movement gear. Every purchase directly funds our grassroots organizing and civic education programs.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 lg:mb-12">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button asChild variant="ghost" className="flex-1 md:flex-none relative group border-stone-200 hover:border-brand-red h-12 text-[11px] font-bold tracking-tight rounded-none">
              <Link to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/wishlist' : '/store/wishlist'}>
                <Heart className="w-4 h-4 mr-2 text-stone-500 group-hover:text-brand-red transition-all" />
                Wishlist
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="flex-1 md:flex-none relative group border-stone-200 hover:border-brand-green h-12 text-[11px] font-bold tracking-tight rounded-none">
              <Link to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'}>
                <ShoppingBag className="w-4 h-4 mr-2 text-stone-500 group-hover:text-brand-green transition-all" />
                Bag
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-green text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>

          <div className="lg:hidden flex gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 h-12 gap-2 font-bold tracking-tight text-xs border-stone-200 rounded-none">
                  <Filter className="w-4 h-4" />
                  Filter Supplies
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 border-r-0">
                <SheetHeader className="p-6 border-b border-stone-100">
                  <SheetTitle className="font-meta font-bold tracking-tight text-lg">Categories</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-full p-6">
                  <FilterSection isMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block lg:w-[320px] shrink-0 lg:sticky lg:top-8 lg:self-start">
            <FilterSection />
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-stone-100 animate-pulse rounded-none" />
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onShare={handleShare} />
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white border border-stone-200 rounded-none">
                  <ShoppingBag className="w-16 h-16 text-stone-100 mx-auto mb-4" />
                  <h3 className="text-stone-400 font-bold tracking-tight">No products found.</h3>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-16 pt-12 border-t border-stone-100">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={cn("cursor-pointer", currentPage === 1 && "opacity-30 pointer-events-none")}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className="cursor-pointer font-bold tracking-tight"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={cn("cursor-pointer", currentPage === totalPages && "opacity-30 pointer-events-none")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </main>

      <section className="max-w-[1280px] mx-auto px-8 mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-t border-stone-200">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 bg-emerald-50 rounded-none flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-brand-green">local_shipping</span>
          </div>
          <div>
            <h4 className="text-stone-900 font-bold tracking-tight mb-2">Nationwide Delivery</h4>
            <p className="text-[11px] text-stone-500 font-bold tracking-tight leading-relaxed">Prompt shipping to all 16 regions of Ghana and international hubs.</p>
          </div>
        </div>
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 bg-amber-50 rounded-none flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-warm-gold">verified_user</span>
          </div>
          <div>
            <h4 className="text-stone-900 font-bold tracking-tight mb-2">Secure Payment</h4>
            <p className="text-[11px] text-stone-500 font-bold tracking-tight leading-relaxed">MoMo and Card payments protected by strategic encryption protocols.</p>
          </div>
        </div>
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 bg-red-50 rounded-none flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-brand-red">volunteer_activism</span>
          </div>
          <div>
            <h4 className="text-stone-900 font-bold tracking-tight mb-2">Strategic Impact</h4>
            <p className="text-[11px] text-stone-500 font-bold tracking-tight leading-relaxed">100% of profits fund grassroots mobilization and regional empowerment.</p>
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
  )
}
