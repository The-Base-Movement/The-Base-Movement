import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import type { Product, ProductReview } from '@/types/product'

interface ReviewsProps {
  product: Product
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          style={{
            fontSize: 22,
            cursor: 'pointer',
            color: i <= (hovered || value) ? '#DAA520' : '#e7e5e4',
            fontVariationSettings: i <= (hovered || value) ? "'FILL' 1" : "'FILL' 0",
            userSelect: 'none',
          }}
        >
          star
        </span>
      ))}
    </div>
  )
}

export function Reviews({ product }: ReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews_data ?? [])
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentUser = authService.getUser()

  const count = reviews.length || product.reviews || 0
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating || 4.8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser) return
    if (rating === 0) {
      toast.error('Please select a star rating.')
      return
    }
    if (!content.trim()) {
      toast.error('Please write a review.')
      return
    }
    setSubmitting(true)
    const authorName =
      (currentUser.user_metadata?.full_name as string | undefined) || 'Patriot Member'
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: product.id,
        author_name: authorName,
        rating,
        content: content.trim(),
      })
      .select('id, author_name, rating, content, created_at')
      .single()
    setSubmitting(false)
    if (error || !data) {
      toast.error('Failed to submit review. Please try again.')
      return
    }
    const newReview: ProductReview = {
      id: (data as { id: string }).id,
      patriot_name: (data as { author_name: string }).author_name,
      rating: (data as { rating: number }).rating,
      content: (data as { content: string }).content,
      is_verified: true,
      created_at: (data as { created_at: string }).created_at,
    }
    setReviews((prev) => [newReview, ...prev])
    setRating(0)
    setContent('')
    setShowForm(false)
    toast.success('Review submitted. Thank you!')
  }

  return (
    <section className="mt-10 md:mt-20 pt-10 md:pt-16 border-t border-stone-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
        <div>
          <span className="text-micro font-bold text-brand-green tracking-tight mb-4 block">
            Member feedback
          </span>
          <h2 className="font-h2 text-h3 text-stone-900">Member reviews</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-bold text-stone-900">{avgRating}</p>
            <p className="text-micro font-bold text-stone-400 tracking-tight">
              Average member rating
            </p>
            {count > 0 && (
              <p className="text-micro text-stone-400">
                {count} {count === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
          <div className="w-px h-12 bg-stone-200" />
          {currentUser ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="h-12 text-micro font-bold tracking-tight px-6 whitespace-nowrap rounded-none bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Cancel' : 'Write a review'}
            </button>
          ) : (
            <span className="text-micro text-stone-400 font-medium">Sign in to review</span>
          )}
        </div>
      </div>

      {/* Review form */}
      {showForm && currentUser && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{
            marginBottom: 40,
            background: '#fafafa',
            border: '1px solid #e7e7e7',
            padding: 24,
          }}
        >
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: '#1c1c1c',
              marginBottom: 16,
            }}
          >
            Your review
          </p>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                fontSize: 11,
                color: '#6b7280',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Rating
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                fontSize: 11,
                color: '#6b7280',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Review
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              style={{
                width: '100%',
                background: '#fff',
                border: '1px solid #e2e2e2',
                padding: '12px 14px',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                color: '#374151',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'var(--brand-green, #006B3F)',
                color: '#fff',
                border: 'none',
                height: 40,
                padding: '0 28px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                fontSize: 11,
                letterSpacing: '0.04em',
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="p-8 bg-white border border-stone-100 shadow-sm space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 12,
                        color: i <= review.rating ? '#DAA520' : '#e7e5e4',
                        fontVariationSettings: i <= review.rating ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      star
                    </span>
                  ))}
                </div>
                {review.is_verified && (
                  <span className="text-[8px] font-bold text-brand-green tracking-tight bg-brand-green/5 px-2 py-1 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>
                      verified_user
                    </span>{' '}
                    Verified patriot
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-600 font-medium leading-relaxed italic">
                "{review.content}"
              </p>
              <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                <span className="text-micro font-bold text-stone-900 tracking-tight">
                  {review.patriot_name}
                </span>
                <span className="text-micro font-bold text-stone-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-stone-50 text-center border border-dashed border-stone-200">
            <p className="text-micro font-bold text-stone-400 tracking-tight">
              Be the first patriot to review this gear.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
