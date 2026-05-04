import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Star, Plus, Minus, ShieldCheck, Truck, RefreshCw, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareModal } from '@/components/ShareModal'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function ProductDetails() {
  const { slug } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [customizationText, setCustomizationText] = useState('')
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const { isInWishlist, addToWishlist, removeFromWishlist, addToCart, wishlist, cart } = useStore()
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('Greater Accra')
  const wishlistCount = wishlist.length
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => {
    let isMounted = true
    const fetchProduct = async () => {
      if (!slug) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const data = await adminService.getProductBySlug(slug)
        if (isMounted) {
          setProduct(data)
          if (data) {
            if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0])
            if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0])
            if (data.image) setActiveImage(data.image)
            else if (data.gallery_images && data.gallery_images.length > 0) setActiveImage(data.gallery_images[0].url)
          }
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProduct()
    return () => { isMounted = false }
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return
    
    addToCart({
      ...product,
      quantity,
      selectedSize,
      selectedColor,
      image: product.image || undefined,
      customText: customizationText || undefined
    })
    
    toast.success(`${product.name} added to your bag`)
  }

  const checkRegionalAvailability = async () => {
    if (!product) return
    setCheckingAvailability(true)
    try {
      // Import logisticsService dynamically to avoid circular dependencies if any
      const { logisticsService } = await import('@/services/logisticsService')
      const result = await logisticsService.getRegionalAvailability(product.id, selectedRegion)
      setAvailability(result)
    } catch (err) {
      console.error('Availability check failed:', err)
    } finally {
      setCheckingAvailability(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-off-white min-h-screen">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-32 bg-stone-200" />
            <div className="grid md:grid-cols-2 gap-12">
              <div className="aspect-square bg-stone-200 rounded-sm" />
              <div className="space-y-6">
                <div className="h-8 w-64 bg-stone-200" />
                <div className="h-4 w-48 bg-stone-200" />
                <div className="h-24 w-full bg-stone-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-off-white min-h-screen">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Product Not Found</h2>
          <Link to="/store" className="text-brand-green font-bold hover:underline">Back to Store</Link>
        </div>
      </div>
    )
  }

  const isComingSoon = product.status === 'Coming Soon'
  const isWishlisted = product ? isInWishlist(product.id) : false

  return (
    <div className="bg-off-white min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
      <Breadcrumbs />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <Link 
          to={window.location.pathname.includes('/dashboard') ? '/dashboard/store' : '/store'}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-meta text-[10px] font-bold uppercase tracking-widest">Back to Store</span>
        </Link>

        <div className="flex items-center gap-3">
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

      <div className="grid lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
            <div className="w-full h-full flex items-center justify-center relative group">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <ShoppingBag className="w-32 h-32 text-stone-300" />
              )}
              {isComingSoon && (
                <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-white font-black uppercase tracking-[0.3em] text-lg border-2 border-white/40 px-8 py-3">Coming Soon</span>
                </div>
              )}
            </div>
          </div>
          
          {product.gallery_images && product.gallery_images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {product.gallery_images.map((img) => (
                <button 
                  key={img.id} 
                  onClick={() => setActiveImage(img.url)}
                  className={cn(
                    "aspect-square bg-stone-100 border rounded-sm cursor-pointer transition-all overflow-hidden",
                    activeImage === img.url ? "border-brand-green ring-2 ring-brand-green/20" : "border-stone-200 hover:border-stone-400"
                  )}
                >
                  <img src={img.url} alt={img.alt_text || product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold tracking-widest uppercase rounded-full mb-4">
              {product.category}
            </span>
            <h1 className="font-h1 text-h2 text-stone-900 mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= (product.rating || 4.8) ? 'fill-warm-gold text-warm-gold' : 'text-stone-300'}`} />
                ))}
                <span className="ml-2 text-sm font-bold text-stone-900">{product.rating || '4.8'}</span>
              </div>
              <span className="text-stone-300">|</span>
              <span className="text-sm text-stone-500">{product.reviews || 0} Verified Reviews</span>
            </div>
            <p className="text-2xl font-bold text-brand-green">{product.price}</p>
          </div>

          <p className="text-stone-600 font-body-md leading-relaxed mb-10">
            {product.longDescription || product.description}
          </p>

          <div className="space-y-8 mb-10">
            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4">Color: {selectedColor}</p>
                <div className="flex gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-brand-green scale-110 shadow-md' : 'border-transparent shadow-sm'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() === 'black' || color.toLowerCase() === 'jet black' ? '#1a1a1a' : color.toLowerCase() === 'green' || color.toLowerCase() === 'movement green' ? '#006B3C' : '#f5f5f4' }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Select Size</p>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] font-bold text-brand-green uppercase tracking-widest hover:underline"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-12 flex items-center justify-center border text-xs font-bold transition-all rounded-sm ${
                        selectedSize === size
                          ? 'bg-brand-green border-brand-green text-white shadow-md'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-brand-green'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customization */}
            {product.customization_allowed && (
              <div className="p-6 bg-stone-50 border-l-4 border-brand-green space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Patriot Customization</p>
                  <span className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 uppercase">Free</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your constituency or name..."
                    value={customizationText}
                    onChange={(e) => setCustomizationText(e.target.value.substring(0, 24))}
                    className="w-full h-12 bg-white border border-stone-200 px-4 text-xs font-bold focus:border-brand-green outline-none transition-all rounded-sm placeholder:text-stone-300 placeholder:font-medium"
                  />
                  <span className="absolute right-3 bottom-[-18px] text-[8px] font-bold text-stone-400 uppercase">
                    {customizationText.length}/24 Characters
                  </span>
                </div>
              </div>
            )}

            {/* Regional Availability Check */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Regional Fulfillment</p>
                <div className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", availability ? (availability.available ? "bg-brand-green" : "bg-brand-red") : "bg-stone-300")} />
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Live Status</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setAvailability(null)
                  }}
                  className="flex-1 h-10 bg-white border border-stone-200 px-3 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-brand-green rounded-sm"
                >
                  {['Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Button 
                  onClick={checkRegionalAvailability}
                  disabled={checkingAvailability}
                  className="h-10 px-4 bg-stone-900 text-white text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-brand-green transition-all"
                >
                  {checkingAvailability ? 'Checking...' : 'Check'}
                </Button>
              </div>

              {availability && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "text-[10px] font-bold leading-relaxed",
                    availability.available ? "text-brand-green" : "text-brand-red"
                  )}
                >
                  {availability.message}
                </motion.p>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-end gap-8">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4">Quantity</p>
                <div className="flex items-center w-full h-12 border border-stone-200 bg-white rounded-sm overflow-hidden">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-stone-500" />
                  </button>
                  <span className="flex-1 text-center font-bold text-stone-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              </div>
              
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="flex-1 hidden md:block">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Quick Specs</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-[8px] font-black text-stone-400 uppercase">{key}</span>
                        <span className="text-[10px] font-bold text-stone-900 truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <Button 
              onClick={handleAddToCart}
              disabled={isComingSoon}
              className={`flex-1 h-14 text-xs font-bold uppercase tracking-widest rounded-sm shadow-lg ${
                isComingSoon 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                  : 'bg-[var(--brand-green)] hover:opacity-90 text-white shadow-brand-green/20'
              }`}
            >
              {isComingSoon ? 'Coming Soon' : (
                <div className="flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Add to Bag
                </div>
              )}
            </Button>
            <button 
              onClick={() => {
                if (product) {
                  if (isWishlisted) {
                    removeFromWishlist(product.id)
                  } else {
                    addToWishlist(product)
                  }
                }
              }}
              className={`w-14 h-14 border flex items-center justify-center transition-all rounded-sm ${isWishlisted ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-lg shadow-brand-red/10' : 'border-stone-200 text-stone-400 hover:border-brand-red hover:text-brand-red'}`}
            >
              <Heart className={`w-6 h-6 transition-all ${isWishlisted ? 'fill-brand-red text-brand-red' : ''}`} />
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-14 h-14 border border-stone-200 text-stone-400 hover:border-brand-green hover:text-brand-green transition-all rounded-sm flex items-center justify-center"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Delivery & Returns Info */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 py-8 border-t border-stone-200">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-5 h-5 text-brand-green" />
              <p className="text-sm font-bold text-stone-900 uppercase tracking-widest leading-tight">Fast Delivery</p>
              <p className="text-sm text-stone-500 font-medium leading-tight">2-3 Days</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 border-x border-stone-100 px-2">
              <ShieldCheck className="w-5 h-5 text-brand-green" />
              <p className="text-sm font-bold text-stone-900 uppercase tracking-widest leading-tight">Secure Pay</p>
              <p className="text-sm text-stone-500 font-medium leading-tight">Verified</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RefreshCw className="w-5 h-5 text-brand-green" />
              <p className="text-sm font-bold text-stone-900 uppercase tracking-widest leading-tight">Easy Returns</p>
              <p className="text-sm text-stone-500 font-medium leading-tight">7-Day Policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patriot Reviews Section */}
      <section className="mt-24 pt-24 border-t border-stone-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.3em] mb-4 block">Voice of the Movement</span>
            <h2 className="font-h2 text-h3 text-stone-900">Patriot Reviews</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-black text-stone-900">{product.rating || '4.8'}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Average Patriot Rating</p>
            </div>
            <div className="w-px h-12 bg-stone-200" />
            <Button className="h-12 bg-brand-green text-white text-[10px] font-black uppercase tracking-widest px-8 rounded-none">
              Write a Review
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {product.reviews_data && product.reviews_data.length > 0 ? (
            product.reviews_data.map((review) => (
              <div key={review.id} className="p-8 bg-white border border-stone-100 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-warm-gold text-warm-gold' : 'text-stone-200'}`} />
                    ))}
                  </div>
                  {review.is_verified && (
                    <span className="text-[8px] font-black text-brand-green uppercase tracking-widest bg-brand-green/5 px-2 py-1 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified Patriot
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-600 font-medium leading-relaxed italic">"{review.content}"</p>
                <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-stone-900 uppercase tracking-tight">{review.patriot_name}</span>
                  <span className="text-[9px] font-bold text-stone-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 bg-stone-50 text-center border border-dashed border-stone-200">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Be the first patriot to review this gear.</p>
            </div>
          )}
        </div>
      </section>

      {/* Specifications & Details */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className="mt-24 grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <h2 className="font-h2 text-h3 text-stone-900">Technical Details</h2>
            <div className="grid gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-4 border-b border-stone-100">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{key}</span>
                  <span className="text-xs font-bold text-stone-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--brand-black)] p-12 text-white relative overflow-hidden">
            <h3 className="font-h3 text-lg uppercase tracking-widest mb-6 relative z-10">Movement Quality Standard</h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-8 relative z-10">
              Every item in the movement catalog undergoes strict quality control. We ensure that all materials are ethically sourced and designed to withstand the rigors of field mobilization.
            </p>
            <ul className="space-y-4 relative z-10">
              <li className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Durable Field-Ready Fabric
              </li>
              <li className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Authentic Movement Branding
              </li>
              <li className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Supporting Local Production
              </li>
            </ul>
            <ShoppingBag className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
          </div>
        </section>
      )}

      {/* Recommended Products */}
      <section className="mt-24">
        <h2 className="font-h2 text-h3 text-stone-900 mb-12">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/5] bg-stone-100 rounded-sm animate-pulse" />
          ))}
        </div>
      </section>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowSizeGuide(false)}
          />
          <div className="relative bg-white w-full max-w-lg shadow-2xl rounded-none overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-brand-green p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-h3 text-lg uppercase tracking-widest">Apparel Size Guide</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-widest">All measurements in inches</p>
              </div>
              <button 
                onClick={() => setShowSizeGuide(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-100">
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Size</th>
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Chest</th>
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Length</th>
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {[
                      { size: 'S', chest: '36-38', length: '28', sleeve: '8.5' },
                      { size: 'M', chest: '38-40', length: '29', sleeve: '9' },
                      { size: 'L', chest: '42-44', length: '30', sleeve: '9.5' },
                      { size: 'XL', chest: '46-48', length: '31', sleeve: '10' },
                      { size: 'XXL', chest: '50-52', length: '32', sleeve: '10.5' }
                    ].map((row) => (
                      <tr key={row.size} className="hover:bg-stone-50 transition-colors">
                        <td className="py-4 font-bold text-stone-900 text-sm">{row.size}</td>
                        <td className="py-4 text-stone-600 text-sm text-center">{row.chest}</td>
                        <td className="py-4 text-stone-600 text-sm text-center">{row.length}</td>
                        <td className="py-4 text-stone-600 text-sm text-center">{row.sleeve}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-8 text-sm text-stone-400 leading-relaxed italic">
                * Please note that these are approximate measurements. For a more relaxed fit, we recommend ordering one size up.
              </p>
              <Button 
                onClick={() => setShowSizeGuide(false)}
                className="w-full mt-8 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none h-12"
              >
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {product && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          title={`Check out the ${product.name} at The Base Movement Store!`}
          url={window.location.href}
        />
      )}
      </div>
    </div>
  )
}
