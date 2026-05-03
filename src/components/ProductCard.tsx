import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { ShoppingBag, ArrowRight, Star, Heart, Share2 } from 'lucide-react'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'

interface ProductProps {
  product: Product;
  onShare?: (product: Product) => void;
}

export function ProductCard({ product, onShare }: ProductProps) {
  const isComingSoon = product.status === 'Coming Soon'
  const { isInWishlist, addToWishlist, removeFromWishlist } = useStore()
  const isWishlisted = isInWishlist(product.id)

  return (
    <Card className="group border border-stone-200 bg-white hover:shadow-xl transition-all duration-500 rounded-sm overflow-hidden flex flex-col h-full">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-stone-300 group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isComingSoon && (
            <span className="bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-lg">
              Coming Soon
            </span>
          )}
          {product.category && (
            <span className="bg-white text-stone-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm border border-stone-100">
              {product.category}
            </span>
          )}
        </div>

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (isWishlisted) {
                removeFromWishlist(product.id)
              } else {
                addToWishlist(product)
              }
            }}
            className={`w-10 h-10 bg-white shadow-md flex items-center justify-center transition-all duration-300 group/heart scale-90 hover:scale-100 ${isWishlisted ? 'text-[var(--brand-red)]' : 'text-stone-400 hover:text-[var(--brand-red)]'}`}
          >
            <Heart className={`w-5 h-5 transition-all ${isWishlisted ? 'fill-brand-red text-[var(--brand-red)]' : 'group-hover/heart:fill-brand-red group-hover/heart:text-[var(--brand-red)]'}`} />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare?.(product);
            }}
            className="w-10 h-10 bg-white shadow-md flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-all duration-300 scale-90 hover:scale-100"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform">
          <Link 
            to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`}
            className="bg-white text-stone-900 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[var(--brand-green)] hover:text-white transition-colors"
          >
            Quick View
          </Link>
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h5 className="text-stone-900 group-hover:text-[var(--brand-green)] transition-colors line-clamp-1 lowercase first-letter:uppercase mb-0">
            {product.name}
          </h5>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-warm-gold text-warm-gold" />
            <span className="text-[10px] font-bold text-stone-500">{product.rating || '4.8'}</span>
          </div>
        </div>
        
        <p className="text-muted-gray mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
          <span className="text-lg font-bold text-[var(--brand-green)]">
            {product.price}
          </span>
          
          <Button
            asChild
            variant={isComingSoon ? 'outline' : 'primary'}
            disabled={isComingSoon}
            className={`h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all ${
              isComingSoon 
                ? 'border-stone-200 text-stone-400' 
                : 'bg-[var(--brand-green)] hover:opacity-90 text-white shadow-md shadow-brand-green/20'
            }`}
          >
            {isComingSoon ? (
              <span>Notify Me</span>
            ) : (
              <Link to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'} className="flex items-center gap-2">
                Add to Cart
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
