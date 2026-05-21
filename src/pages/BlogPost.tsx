import { useState, useEffect } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { CommentSection } from '@/components/CommentSection'
import { adminService, type BlogPost as BlogPostType } from '@/services/adminService'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { PostToolbar } from './blogpost/PostToolbar'
import { PostHeader } from './blogpost/PostHeader'
import { PostHeroImage } from './blogpost/PostHeroImage'
import { PostSidebar } from './blogpost/PostSidebar'

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

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return
      setLoading(true)
      try {
        const data = await adminService.getBlogPostBySlug(slug)
        if (data) setPost(data)
        const allPosts = await adminService.getBlogPosts()
        setRelatedPosts(allPosts.filter((p) => p.slug !== slug).slice(0, 3))
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [slug])

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <span
          className="material-symbols-outlined animate-spin"
          style={{ fontSize: 32, color: 'var(--brand-green)' }}
        >
          progress_activity
        </span>
        <p className="text-micro font-bold tracking-tight text-stone-400">
          Loading insight file...
        </p>
      </div>
    )
  }

  if (!post) {
    return (
      <>
        <SEO title="Insight Not Found" noindex />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-stone-100 flex items-center justify-center mb-8 rotate-3">
            <span className="material-symbols-outlined text-stone-300" style={{ fontSize: 32 }}>
              search
            </span>
          </div>
          <h2 className="font-meta font-bold text-2xl tracking-tight text-charcoal-dark mb-4">
            Insight not found
          </h2>
          <p className="text-sm font-medium text-stone-500 max-w-xs mx-auto mb-10 leading-relaxed">
            The coordinate you requested does not exist or has been archived within the movement's
            vault.
          </p>
          <button
            onClick={() => navigate(baseUrl)}
            className="h-14 px-10 bg-primary text-white border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              borderRadius: 'var(--button-radius)',
              fontWeight: 'var(--button-font-weight)',
            }}
          >
            Return to insights
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
    <div className="min-h-screen bg-white pb-20">
      <SEO
        title={pageTitle}
        description={pageDescription}
        ogImage={post.imageUrl || undefined}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={articleSchema}
      />
      <main className="max-w-[1280px] mx-auto px-6 md:px-8 pt-12">
        <PostToolbar title={post.title} onShare={handleShare} />

        <article className="space-y-12">
          <PostHeader
            category={post.category}
            publishedAt={post.publishedAt}
            readTime={post.readTime}
            title={post.title}
            excerpt={post.excerpt}
          />

          <PostHeroImage imageUrl={post.imageUrl} title={post.title} logoUrl={settings.logo_url} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
            <PostSidebar
              authorImage={post.authorImage}
              authorName={post.authorName}
              authorRole={post.authorRole}
              authorBio={post.authorBio}
              onShare={handleShare}
            />

            <div className="lg:col-span-3 order-1 lg:order-2">
              <div
                className="prose prose-stone prose-lg max-w-none
                  prose-headings:font-meta prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-stone-900
                  prose-p:text-stone-600 prose-p:leading-relaxed prose-p:mb-8
                  prose-blockquote:border-l-brand-green prose-blockquote:bg-stone-50 prose-blockquote:p-8 prose-blockquote:font-bold prose-blockquote:text-stone-900 prose-blockquote:italic
                  prose-strong:text-stone-900 prose-strong:font-bold"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-16 pt-8 border-t border-stone-100 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-stone-100 text-stone-500 text-micro font-bold tracking-tight hover:bg-[var(--brand-green)]/10 hover:text-[var(--brand-green)] cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <CommentSection />

              <div className="mt-24 p-10 bg-charcoal-dark text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-green)]/10 -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-white tracking-tight mb-2">Build the Future Together</h2>
                    <p className="text-stone-400 mb-0">
                      Join "The Base" movement and be a part of Ghana's industrial revolution.
                    </p>
                  </div>
                  <Link to="/register">
                    <button
                      className="bg-[var(--brand-green)] hover:opacity-90 text-white tracking-tight text-xs h-14 px-10 border-none cursor-pointer transition-opacity"
                      style={{
                        borderRadius: 'var(--button-radius)',
                        fontWeight: 'var(--button-font-weight)',
                      }}
                    >
                      Register as a member
                    </button>
                  </Link>
                </div>
                <div className="mt-10 flex h-1 w-full">
                  <div className="flex-1 bg-[var(--brand-red)]"></div>
                  <div className="flex-1 bg-[var(--brand-gold)]"></div>
                  <div className="flex-1 bg-[var(--brand-green)]"></div>
                </div>
              </div>

              <div className="mt-24">
                <p className="text-micro font-bold text-warm-gold tracking-tight mb-10">
                  Related insights
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedPosts.map((related) => (
                    <Link
                      to={`${baseUrl}/${related.slug}`}
                      key={related.id}
                      className="block group"
                    >
                      <article className="group cursor-pointer">
                        <div className="aspect-[16/10] overflow-hidden border border-stone-200 mb-4 relative">
                          {related.imageUrl ? (
                            <img
                              src={related.imageUrl}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              decoding="async"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative">
                              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />
                              <img
                                src={settings.logo_url}
                                alt="The Base"
                                className="w-8 h-8 opacity-20 mb-2 grayscale"
                              />
                            </div>
                          )}
                          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-green)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </div>
                        <span className="text-micro font-bold text-[var(--brand-green)] tracking-tight mb-0">
                          {related.category}
                        </span>
                        <h5 className="text-stone-900 mt-2 group-hover:text-[var(--brand-green)] transition-colors leading-tight mb-0">
                          {related.title}
                        </h5>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
