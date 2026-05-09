import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
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
    <motion.article
      aria-labelledby={`product-name-${product.id}`}
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
              <span className="bg-stone-800 text-white text-tiny font-bold tracking-tight px-2.5 py-1 rounded-sm shadow-lg">
                Coming soon
              </span>
            )}
            {product.category && (
              <span className={`text-tiny font-bold tracking-tight px-3 py-1.5 rounded-sm shadow-lg border backdrop-blur-sm transition-all duration-300 ${
                product.category === 'Apparel' ? 'bg-brand-green/20 text-brand-green border-brand-green/30' :
                product.category === 'Accessories' ? 'bg-brand-gold/20 text-[#92400e] border-brand-gold/40' :
                product.category === 'Limited Edition' ? 'bg-brand-red/20 text-brand-red border-brand-red/30' :
                'bg-white/90 text-stone-800 border-stone-200'
              }`}>
                {product.category}
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            <Button 
              variant="ghost"
              size="icon"
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
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare?.(product);
              }}
              className="w-10 h-10 bg-white shadow-md flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-all duration-300"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Add Bottom Bar */}
          {!isComingSoon && (
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent z-10">
              <Button 
                onClick={handleQuickAdd}
                variant="primary"
                className="w-full h-10"
              >
                <Plus className="w-3.5 h-3.5 mr-2" /> Quick Add
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-warm-gold text-warm-gold" />
            <span className="text-tiny font-bold text-stone-500 tracking-tight uppercase">Rating {product.rating || '4.8'}</span>
          </div>

          <div className="mb-2">
            <Link to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`}>
              <h5 
                id={`product-name-${product.id}`}
                className="text-stone-900 group-hover:text-primary transition-colors line-clamp-2 mb-0 font-bold leading-tight text-sm uppercase tracking-tight"
              >
                {product.name}
              </h5>
            </Link>
          </div>
          
          <p className="text-muted-gray mb-4 line-clamp-2 text-tiny leading-relaxed font-medium">
            {product.description}
          </p>
          
          <div className="mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-tiny font-bold text-stone-400 uppercase tracking-tight">Investment</span>
              <span className="text-xl font-bold text-primary font-meta">
                GH₵{product.price.toString().replace('GHS', '').replace('GH₵', '').trim()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleQuickAdd}
                variant="primary" 
                className="h-10 text-tiny font-bold tracking-tight uppercase shadow-lg shadow-primary/10"
              >
                Buy now
              </Button>
              <Button asChild variant="ghost" className="h-10 text-tiny font-bold tracking-tight uppercase border-stone-200">
                <Link to={window.location.pathname.includes('/dashboard') ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`} className="flex items-center">
                  View Gear <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  )
}
