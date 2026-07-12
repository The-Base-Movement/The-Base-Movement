/**
 * ProductCard Component
 * -------------------------------------------------------------
 * Renders a product tile for the movement merchandise store.
 *
 * Features:
 * - Animated Framer Motion entrance (`whileInView`, `once: true`)
 * - Hover image zoom and border highlight
 * - Overlaid status badges (Coming Soon / Limited Edition / Bestseller)
 * - Slide-in hover panel with wishlist, share, and Quick Add buttons
 * - Quick Add: adds the product to the cart via `useStore()` with default
 *   size/color; shows a Sonner toast with a "View Bag" action
 * - Wishlist toggle via `isInWishlist` / `addToWishlist` / `removeFromWishlist`
 * - Star rating row (static 4.8 fallback)
 * - Price strip with optional strikethrough compare-at price
 * - URL adapts for `/store/` vs `/dashboard/store/` context
 */

import { Link } from 'react-router-dom'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface ProductProps {
  product: Product
  onShare?: (product: Product) => void
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
      image: product.image || undefined,
    })

    toast.success(`${product.name} added to your bag`, {
      description: 'Default options selected. Change in bag if needed.',
      action: {
        label: 'View Bag',
        onClick: () =>
          (window.location.href = window.location.pathname.includes('/dashboard')
            ? '/dashboard/store/cart'
            : '/store/cart'),
      },
    })
  }

  const productUrl = window.location.pathname.includes('/dashboard')
    ? `/dashboard/store/product/${product.slug}`
    : `/store/product/${product.slug}`

  return (
    <motion.article
      aria-labelledby={`product-name-${product.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <div className="group border border-border bg-white hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-8px_rgba(0,107,63,0.15)] transition-all duration-200 rounded-[6px] overflow-hidden flex flex-col h-full relative">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          <Link to={productUrl}>
            <img
              src={product.image || '/branding/product-placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              decoding="async"
              loading="lazy"
            />
          </Link>

          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isComingSoon && (
              <span className="bg-[#181d19] text-white text-[9px] font-medium font-meta tracking-[0.05em] uppercase px-[10px] py-1 rounded-[2px]">
                Coming soon
              </span>
            )}
            {!isComingSoon && product.category === 'Limited Edition' && (
              <span className="bg-accent text-white text-[9px] font-medium font-meta tracking-[0.05em] uppercase px-[10px] py-1 rounded-[2px]">
                Limited
              </span>
            )}
            {!isComingSoon &&
              product.category !== 'Limited Edition' &&
              product.stock_quantity &&
              product.stock_quantity > 0 && (
                <span className="bg-destructive text-white text-[9px] font-medium font-meta tracking-[0.05em] uppercase px-[10px] py-1 rounded-[2px]">
                  Bestseller
                </span>
              )}
          </div>

          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            <button
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                if (isWishlisted) {
                  removeFromWishlist(product.id)
                } else {
                  addToWishlist(product)
                }
              }}
              className={`w-10 h-10 bg-white shadow-md flex items-center justify-center transition-all duration-300 border-none cursor-pointer ${isWishlisted ? 'text-[var(--brand-red)]' : 'text-stone-400 hover:text-[var(--brand-red)]'}`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                favorite
              </span>
            </button>
            <button
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                onShare?.(product)
              }}
              className="w-10 h-10 bg-white shadow-md flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-all duration-300 border-none cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                share
              </span>
            </button>
          </div>

          {!isComingSoon && (
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent z-10">
              <button onClick={handleQuickAdd} className="btn btn-primary w-full">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  add
                </span>{' '}
                Quick Add
              </button>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 gap-[6px]">
          <span className="text-[10px] font-medium text-primary font-meta uppercase tracking-[0.06em]">
            {product.category || 'General'}
          </span>

          <Link to={productUrl} className="group/title flex items-start justify-between gap-3">
            <h5
              id={`product-name-${product.id}`}
              className="font-meta text-[15px] font-medium tracking-[-0.005em] leading-[1.3] text-on-surface group-hover/title:text-primary transition-colors line-clamp-2 mb-0"
            >
              {product.name}
            </h5>
            <span
              className="material-symbols-outlined text-primary shrink-0 mt-0.5 opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-300"
              style={{ fontSize: 16 }}
            >
              arrow_forward
            </span>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-muted">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="material-symbols-outlined text-accent"
                  style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
            <span className="font-medium">{product.rating || '4.8'}</span>
          </div>

          <div className="mt-auto pt-[10px] border-t border-border flex items-center justify-between gap-3">
            <div className="font-meta font-semibold text-[20px] tracking-[-0.015em] text-on-surface">
              ₵
              {product.price
                .toString()
                .replace('GHS', '')
                .replace('GH₵', '')
                .replace('₵', '')
                .trim()}
              {product.compare_at_price && (
                <small className="text-[12px] text-on-surface-muted line-through font-medium ml-1.5">
                  ₵{product.compare_at_price}
                </small>
              )}
            </div>
            <button onClick={handleQuickAdd} className="btn btn-primary btn-sm shrink-0">
              Add
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
