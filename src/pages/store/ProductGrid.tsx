import { ProductCard } from '@/components/ProductCard'
import { EmptyState, Skeleton } from '@/components/states'
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
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton variant="img" style={{ aspectRatio: '1/1', height: 'auto' }} />
            <Skeleton variant="text-md" width="75%" />
            <Skeleton variant="text-sm" width="40%" />
          </div>
        ))
      ) : products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} onShare={onShare} />
        ))
      ) : (
        <div className="col-span-full">
          <EmptyState
            icon="shopping_bag"
            title="No products found."
            body="Check back later or clear your search to see all available items."
          />
        </div>
      )}
    </div>
  )
}
