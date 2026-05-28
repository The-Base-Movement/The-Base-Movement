import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { toast } from 'sonner'

type Tab = 'comments' | 'reviews'

interface BlogComment {
  id: string
  author_name: string
  content: string
  flagged: boolean
  created_at: string
  post_id: string
  post_title: string | null
  post_slug: string | null
}

interface ProductReview {
  id: string
  author_name: string
  rating: number
  content: string | null
  created_at: string
  product_id: string | null
  product_name: string | null
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined"
          style={{
            fontSize: 12,
            color: i <= rating ? '#DAA520' : '#d1d5db',
            fontVariationSettings: i <= rating ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          star
        </span>
      ))}
    </div>
  )
}

const inputSt: React.CSSProperties = {
  height: 34,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--background))',
  boxSizing: 'border-box',
}

export default function AdminModeration() {
  const [tab, setTab] = useState<Tab>('comments')
  const [comments, setComments] = useState<BlogComment[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadComments = useCallback(() => {
    void (async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_comments')
        .select('id, author_name, content, flagged, created_at, post_id, blog_posts(title, slug)')
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to load comments.')
        setLoading(false)
        return
      }
      setComments(
        (
          data as unknown as Array<{
            id: string
            author_name: string
            content: string
            flagged: boolean
            created_at: string
            post_id: string
            blog_posts: { title: string; slug: string } | null
          }>
        ).map((r) => ({
          id: r.id,
          author_name: r.author_name,
          content: r.content,
          flagged: r.flagged,
          created_at: r.created_at,
          post_id: r.post_id,
          post_title: r.blog_posts?.title ?? null,
          post_slug: r.blog_posts?.slug ?? null,
        }))
      )
      setLoading(false)
    })()
  }, [])

  const loadReviews = useCallback(() => {
    void (async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews')
        .select('id, author_name, rating, content, created_at, product_id, store_inventory(name)')
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to load reviews.')
        setLoading(false)
        return
      }
      setReviews(
        (
          data as unknown as Array<{
            id: string
            author_name: string
            rating: number
            content: string | null
            created_at: string
            product_id: string | null
            store_inventory: { name: string } | null
          }>
        ).map((r) => ({
          id: r.id,
          author_name: r.author_name,
          rating: r.rating,
          content: r.content,
          created_at: r.created_at,
          product_id: r.product_id,
          product_name: r.store_inventory?.name ?? null,
        }))
      )
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (tab === 'comments') void loadComments()
    else void loadReviews()
  }, [tab, loadComments, loadReviews])

  async function deleteComment(id: string) {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await supabase.from('blog_comments').delete().eq('id', id)
    setDeleting(null)
    if (error) {
      toast.error('Failed to delete comment.')
      return
    }
    toast.success('Comment deleted.')
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  async function unflagComment(id: string) {
    const { error } = await supabase.from('blog_comments').update({ flagged: false }).eq('id', id)
    if (error) {
      toast.error('Failed to clear flag.')
      return
    }
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, flagged: false } : c)))
    toast.success('Flag cleared.')
  }

  async function deleteReview(id: string) {
    if (!window.confirm('Delete this review? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    setDeleting(null)
    if (error) {
      toast.error('Failed to delete review.')
      return
    }
    toast.success('Review deleted.')
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const filteredComments = comments.filter((c) => {
    if (flaggedOnly && !c.flagged) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.author_name.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      (c.post_title ?? '').toLowerCase().includes(q)
    )
  })

  const filteredReviews = reviews.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.author_name.toLowerCase().includes(q) ||
      (r.content ?? '').toLowerCase().includes(q) ||
      (r.product_name ?? '').toLowerCase().includes(q)
    )
  })

  const flaggedCount = comments.filter((c) => c.flagged).length

  return (
    <div className="main">
      <AdminPageHeader
        title="Moderation"
        icon="shield_person"
        description="Review flagged comments and member product reviews."
      />

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          {
            label: 'Total Comments',
            value: comments.length,
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'Flagged Comments',
            value: flaggedCount,
            bar: 'hsl(var(--destructive))',
          },
          {
            label: 'Total Reviews',
            value: reviews.length,
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Avg. Rating',
            value: reviews.length
              ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
              : '—',
            bar: 'hsl(var(--accent))',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: k.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {k.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${tab === 'comments' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
            onClick={() => {
              setTab('comments')
              setSearch('')
              setFlaggedOnly(false)
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              chat_bubble
            </span>
            Blog Comments
            {flaggedCount > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  background: 'hsl(var(--destructive))',
                  color: '#fff',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  padding: '1px 6px',
                  lineHeight: 1.6,
                }}
              >
                {flaggedCount}
              </span>
            )}
          </button>
          <button
            className={`btn btn-sm ${tab === 'reviews' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
            onClick={() => {
              setTab('reviews')
              setSearch('')
              setFlaggedOnly(false)
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              star
            </span>
            Product Reviews
          </button>
        </div>

        {/* Search + flag filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              placeholder={
                tab === 'comments'
                  ? 'Search author, content, post…'
                  : 'Search author, content, product…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputSt, width: '100%', paddingLeft: 34 }}
            />
          </div>
          {tab === 'comments' && (
            <button
              className={`btn btn-sm ${flaggedOnly ? 'btn-active-tab' : 'btn-inactive-tab'}`}
              onClick={() => setFlaggedOnly((v) => !v)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                flag
              </span>
              Flagged only
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p
            style={{
              padding: 32,
              textAlign: 'center',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Loading…
          </p>
        ) : tab === 'comments' ? (
          filteredComments.length === 0 ? (
            <p
              style={{
                padding: 32,
                textAlign: 'center',
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {flaggedOnly ? 'No flagged comments.' : 'No comments yet.'}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Post', 'Author', 'Comment', 'Date', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComments.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      background: c.flagged ? 'hsl(var(--destructive) / 0.04)' : undefined,
                    }}
                  >
                    <td style={{ padding: '12px 14px', maxWidth: 180 }}>
                      {c.post_title ? (
                        <span
                          style={{
                            fontSize: 12,
                            color: 'hsl(var(--on-surface))',
                            fontWeight: 'var(--font-weight-medium, 500)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {c.post_title}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        color: 'hsl(var(--on-surface))',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.author_name}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        color: 'hsl(var(--on-surface-muted))',
                        maxWidth: 340,
                      }}
                    >
                      <span
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                      >
                        {c.content}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(c.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.flagged ? (
                        <span className="pill pill-err" style={{ fontSize: 11 }}>
                          Flagged
                        </span>
                      ) : (
                        <span className="pill pill-ok" style={{ fontSize: 11 }}>
                          OK
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.flagged && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => void unflagComment(c.id)}
                          >
                            Clear flag
                          </button>
                        )}
                        <button
                          className="btn btn-outline-dest btn-sm"
                          disabled={deleting === c.id}
                          onClick={() => void deleteComment(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : filteredReviews.length === 0 ? (
          <p
            style={{
              padding: 32,
              textAlign: 'center',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No reviews yet.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Product', 'Author', 'Rating', 'Review', 'Date', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 14px', maxWidth: 180 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {r.product_name ?? '—'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'hsl(var(--on-surface))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.author_name}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <StarDisplay rating={r.rating} />
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'hsl(var(--on-surface-muted))',
                      maxWidth: 340,
                    }}
                  >
                    <span
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                      }}
                    >
                      {r.content ?? '—'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(r.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="btn btn-outline-dest btn-sm"
                      disabled={deleting === r.id}
                      onClick={() => void deleteReview(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
