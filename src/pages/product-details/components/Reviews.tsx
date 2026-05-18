import type { Product } from '@/types/product'

interface ReviewsProps {
  product: Product
}

export function Reviews({ product }: ReviewsProps) {
  const count = product.reviews_data?.length ?? product.reviews ?? 0
  const avgRating = product.reviews_data?.length
    ? (product.reviews_data.reduce((s, r) => s + r.rating, 0) / product.reviews_data.length).toFixed(1)
    : (product.rating || 4.8)

  return (
    <section className="mt-10 md:mt-20 pt-10 md:pt-16 border-t border-stone-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
        <div>
          <span className="text-micro font-bold text-brand-green tracking-tight mb-4 block">Member feedback</span>
          <h2 className="font-h2 text-h3 text-stone-900">Member reviews</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-bold text-stone-900">{avgRating}</p>
            <p className="text-micro font-bold text-stone-400 tracking-tight">Average member rating</p>
            {count > 0 && <p className="text-micro text-stone-400">{count} {count === 1 ? 'review' : 'reviews'}</p>}
          </div>
          <div className="w-px h-12 bg-stone-200" />
          <button className="h-12 text-micro font-bold tracking-tight px-6 whitespace-nowrap rounded-none bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity">
            Write a review
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {product.reviews_data && product.reviews_data.length > 0 ? (
          product.reviews_data.map((review) => (
            <div key={review.id} className="p-8 bg-white border border-stone-100 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="material-symbols-outlined" style={{ fontSize: 12, color: i <= review.rating ? '#DAA520' : '#e7e5e4', fontVariationSettings: i <= review.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                  ))}
                </div>
                {review.is_verified && (
                  <span className="text-[8px] font-bold text-brand-green tracking-tight bg-brand-green/5 px-2 py-1 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>verified_user</span> Verified patriot
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-600 font-medium leading-relaxed italic">"{review.content}"</p>
              <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                <span className="text-micro font-bold text-stone-900 tracking-tight">{review.patriot_name}</span>
                <span className="text-micro font-bold text-stone-400">{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-stone-50 text-center border border-dashed border-stone-200">
            <p className="text-micro font-bold text-stone-400 tracking-tight">Be the first patriot to review this gear.</p>
          </div>
        )}
      </div>
    </section>
  )
}
