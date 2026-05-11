import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingBag, Heart, ShoppingBag as ShoppingBagIcon } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareModal } from '@/components/ShareModal'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { logisticsService } from '@/services/logisticsService'
import SEO from '@/components/SEO'

// Modular Components
import { ImageGallery } from './product-details/components/ImageGallery'
import { ProductInfo } from './product-details/components/ProductInfo'
import { Reviews } from './product-details/components/Reviews'
import { RelatedProducts } from './product-details/components/RelatedProducts'

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
        <SEO 
          title="Product Not Found"
          noindex
        />
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Product not found</h2>
          <Link to="/store" className="text-brand-green font-bold hover:underline">Back to store</Link>
        </div>
      </div>
    )
  }

  const isComingSoon = product.status === 'Coming Soon'
  const isWishlisted = product ? isInWishlist(product.id) : false

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "The Base Movement"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://thebasemovement.com/store/product/${product.slug}`,
      "priceCurrency": "GHS",
      "price": product.price.replace(/[^0-9.]/g, ''),
      "availability": product.status === 'In Stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  }

  return (
    <div className="bg-off-white min-h-screen">
      <SEO 
        title={product.name}
        description={product.description}
        ogImage={product.image || undefined}
        canonical={`/store/product/${product.slug}`}
        jsonLd={productSchema}
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <Breadcrumbs />
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-12 mt-4">
          <div className="flex items-center gap-3">
            <Link 
              to={(typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) ? '/dashboard/store/wishlist' : '/store/wishlist'}
              className="relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-red transition-all rounded-sm bg-white shadow-sm"
            >
              <Heart className="w-4 h-4 text-stone-500 group-hover:text-brand-red transition-all" />
              <span className="font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-red">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link 
              to={(typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) ? '/dashboard/store/cart' : '/store/cart'}
              className="relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm"
            >
              <ShoppingBagIcon className="w-4 h-4 text-stone-500 group-hover:text-brand-green transition-all" />
              <span className="font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-green">Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-green text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <ImageGallery 
            product={product}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
            isComingSoon={isComingSoon}
          />

          {/* Product Info */}
          <ProductInfo 
            product={product}
            isComingSoon={isComingSoon}
            isWishlisted={isWishlisted}
            handleAddToCart={handleAddToCart}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            customizationText={customizationText}
            setCustomizationText={setCustomizationText}
            setShowSizeGuide={setShowSizeGuide}
            isInWishlist={isInWishlist}
            addToWishlist={addToWishlist}
            removeFromWishlist={removeFromWishlist}
            setIsShareModalOpen={setIsShareModalOpen}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            availability={availability}
            setAvailability={setAvailability}
            checkingAvailability={checkingAvailability}
            checkRegionalAvailability={checkRegionalAvailability}
          />
        </div>

        {/* Patriot Reviews Section */}
        <Reviews product={product} />

        {/* Specifications & Details */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <section className="mt-24 grid md:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <h2 className="font-h2 text-h3 text-stone-900">Technical details</h2>
              <div className="grid gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-4 border-b border-stone-100">
                    <span className="text-micro font-bold text-stone-400 tracking-tight">{key}</span>
                    <span className="text-xs font-bold text-stone-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--brand-black)] p-12 text-white relative overflow-hidden">
              <h3 className="font-h3 text-lg tracking-tight mb-6 relative z-10">Movement quality standard</h3>
              <p className="text-xs text-stone-400 leading-relaxed mb-8 relative z-10">
                Every item in the movement catalog undergoes strict quality control. We ensure that all materials are ethically sourced and designed to withstand the rigors of field mobilization.
              </p>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-center gap-3 text-micro font-bold tracking-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Durable field-ready fabric
                </li>
                <li className="flex items-center gap-3 text-micro font-bold tracking-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Authentic movement branding
                </li>
                <li className="flex items-center gap-3 text-micro font-bold tracking-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Supporting local production
                </li>
              </ul>
              <ShoppingBagIcon className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
            </div>
          </section>
        )}

        {/* Recommended Products */}
        <RelatedProducts />

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
                  <h3 className="font-h3 text-lg tracking-tight">Apparel size guide</h3>
                  <p className="text-micro opacity-80 tracking-tight">All measurements in inches</p>
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
                        <th className="py-4 text-micro font-bold text-stone-400 tracking-tight">Size</th>
                        <th className="py-4 text-micro font-bold text-stone-400 tracking-tight text-center">Chest</th>
                        <th className="py-4 text-micro font-bold text-stone-400 tracking-tight text-center">Length</th>
                        <th className="py-4 text-micro font-bold text-stone-400 tracking-tight text-center">Sleeve</th>
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
                  className="w-full mt-8 bg-stone-900 hover:bg-stone-800 text-white text-micro font-bold tracking-tight rounded-none h-12"
                >
                  Close guide
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
            url={typeof window !== 'undefined' ? window.location.href : ''}
          />
        )}
      </div>
    </div>
  )
}
