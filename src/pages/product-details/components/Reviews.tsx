import type { Product } from '@/types/product'

interface ReviewsProps {
  product: Product
}

export function Reviews({ product }: ReviewsProps) {
  return (
    <section className="mt-24 pt-24 border-t border-stone-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <span className="text-micro font-bold text-brand-green tracking-tight mb-4 block">Voice of the movement</span>
          <h2 className="font-h2 text-h3 text-stone-900">Patriot reviews</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-bold text-stone-900">{product.rating || '4.8'}</p>
            <p className="text-micro font-bold text-stone-400 tracking-tight">Average patriot rating</p>
          </div>
          <div className="w-px h-12 bg-stone-200" />
          <button className="h-12 text-micro font-bold tracking-tight px-8 rounded-none bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity">
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
