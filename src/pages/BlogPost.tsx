import { useState, useEffect } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { CommentSection } from '@/components/CommentSection'
import DOMPurify from 'dompurify'
import { adminService, type BlogPost as BlogPostType } from '@/services/adminService'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { PostToolbar } from './blogpost/PostToolbar'
import { PostHeader } from './blogpost/PostHeader'
import { PostHeroImage } from './blogpost/PostHeroImage'
import { PostSidebar } from './blogpost/PostSidebar'
import { Skeleton } from '@/components/states'
import { contentService } from '@/services/contentService'
import { getBlogImageUrl } from '@/lib/blogImages'

export default function BlogPost() {
  const { settings } = useBranding()
  const { id: slug } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const baseUrl = isDashboard ? '/dashboard/blog' : '/blog'

  const [post, setPost] = useState<BlogPostType | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return
      setLoading(true)
      try {
        const data = await adminService.getBlogPostBySlug(slug)
        if (data) {
          setPost(data)
          if (isDashboard) {
            const liked = await contentService.isPostLiked(data.id)
            setIsLiked(liked)
          }
        }
        const allPosts = await adminService.getBlogPosts()
        setRelatedPosts(allPosts.filter((p) => p.slug !== slug).slice(0, 3))
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [slug, isDashboard])

  const handleLikeToggle = async () => {
    if (!post || likeLoading) return
    setLikeLoading(true)
    try {
      if (isLiked) {
        await contentService.unlikePost(post.id)
        setIsLiked(false)
      } else {
        await contentService.likePost(post.id)
        setIsLiked(true)
      }
    } finally {
      setLikeLoading(false)
    }
  }

  const handleShare = (platform?: string) => {
    if (!post) return
    const url = window.location.href
    const title = post.title
    let shareUrl = ''
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
        break
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        break
      default:
        if (navigator.share) {
          navigator.share({ title, url }).catch(() => {})
        } else {
          navigator.clipboard.writeText(url)
          alert('Link copied to clipboard')
        }
        return
    }
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className="page-container pt-12 pb-20">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton variant="chip" width={80} />
          <Skeleton variant="text-xl" width="60%" />
          <Skeleton variant="text-md" width="80%" />
          <Skeleton variant="text-md" width="50%" />
          <Skeleton
            variant="img"
            height={420}
            style={{ borderRadius: 'var(--radius-lg)', marginTop: 8 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="text-md" width={i % 3 === 2 ? '65%' : '100%'} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <>
        <SEO title="Update Not Found" noindex />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div
            className="w-16 h-16 flex items-center justify-center mb-8 rotate-3"
            style={{ background: 'hsl(var(--container-low))' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))' }}
            >
              search
            </span>
          </div>
          <h2
            className="font-meta font-medium text-2xl tracking-tight mb-4"
            style={{ color: 'hsl(var(--on-surface))' }}
          >
            Update not found
          </h2>
          <p
            className="text-sm font-medium max-w-xs mx-auto mb-10 leading-relaxed"
            style={{ color: 'hsl(var(--on-surface-muted))' }}
          >
            The article you requested does not exist or has been archived within the movement's
            vault.
          </p>
          <button
            onClick={() => navigate(baseUrl)}
            className="h-14 px-10 border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              background: 'hsl(var(--primary))',
              color: '#fff',
              borderRadius: 'var(--button-radius)',
              fontWeight: 'var(--button-font-weight)',
            }}
          >
            Return to updates
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </button>
        </div>
      </>
    )
  }

  const pageTitle = post.seoTitle || post.title
  const pageDescription =
    post.metaDescription || post.excerpt || `Read "${post.title}" on The Base Movement.`
  const canonicalUrl = `${window.location.origin}/blog/${post.slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: pageDescription,
    image: post.imageUrl,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.authorName || 'The Base Editorial' },
    publisher: {
      '@type': 'Organization',
      name: 'The Base Movement',
      logo: { '@type': 'ImageObject', url: settings.logo_url },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'hsl(var(--background))' }}>
      <SEO
        title={pageTitle}
        description={pageDescription}
        ogImage={post.imageUrl || undefined}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={articleSchema}
      />
      <main className="page-container pt-12">
        <PostToolbar
          title={post.title}
          onShare={handleShare}
          isDashboard={isDashboard}
          isLiked={isLiked}
          likeLoading={likeLoading}
          onLikeToggle={handleLikeToggle}
        />

        <article className="space-y-12">
          <PostHeader
            category={post.category}
            publishedAt={post.publishedAt}
            readTime={post.readTime}
            title={post.title}
            excerpt={post.excerpt}
          />

          <PostHeroImage imageUrl={post.imageUrl} title={post.title} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-16">
            <PostSidebar
              authorImage={post.authorImage}
              authorName={post.authorName}
              authorRole={post.authorRole}
              authorBio={post.authorBio}
              onShare={handleShare}
            />

            <div className="lg:col-span-3 order-1 lg:order-2">
              <div
                className="prose prose-lg max-w-none prose-standard
                  prose-headings:font-meta prose-headings:font-medium prose-headings:tracking-tight
                  prose-p:leading-relaxed prose-p:mb-8 prose-strong:font-medium"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
              />

              <div
                className="mt-16 pt-8 flex flex-wrap gap-2"
                style={{ borderTop: '1px solid hsl(var(--border))' }}
              >
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-micro font-medium tracking-tight cursor-pointer transition-colors"
                    style={{
                      background: 'hsl(var(--container-low))',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {post.id && <CommentSection postId={post.id} />}

              {/* CTA — dark gradient matching page hero */}
              <div
                className="mt-24 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #181d19 0%, #0e1510 100%)' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-40%',
                    left: '-5%',
                    width: '55%',
                    height: '220%',
                    background:
                      'radial-gradient(ellipse at center, rgba(0,107,63,0.22) 0%, transparent 65%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: "url('/noise.png')",
                    opacity: 0.04,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className="relative z-10 flex flex-col md:flex-row items-center md:justify-between gap-6 md:gap-8"
                  style={{ padding: '36px 32px' }}
                >
                  <div className="text-center md:text-left">
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--accent))',
                        marginBottom: 10,
                      }}
                    >
                      Join the Movement
                    </p>
                    <h2
                      style={{
                        color: '#fff',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        margin: '0 0 10px',
                      }}
                    >
                      Build the Future Together
                    </h2>
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      Join "The Base" movement and be a part of Ghana's industrial revolution.
                    </p>
                  </div>
                  <Link to="/register" style={{ flexShrink: 0 }}>
                    <button
                      style={{
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        border: 'none',
                        height: 46,
                        padding: '0 28px',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Register as a member
                    </button>
                  </Link>
                </div>
                <div style={{ display: 'flex', height: 4 }}>
                  <div style={{ flex: 1, background: 'var(--brand-red)' }} />
                  <div style={{ flex: 1, background: 'var(--brand-gold)' }} />
                  <div style={{ flex: 1, background: 'var(--brand-green)' }} />
                </div>
              </div>

              {relatedPosts.length > 0 && (
                <div className="mt-16 md:mt-24">
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--accent))',
                      marginBottom: 20,
                    }}
                  >
                    Related updates
                  </p>
                  <Swiper
                    modules={[Pagination, Autoplay]}
                    slidesPerView={1.12}
                    spaceBetween={16}
                    autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    pagination={{ clickable: true }}
                    style={
                      {
                        '--swiper-pagination-color': 'var(--brand-green)',
                        '--swiper-pagination-bullet-inactive-color': '#d4d4d4',
                        '--swiper-pagination-bullet-inactive-opacity': '1',
                        paddingBottom: 36,
                      } as React.CSSProperties
                    }
                    breakpoints={{
                      640: { slidesPerView: 2.1, spaceBetween: 20 },
                      1024: { slidesPerView: 3, spaceBetween: 24 },
                    }}
                  >
                    {relatedPosts.map((related) => (
                      <SwiperSlide key={related.id}>
                        <Link to={`${baseUrl}/${related.slug}`} className="block group">
                          <article className="cursor-pointer">
                            <div
                              className="aspect-[16/10] overflow-hidden mb-3 relative"
                              style={{ border: '1px solid hsl(var(--border))' }}
                            >
                              <img
                                src={getBlogImageUrl(related.imageUrl)}
                                alt={related.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                decoding="async"
                                loading="lazy"
                              />
                              <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-green)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </div>
                            <span
                              style={{
                                display: 'block',
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 11,
                                color: 'var(--brand-green)',
                                letterSpacing: '0.04em',
                                marginBottom: 6,
                              }}
                            >
                              {related.category}
                            </span>
                            <h5
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-semibold, 600)',
                                fontSize: 14,
                                color: 'hsl(var(--on-surface))',
                                lineHeight: 1.35,
                                margin: 0,
                                letterSpacing: '-0.01em',
                              }}
                              className="group-hover:text-[var(--brand-green)] transition-colors"
                            >
                              {related.title}
                            </h5>
                          </article>
                        </Link>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
