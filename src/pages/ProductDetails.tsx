import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
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
import { TechnicalDetails } from './product-details/components/TechnicalDetails'
import { SizeGuideModal } from './product-details/components/SizeGuideModal'

export default function ProductDetails() {
  const { slug } = useParams()
  const location = useLocation()
  const isDashboard = location.pathname.includes('/dashboard')
  const storeUrl = isDashboard ? '/dashboard/store' : '/store'
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
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(
    null
  )
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
            else if (data.gallery_images && data.gallery_images.length > 0)
              setActiveImage(data.gallery_images[0].url)
          }
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProduct()
    return () => {
      isMounted = false
    }
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      ...product,
      quantity,
      selectedSize,
      selectedColor,
      image: product.image || undefined,
      customText: customizationText || undefined,
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
        <SEO title="Product Not Found" noindex />
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Product not found</h2>
          <Link to="/store" className="text-brand-green font-bold hover:underline">
            Back to store
          </Link>
        </div>
      </div>
    )
  }

  const isComingSoon = product.status === 'Coming Soon'
  const isWishlisted = product ? isInWishlist(product.id) : false

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'The Base Movement',
    },
    offers: {
      '@type': 'Offer',
      url: `https://thebasemovement.com/store/product/${product.slug}`,
      priceCurrency: 'GHS',
      price: product.price.replace(/[^0-9.]/g, ''),
      availability:
        product.status === 'In Stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
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
        <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
          <Link
            to={storeUrl}
            className="flex items-center gap-2 text-stone-500 hover:text-[var(--brand-green)] transition-colors text-xs font-bold font-meta shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            Back to Store
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to={isDashboard ? '/dashboard/store/wishlist' : '/store/wishlist'}
              className="relative group flex items-center gap-2 px-3 py-2 border border-stone-200 hover:border-brand-red transition-all rounded-sm bg-white shadow-sm"
            >
              <span
                className="material-symbols-outlined text-stone-500 group-hover:text-brand-red transition-all"
                style={{ fontSize: 16 }}
              >
                favorite
              </span>
              <span className="font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-red hidden sm:inline">
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to={isDashboard ? '/dashboard/store/cart' : '/store/cart'}
              className="relative group flex items-center gap-2 px-3 py-2 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm"
            >
              <span
                className="material-symbols-outlined text-stone-500 group-hover:text-brand-green transition-all"
                style={{ fontSize: 16 }}
              >
                shopping_bag
              </span>
              <span className="font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-green hidden sm:inline">
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

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
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
          <TechnicalDetails specifications={product.specifications} />
        )}

        {/* Recommended Products */}
        <RelatedProducts />

        {/* Size Guide Modal */}
        {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}

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
