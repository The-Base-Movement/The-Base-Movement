import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, Heart, Filter, Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/neon-button'
import { ProductCard } from '@/components/ProductCard'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareModal } from '@/components/ShareModal'
import { BrandLine } from '@/components/ui/BrandLine'
import SEO from '@/components/SEO'
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

const categories = ['All', 'Apparel', 'Accessories', 'Books', 'Print']

export default function Store() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState({ title: '', url: '' })
  
  const { wishlist, cart, addToCart, removeFromCart, updateQuantity } = useStore()
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  const subtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
    return sum + (price * item.quantity)
  }, 0)
  
  const shipping = cart.length > 0 ? 18 : 0
  const discount = cart.length > 0 ? 25 : 0
  const total = Math.max(0, subtotal + shipping - discount)

  const handleShare = (product: Product) => {
    setShareData({
      title: `Check out the ${product.name} at The Base Movement Supplies!`,
      url: (typeof window !== 'undefined' ? window.location.origin : '') + '/store/product/' + product.slug
    })
    setIsShareModalOpen(true)
  }

  const itemsPerPage = 9

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

  return (
    <div className="min-h-screen bg-white pb-20">
      <SEO 
        title="Movement Supplies"
        description="Wear the colors. Fund the cause. 100% of proceeds support youth jobs programs."
        canonical="/store"
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-8">
        <div className="text-[11px] font-bold font-meta text-on-surface-muted uppercase tracking-[0.04em] mb-4 flex items-center gap-1">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="opacity-40">·</span>
          <span className="text-on-surface">Supplies</span>
          <span className="opacity-40">·</span>
          <span className="text-on-surface/40">All products</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Storefront */}
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-stone-900 text-3xl md:text-[32px] font-meta font-extrabold tracking-tighter mb-2">
                  Movement supplies
                </h1>
                <p className="text-on-surface-muted text-sm md:text-[14px] m-0 font-medium">
                  Wear the colors. Fund the cause. 100% of proceeds support youth jobs programs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-[14px] py-[6px] rounded-full border font-meta font-bold text-[11px] cursor-pointer transition-all",
                    activeCategory === cat
                      ? 'bg-on-surface text-white border-on-surface'
                      : 'bg-white text-on-surface border-border hover:border-primary hover:text-primary'
                  )}
                >
                  {cat === 'All' ? `All · ${filteredProducts.length}` : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] mb-12">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-stone-100 animate-pulse rounded-[6px]" />
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onShare={handleShare} />
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white border border-stone-200 rounded-[6px]">
                  <ShoppingBag className="w-16 h-16 text-stone-100 mx-auto mb-4" />
                  <h3 className="text-stone-400 font-bold tracking-tight">No products found.</h3>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 pt-8 border-t border-stone-100">
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
          </section>

          {/* Sidebar Cart */}
          <aside className="relative">
            <div className="lg:sticky lg:top-8 bg-white border border-border rounded-[6px] overflow-hidden flex flex-col">
              <h3 className="font-meta font-extrabold text-[16px] px-[18px] py-[18px] border-b border-border flex items-center justify-between m-0">
                Your cart 
                <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cartCount}
                </span>
              </h3>
              
              <div className="items px-[18px] max-h-[320px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                    <p className="text-micro font-bold text-stone-400 m-0">Your bag is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="ci flex gap-3 py-3 border-b border-border last:border-0">
                      <div className="thumb w-[54px] h-[54px] bg-stone-100 rounded-[4px] shrink-0 flex items-center justify-center font-meta font-extrabold text-2xl text-stone-200 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          item.name.charAt(0)
                        )}
                      </div>
                      <div className="body flex-1 min-w-0">
                        <b className="font-meta text-[12px] font-extrabold block truncate">{item.name}</b>
                        <span className="text-[10.5px] text-on-surface-muted font-bold font-meta tracking-[0.04em] uppercase block">
                          {item.selectedSize || 'One Size'} · {item.selectedColor || 'Stock'}
                        </span>
                        <div className="qty inline-flex items-center gap-0 border border-border rounded-[3px] mt-1.5 h-[22px]">
                          <button 
                            className="w-[22px] h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                            onClick={() => updateQuantity(item.id, item.selectedSize || '', item.selectedColor || '', item.quantity - 1)}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 font-meta font-extrabold text-[11px]">{item.quantity}</span>
                          <button 
                            className="w-[22px] h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                            onClick={() => updateQuantity(item.id, item.selectedSize || '', item.selectedColor || '', item.quantity + 1)}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-meta font-extrabold text-[13px] mb-1">
                          ₵{(parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(0)}
                        </div>
                        <button 
                          className="text-destructive hover:text-red-700 p-1"
                          onClick={() => removeFromCart(item.id, item.selectedSize || '', item.selectedColor || '')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="summary p-[18px] bg-stone-50/80 border-t border-border font-meta">
                <div className="flex justify-between py-1 text-[12px] font-bold text-on-surface-muted">
                  Subtotal <b className="text-on-surface font-extrabold">₵{subtotal.toFixed(0)}</b>
                </div>
                <div className="flex justify-between py-1 text-[12px] font-bold text-on-surface-muted">
                  Shipping <b className="text-on-surface font-extrabold">₵{shipping}</b>
                </div>
                <div className="flex justify-between py-1 text-[12px] font-bold text-on-surface-muted">
                  Member discount <b className="text-primary font-extrabold">−₵{discount}</b>
                </div>
                <div className="total flex justify-between pt-2.5 mt-1.5 border-t border-border">
                  <b className="text-lg font-extrabold tracking-tight">Total</b>
                  <span className="text-lg font-extrabold tracking-tight">₵{total.toFixed(0)}</span>
                </div>
              </div>

              <div className="p-[18px] pt-3.5 pb-4">
                <Button asChild variant="accent" size="lg" className="w-full h-14 font-extrabold">
                  <Link to="/store/checkout">Checkout securely →</Link>
                </Button>
                <div className="flex gap-1.5 justify-center mt-3 opacity-40">
                  {['MoMo', 'Visa', 'Mastercard', 'PayPal'].map(m => (
                    <span key={m} className="text-[9px] font-extrabold font-meta uppercase border border-border px-1.5 py-0.5 rounded-[2px]">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Order Stepper */}
        <section className="mt-20 pt-12 border-t-2 border-on-surface">
          <h2 className="font-meta font-extrabold text-[20px] mb-6 m-0">Checkout · Order flow</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
            {[
              { num: '01', title: 'Cart review', text: 'Confirm items and quantities. Apply member discount.', color: 'var(--brand-red)' },
              { num: '02', title: 'Shipping address', text: 'Region · constituency · landmark · phone for delivery rider.', color: 'var(--brand-gold)' },
              { num: '03', title: 'Payment', text: 'MTN MoMo · Vodafone Cash · card · PayPal for diaspora.', color: 'var(--charcoal)' },
              { num: '04', title: 'Order summary', text: 'Receipt emailed. Track from your member dashboard.', color: 'var(--brand-green)' },
            ].map((step) => (
              <div key={step.num} className="p-[18px] border border-border rounded-[6px] transition-all hover:border-on-surface/20" style={{ borderLeft: `3px solid ${step.color}` }}>
                <div className="font-meta font-extrabold text-[32px] tracking-tight leading-none" style={{ color: step.color }}>
                  {step.num}
                </div>
                <b className="font-meta font-extrabold text-[13px] block mt-2.5">{step.title}</b>
                <p className="text-[11.5px] text-on-surface-muted font-medium mt-1 leading-relaxed m-0">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={shareData.title}
        url={shareData.url}
      />
    </div>
  )
}
