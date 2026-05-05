import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { ShoppingBag, ArrowRight, Star, Heart, Share2, Plus } from 'lucide-react'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface ProductProps {
  product: Product;
  onShare?: (product: Product) => void;
}

export function ProductCard({ product, onShare }: ProductProps) {
  const isComingSoon = product.status === 'Coming Soon'
  const { isInWishlist, addToWishlist, removeFromWishlist, addToCart } = useStore()
  const isWishlisted = isInWishlist(product.id)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isComingSoon) return

    addToCart({
      ...product,
      quantity: 1,
      selectedSize: product.sizes?.[0] || '',
      selectedColor: product.colors?.[0] || '',
      image: product.image || undefined
    })
    
    toast.success(`${product.name} added to your bag`, {
      description: "Default options selected. Change in bag if needed.",
      action: {
        label: "View Bag",
        onClick: () => window.location.href = window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="group border border-stone-200 bg-white hover:shadow-2xl transition-all duration-500 rounded-sm overflow-hidden flex flex-col h-full relative">
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          <Link to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`}>
            {product.image ? (
              <img src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               decoding="async" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-stone-300 group-hover:scale-110 transition-transform duration-500" />
              </div>
            )}
          </Link>
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {isComingSoon && (
              <span className="bg-stone-800 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-lg">
                Coming Soon
              </span>
            )}
            {product.category && (
              <span className="bg-white text-stone-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm border border-stone-100">
                {product.category}
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (isWishlisted) {
                  removeFromWishlist(product.id)
                } else {
                  addToWishlist(product)
                }
              }}
              className={`w-10 h-10 bg-white shadow-md flex items-center justify-center transition-all duration-300 group/heart ${isWishlisted ? 'text-[var(--brand-red)]' : 'text-stone-400 hover:text-[var(--brand-red)]'}`}
            >
              <Heart className={`w-5 h-5 transition-all ${isWishlisted ? 'fill-brand-red text-[var(--brand-red)]' : 'group-hover/heart:fill-brand-red group-hover/heart:text-[var(--brand-red)]'}`} />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare?.(product);
              }}
              className="w-10 h-10 bg-white shadow-md flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-all duration-300"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Add Bottom Bar */}
          {!isComingSoon && (
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent z-10">
              <Button 
                onClick={handleQuickAdd}
                className="w-full h-10 bg-white text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--brand-green)] hover:text-white transition-all rounded-none border-none shadow-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-2" /> Quick Add
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <Link to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`}>
              <h5 className="text-stone-900 group-hover:text-[var(--brand-green)] transition-colors line-clamp-1 lowercase first-letter:uppercase mb-0 font-bold">
                {product.name}
              </h5>
            </Link>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-warm-gold text-warm-gold" />
              <span className="text-[10px] font-bold text-stone-500">{product.rating || '4.8'}</span>
            </div>
          </div>
          
          <p className="text-muted-gray mb-4 line-clamp-2 text-xs leading-relaxed font-medium">
            {product.description}
          </p>
          
          <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-lg font-black text-[var(--brand-green)]">
              {product.price}
            </span>
            
            <Link 
              to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`}
              className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-green)] flex items-center gap-2 transition-all group/link"
            >
              View Gear
              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
