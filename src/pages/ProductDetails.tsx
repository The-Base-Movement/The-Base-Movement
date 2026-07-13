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
import { Skeleton } from '@/components/states'
import { SizeGuideModal } from './product-details/components/SizeGuideModal'
import { Breadcrumbs } from '@/components/Breadcrumbs'

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
        <div className="page-container py-12">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Skeleton variant="text-sm" width={120} />
            <div className="grid md:grid-cols-2 gap-12">
              <Skeleton
                variant="img"
                style={{ aspectRatio: '1/1', height: 'auto', borderRadius: 'var(--radius-sm)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Skeleton variant="text-xl" width="70%" />
                <Skeleton variant="text-md" width="50%" />
                <Skeleton variant="text-md" />
                <Skeleton variant="text-md" />
                <Skeleton variant="text-md" width="80%" />
                <Skeleton variant="btn" style={{ marginTop: 8 }} />
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
        <div className="page-container py-12 text-center">
          <h2 className="text-2xl font-medium mb-4" style={{ color: 'hsl(var(--on-surface))' }}>
            Product not found
          </h2>
          <Link to="/store" className="text-brand-green font-medium hover:underline">
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
      url: `https://www.thebasemovement.org.gh/store/product/${product.slug}`,
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
      <div className="page-container py-12">
        <Breadcrumbs currentLabel={product.name} />
        <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
          <Link
            to={storeUrl}
            className="flex items-center gap-2 hover:text-[var(--brand-green)] transition-colors text-xs font-medium font-meta shrink-0"
            style={{ color: 'hsl(var(--on-surface-muted))' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            Back to Store
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to={isDashboard ? '/dashboard/store/wishlist' : '/store/wishlist'}
              className="relative group flex items-center gap-2 px-3 py-2 border border-border hover:border-brand-red transition-all rounded-sm bg-white shadow-sm"
            >
              <span
                className="material-symbols-outlined group-hover:text-brand-red transition-all"
                style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 16 }}
              >
                favorite
              </span>
              <span
                className="font-meta text-micro font-medium tracking-tight group-hover:text-brand-red hidden sm:inline"
                style={{ color: 'hsl(var(--on-surface-muted))' }}
              >
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-micro font-medium w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to={isDashboard ? '/dashboard/store/cart' : '/store/cart'}
              className="relative group flex items-center gap-2 px-3 py-2 border border-border hover:border-brand-green transition-all rounded-sm bg-white shadow-sm"
            >
              <span
                className="material-symbols-outlined group-hover:text-brand-green transition-all"
                style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 16 }}
              >
                shopping_bag
              </span>
              <span
                className="font-meta text-micro font-medium tracking-tight group-hover:text-brand-green hidden sm:inline"
                style={{ color: 'hsl(var(--on-surface-muted))' }}
              >
                Bag
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-green text-white text-micro font-medium w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
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

        {/* Compatriot Reviews Section */}
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
