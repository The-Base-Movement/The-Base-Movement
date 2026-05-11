import { Star, ShoppingBag, Plus, Minus, ShieldCheck, Truck, RefreshCw, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Product } from '@/types/product'

interface ProductInfoProps {
  product: Product
  isComingSoon: boolean
  isWishlisted: boolean
  handleAddToCart: () => void
  quantity: number
  setQuantity: (q: number) => void
  selectedSize: string
  setSelectedSize: (size: string) => void
  selectedColor: string
  setSelectedColor: (color: string) => void
  customizationText: string
  setCustomizationText: (text: string) => void
  setShowSizeGuide: (show: boolean) => void
  isInWishlist: (id: string) => boolean
  addToWishlist: (p: Product) => void
  removeFromWishlist: (id: string) => void
  setIsShareModalOpen: (show: boolean) => void
  selectedRegion: string
  setSelectedRegion: (region: string) => void
  availability: { available: boolean; message: string } | null
  setAvailability: (avail: { available: boolean; message: string } | null) => void
  checkingAvailability: boolean
  checkRegionalAvailability: () => void
}

export function ProductInfo({
  product,
  isComingSoon,
  isWishlisted,
  handleAddToCart,
  quantity,
  setQuantity,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  customizationText,
  setCustomizationText,
  setShowSizeGuide,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  setIsShareModalOpen,
  selectedRegion,
  setSelectedRegion,
  availability,
  setAvailability,
  checkingAvailability,
  checkRegionalAvailability
}: ProductInfoProps) {
  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-micro font-bold tracking-tight rounded-full mb-4">
          {product.category}
        </span>
        <h1 className="font-meta text-3xl md:text-4xl font-bold tracking-tighter text-stone-900 mb-4">{product.name}</h1>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= (product.rating || 4.8) ? 'fill-warm-gold text-warm-gold' : 'text-stone-300'}`} />
            ))}
            <span className="ml-2 text-sm font-bold text-stone-900">{product.rating || '4.8'}</span>
          </div>
          <span className="text-stone-300">|</span>
          <span className="text-sm text-stone-500">{product.reviews || 0} Verified reviews</span>
        </div>
        <p className="text-2xl font-bold text-brand-green">GH₵{product.price.toString().replace('GHS', '').replace('GH₵', '').trim()}</p>
      </div>

      <p className="text-stone-600 font-body-md leading-relaxed mb-10">
        {product.longDescription || product.description}
      </p>

      <div className="space-y-8 mb-10">
        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <div>
            <p className="text-micro font-bold text-stone-900 tracking-tight mb-4">Color: {selectedColor}</p>
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
              <p className="text-micro font-bold text-stone-900 tracking-tight">Select size</p>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="text-micro font-bold text-brand-green tracking-tight hover:underline"
              >
                Size guide
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
              <p className="text-micro font-bold text-stone-900 tracking-tight">Patriot customization</p>
              <span className="text-micro font-bold text-brand-green bg-brand-green/10 px-2 py-0.5">Free</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your constituency or name..."
                value={customizationText}
                onChange={(e) => setCustomizationText(e.target.value.substring(0, 24))}
                className="w-full h-12 bg-white border border-stone-200 px-4 text-xs font-bold focus:border-brand-green outline-none transition-all rounded-sm placeholder:text-stone-300 placeholder:font-medium"
              />
              <span className="absolute right-3 bottom-[-18px] text-[8px] font-bold text-stone-400">
                {customizationText.length}/24 characters
              </span>
            </div>
          </div>
        )}

        {/* Regional Availability Check */}
        <div className="p-6 bg-stone-50 border border-stone-200 rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-micro font-bold text-stone-900 tracking-tight">Regional fulfillment</p>
            <div className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", availability ? (availability.available ? "bg-brand-green" : "bg-brand-red") : "bg-stone-300")} />
              <span className="text-micro font-bold text-stone-500">Live status</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select 
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value)
                setAvailability(null)
              }}
              className="flex-1 h-10 bg-white border border-stone-200 px-3 text-micro font-bold tracking-tight outline-none focus:border-brand-green rounded-sm"
            >
              {['Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Button 
              onClick={checkRegionalAvailability}
              disabled={checkingAvailability}
              variant="primary"
              className="h-10 px-4 !text-white text-micro font-bold tracking-tight rounded-sm transition-all"
            >
              {checkingAvailability ? 'Checking...' : 'Check'}
            </Button>
          </div>

          {availability && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-micro font-bold leading-relaxed",
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
            <p className="text-micro font-bold text-stone-900 tracking-tight mb-4">Quantity</p>
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
              <p className="text-micro font-bold text-stone-400 tracking-tight mb-4">Quick specs</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[8px] font-bold text-stone-400">{key}</span>
                    <span className="text-micro font-bold text-stone-900 truncate">{value}</span>
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
          variant={isComingSoon ? "outline" : "primary"}
          className={cn(
            "flex-1 h-14 text-xs font-bold tracking-tight rounded-sm",
            isComingSoon ? "bg-stone-100 text-stone-400 border-stone-200" : "shadow-lg shadow-brand-green/20 !text-white"
          )}
        >
          {isComingSoon ? 'Coming soon' : (
            <div className="flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Add to bag
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
          <p className="text-sm font-bold text-stone-900 tracking-tight leading-tight">Fast delivery</p>
          <p className="text-sm text-stone-500 font-medium leading-tight">2-3 Days</p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 border-x border-stone-100 px-2">
          <ShieldCheck className="w-5 h-5 text-brand-green" />
          <p className="text-sm font-bold text-stone-900 tracking-tight leading-tight">Secure pay</p>
          <p className="text-sm text-stone-500 font-medium leading-tight">Verified</p>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <RefreshCw className="w-5 h-5 text-brand-green" />
          <p className="text-sm font-bold text-stone-900 tracking-tight leading-tight">Easy returns</p>
          <p className="text-sm text-stone-500 font-medium leading-tight">7-Day Policy</p>
        </div>
      </div>
    </div>
  )
}
