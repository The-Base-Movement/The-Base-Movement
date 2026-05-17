import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/ProductCard'
import { ShareModal } from '@/components/ShareModal'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'

const categories = ['All', 'Apparel', 'Accessories', 'Books', 'Print']

export default function Store() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState({ title: '', url: '' })
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)

  const { cart, removeFromCart, updateCartQuantity } = useStore()
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
        if (isMounted) setProducts(data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProducts()
    return () => { isMounted = false }
  }, [])

  const filteredProducts = products.filter(p =>
    activeCategory === 'All' || p.category === activeCategory
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const CartItems = () => (
    <>
      {cart.length === 0 ? (
        <div className="py-12 text-center">
          <span className="material-symbols-outlined text-stone-200 block mx-auto mb-2" style={{ fontSize: 32 }}>shopping_bag</span>
          <p className="text-micro font-bold text-stone-400 m-0">Your bag is empty</p>
        </div>
      ) : (
        cart.map((item) => (
          <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3 py-3 border-b border-border last:border-0">
            <div className="w-[54px] h-[54px] bg-stone-100 rounded-[4px] shrink-0 flex items-center justify-center font-meta font-extrabold text-2xl text-stone-200 overflow-hidden">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                : item.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <b className="font-meta text-[12px] font-extrabold block truncate">{item.name}</b>
              <span className="text-[10.5px] text-on-surface-muted font-bold font-meta tracking-[0.04em] uppercase block">
                {item.selectedSize || 'One Size'} · {item.selectedColor || 'Stock'}
              </span>
              <div className="inline-flex items-center gap-0 border border-border rounded-[3px] mt-1.5 h-[22px]">
                <button
                  className="w-[22px] h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 10 }}>remove</span>
                </button>
                <span className="px-2 font-meta font-extrabold text-[11px]">{item.quantity}</span>
                <button
                  className="w-[22px] h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 10 }}>add</span>
                </button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-meta font-extrabold text-[13px] mb-1">
                ₵{(parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(0)}
              </div>
              <button
                className="text-destructive hover:text-red-700 p-1"
                onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete</span>
              </button>
            </div>
          </div>
        ))
      )}
    </>
  )

  const CartSummary = () => (
    <div className="font-meta">
      <div className="flex justify-between py-1 text-[12px] font-bold text-on-surface-muted">
        Subtotal <b className="text-on-surface font-extrabold">₵{subtotal.toFixed(0)}</b>
      </div>
      <div className="flex justify-between py-1 text-[12px] font-bold text-on-surface-muted">
        Shipping <b className="text-on-surface font-extrabold">₵{shipping}</b>
      </div>
      <div className="flex justify-between py-1 text-[12px] font-bold text-on-surface-muted">
        Member discount <b className="text-primary font-extrabold">−₵{discount}</b>
      </div>
      <div className="flex justify-between pt-2.5 mt-1.5 border-t border-border">
        <b className="text-lg font-extrabold tracking-tight">Total</b>
        <span className="text-lg font-extrabold tracking-tight">₵{total.toFixed(0)}</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: cartCount > 0 ? 64 : 0 }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Main Storefront */}
          <section>
            <div className="mb-6">
              <h1 className="text-stone-900 text-[26px] md:text-[32px] font-meta font-extrabold tracking-tighter mb-1">
                Movement supplies
              </h1>
              <p className="text-on-surface-muted text-sm m-0 font-medium">
                Wear the colors. Fund the cause. 100% of proceeds support youth jobs programs.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCurrentPage(1) }}
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

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-[18px] mb-12">
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
                  <span className="material-symbols-outlined text-stone-100 block mx-auto mb-4" style={{ fontSize: 64 }}>shopping_bag</span>
                  <h3 className="text-stone-400 font-bold tracking-tight">No products found.</h3>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 pt-8 border-t border-stone-100 flex items-center justify-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 border border-border rounded-sm text-xs font-bold cursor-pointer disabled:opacity-30 hover:border-primary hover:text-primary transition-colors bg-white"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-9 h-9 border rounded-sm text-xs font-bold cursor-pointer transition-colors",
                      currentPage === i + 1
                        ? "bg-on-surface text-white border-on-surface"
                        : "bg-white border-border hover:border-primary hover:text-primary"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 border border-border rounded-sm text-xs font-bold cursor-pointer disabled:opacity-30 hover:border-primary hover:text-primary transition-colors bg-white"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              </div>
            )}
          </section>

          {/* Sidebar Cart — desktop only */}
          <aside className="relative hidden lg:block">
            <div className="lg:sticky lg:top-8 bg-white border border-border rounded-[6px] overflow-hidden flex flex-col">
              <h3 className="font-meta font-extrabold text-[16px] px-[18px] py-[18px] border-b border-border flex items-center justify-between m-0">
                Your cart
                <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cartCount}
                </span>
              </h3>
              <div className="px-[18px] max-h-[320px] overflow-y-auto">
                <CartItems />
              </div>
              <div className="p-[18px] bg-stone-50/80 border-t border-border">
                <CartSummary />
              </div>
              <div className="p-[18px] pt-3.5 pb-4">
                <Link
                  to="/store/checkout"
                  className="w-full h-14 font-extrabold bg-accent text-white flex items-center justify-center text-sm tracking-tight rounded-sm hover:opacity-90 transition-opacity"
                >
                  Checkout securely →
                </Link>
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
        <section className="mt-16 pt-10 border-t-2 border-on-surface">
          <h2 className="font-meta font-extrabold text-[18px] md:text-[20px] mb-5 m-0">Checkout · Order flow</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-[14px]">
            {[
              { num: '01', title: 'Cart review', text: 'Confirm items and quantities. Apply member discount.', color: 'hsl(var(--brand-red))' },
              { num: '02', title: 'Shipping address', text: 'Region · constituency · landmark · phone for delivery rider.', color: 'hsl(var(--brand-gold))' },
              { num: '03', title: 'Payment', text: 'MTN MoMo · Vodafone Cash · card · PayPal for diaspora.', color: 'var(--charcoal)' },
              { num: '04', title: 'Order summary', text: 'Receipt emailed. Track from your member dashboard.', color: 'hsl(var(--brand-green))' },
            ].map((step) => (
              <div key={step.num} className="p-4 md:p-[18px] border border-border rounded-[6px]" style={{ borderLeft: `3px solid ${step.color}` }}>
                <div className="font-meta font-extrabold text-[24px] md:text-[32px] tracking-tight leading-none" style={{ color: step.color }}>
                  {step.num}
                </div>
                <b className="font-meta font-extrabold text-[12px] md:text-[13px] block mt-2">{step.title}</b>
                <p className="text-[10.5px] md:text-[11.5px] text-on-surface-muted font-medium mt-1 leading-relaxed m-0">
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

      {/* Mobile cart drawer + floating bar */}
      {cartCount > 0 && (
        <>
          {/* Backdrop */}
          {isCartDrawerOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsCartDrawerOpen(false)}
            />
          )}

          {/* Slide-up cart drawer */}
          <div
            className="lg:hidden fixed left-0 right-0 bottom-[56px] z-50 bg-white rounded-t-[14px] shadow-2xl transition-transform duration-300 ease-out"
            style={{ transform: isCartDrawerOpen ? 'translateY(0)' : 'translateY(100%)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-stone-200" />
            </div>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-meta font-extrabold text-[15px] m-0 flex items-center gap-2">
                Your cart
                <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{cartCount}</span>
              </h3>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            {/* Items */}
            <div className="px-4 max-h-[38vh] overflow-y-auto">
              <CartItems />
            </div>
            {/* Summary + checkout */}
            <div className="px-4 py-3 bg-stone-50/80 border-t border-border">
              <CartSummary />
            </div>
            <div className="px-4 pt-3 pb-5">
              <Link
                to="/store/checkout"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full h-12 font-extrabold bg-accent text-white flex items-center justify-center text-sm tracking-tight rounded-sm hover:opacity-90 transition-opacity"
              >
                Checkout securely →
              </Link>
              <div className="flex gap-1.5 justify-center mt-2.5 opacity-40">
                {['MoMo', 'Visa', 'Mastercard', 'PayPal'].map(m => (
                  <span key={m} className="text-[9px] font-extrabold font-meta uppercase border border-border px-1.5 py-0.5 rounded-[2px]">{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating bar — always visible, opens drawer on left tap */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center h-14"
            style={{ background: '#181d19', borderTop: '2px solid hsl(var(--accent))' }}
          >
            <button
              className="flex-1 flex items-center gap-2.5 px-4 h-full"
              onClick={() => setIsCartDrawerOpen(v => !v)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--accent))' }}>shopping_bag</span>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: '#fff' }}>
                {cartCount} item{cartCount !== 1 ? 's' : ''}
              </span>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                · ₵{total.toFixed(0)}
              </span>
              <span className="material-symbols-outlined ml-auto" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>
                {isCartDrawerOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
              </span>
            </button>
            <div className="w-px h-8 bg-white/10 shrink-0" />
            <Link
              to="/store/checkout"
              className="px-5 h-full flex items-center font-extrabold text-white text-sm shrink-0 hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, textDecoration: 'none' }}
            >
              Checkout →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
