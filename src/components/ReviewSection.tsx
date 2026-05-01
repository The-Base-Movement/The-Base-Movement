import { useState } from 'react'
import { User, Star, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
                <Star key={s} className="w-4 h-4 fill-warm-gold text-warm-gold" />
              ))}
            </div>
            <span className="text-sm font-bold text-stone-900">4.9 out of 5</span>
            <span className="text-stone-400 text-xs font-medium ml-2">{reviews.length} total reviews</span>
          </div>
        </div>
        <Button className="bg-charcoal-dark hover:bg-charcoal-dark/90 text-white font-bold tracking-widest text-[10px] h-12 px-10 rounded-none uppercase">
          Write a Review
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 p-8 bg-stone-50 border border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-6">Share your feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => setNewRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${s <= newRating ? 'fill-warm-gold text-warm-gold' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Your Review</label>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="What was your experience?"
                  className="w-full bg-white border border-stone-200 p-4 text-sm font-medium focus:ring-1 focus:ring-brand-green outline-none min-h-[120px] transition-all"
                />
              </div>
              <Button 
                type="submit"
                disabled={!newReview.trim()}
                className="w-full bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-bold tracking-widest text-[10px] h-12 rounded-none uppercase"
              >
                Submit Review
              </Button>
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
                    <User className="w-5 h-5 text-stone-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 mb-0 uppercase tracking-tight">{review.author}</h4>
                    {review.verified && (
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Verified Purchase</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{review.date}</span>
              </div>
              
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-warm-gold text-warm-gold' : 'text-stone-200'}`} />
                ))}
              </div>

              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                {review.content}
              </p>

              <button className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-[var(--brand-green)] transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" /> Helpful
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
