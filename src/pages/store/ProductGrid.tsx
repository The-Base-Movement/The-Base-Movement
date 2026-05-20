import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/types/product'

interface ProductGridProps {
  loading: boolean
  products: Product[]
  onShare: (product: Product) => void
}

export function ProductGrid({ loading, products, onShare }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-[18px] mb-12">
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-stone-100 animate-pulse rounded-[6px]" />
        ))
      ) : products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} onShare={onShare} />
        ))
      ) : (
        <div className="col-span-full py-24 text-center bg-white border border-stone-200 rounded-[6px]">
          <span
            className="material-symbols-outlined text-stone-100 block mx-auto mb-4"
            style={{ fontSize: 64 }}
          >
            shopping_bag
          </span>
          <h3 className="text-stone-400 font-bold tracking-tight">No products found.</h3>
        </div>
      )}
    </div>
  )
}
