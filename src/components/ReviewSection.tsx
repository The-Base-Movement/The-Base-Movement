import { useState } from 'react'

interface Review {
  id: string
  author: string
  rating: number
  date: string
  content: string
  verified: boolean
}


export function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      author: 'Samuel K.',
      rating: 5,
      date: 'Oct 15, 2024',
      content: 'Exceptional quality. The print is sharp and the fabric feels premium. Proud to represent the movement.',
      verified: true
    },
    {
      id: '2',
      author: 'Linda O.',
      rating: 4,
      date: 'Oct 10, 2024',
      content: 'Great fit and very comfortable. Shipping was prompt to Kumasi.',
      verified: true
    }
  ])
  const [newReview, setNewReview] = useState('')
  const [newRating, setNewRating] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReview.trim()) return
    
    const review: Review = {
      id: Date.now().toString(),
      author: 'Verified Member',
      rating: newRating,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: newReview,
      verified: true
    }
    
    setReviews([review, ...reviews])
    setNewReview('')
  }

  return (
    <div className="mt-24 pt-12 border-t border-stone-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-2">Member Reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-warm-gold" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <span className="text-sm font-bold text-stone-900">4.9 out of 5</span>
            <span className="text-stone-400 text-xs font-medium ml-2">{reviews.length} total reviews</span>
          </div>
        </div>
        <button className="bg-charcoal-dark hover:bg-charcoal-dark/90 text-white font-bold tracking-tight text-micro h-12 px-10 rounded-none border-none cursor-pointer">
          Write a review
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 p-8 bg-stone-50 border border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 tracking-tight mb-6">Share your feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-micro font-bold text-stone-400 tracking-tight">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRating(s)}
                      className="transition-transform hover:scale-110 border-none bg-transparent cursor-pointer p-0"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: s <= newRating ? '#DAA520' : '#d6d3d1', fontVariationSettings: s <= newRating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-micro font-bold text-stone-400 tracking-tight">Your review</label>
                <textarea name="newReview" id="textarea-835070"
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="What was your experience?"
                  className="w-full bg-white border border-stone-200 p-4 text-sm font-medium focus:ring-1 focus:ring-brand-green outline-none min-h-[120px] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!newReview.trim()}
                className="w-full bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-bold tracking-tight text-micro h-12 rounded-none border-none cursor-pointer disabled:opacity-50"
              >
                Submit review
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-10">
          {reviews.map((review) => (
            <div key={review.id} className="pb-10 border-b border-stone-100 last:border-0">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-stone-400" style={{ fontSize: 20 }}>person</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 mb-0 tracking-tight">{review.author}</h4>
                    {review.verified && (
                      <span className="text-micro font-bold text-emerald-600 tracking-tight">Verified purchase</span>
                    )}
                  </div>
                </div>
                <span className="text-micro font-bold text-stone-400 tracking-tight">{review.date}</span>
              </div>
              
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="material-symbols-outlined" style={{ fontSize: 14, color: s <= review.rating ? '#DAA520' : '#e7e5e4', fontVariationSettings: s <= review.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                ))}
              </div>

              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                {review.content}
              </p>

              <button className="flex items-center gap-2 text-micro font-bold text-stone-400 tracking-tight hover:text-[var(--brand-green)] transition-colors border-none bg-transparent cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>thumb_up</span> Helpful
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
