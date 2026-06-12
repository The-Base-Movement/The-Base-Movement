import { Skeleton } from '@/components/states'

export function RelatedProducts() {
  return (
    <section className="mt-24">
      <h2 className="font-h2 text-h3 text-stone-900 mb-12">You might also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton variant="img" style={{ aspectRatio: '4/5', height: 'auto' }} />
            <Skeleton variant="text-md" width="75%" />
            <Skeleton variant="text-sm" width="40%" />
          </div>
        ))}
      </div>
    </section>
  )
}
