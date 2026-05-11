import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

interface ImageGalleryProps {
  product: Product
  activeImage: string | null
  setActiveImage: (url: string) => void
  isComingSoon: boolean
}

export function ImageGallery({ product, activeImage, setActiveImage, isComingSoon }: ImageGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="aspect-square bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
        <div className="w-full h-full flex items-center justify-center relative group">
          {activeImage ? (
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"  decoding="async" loading="lazy" />
          ) : (
            <ShoppingBag className="w-32 h-32 text-stone-300" />
          )}
          {isComingSoon && (
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-bold tracking-tight text-lg border-2 border-white/40 px-8 py-3">Coming soon</span>
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
              <img src={img.url} alt={img.alt_text || product.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
