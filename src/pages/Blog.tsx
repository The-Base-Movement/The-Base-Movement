import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BlogPostCard } from '@/components/BlogPostCard'
import { adminService, type BlogPost } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { toast } from 'sonner'
import { DashboardPageHeader } from './blog/DashboardPageHeader'
import { CategoryFilterBar } from './blog/CategoryFilterBar'
import { DashboardFeaturedPost } from './blog/DashboardFeaturedPost'
import { DashboardSidebar } from './blog/DashboardSidebar'
import { Pagination } from './blog/Pagination'
import { PublicHero } from './blog/PublicHero'
import { PublicFeaturedPost } from './blog/PublicFeaturedPost'
import { PublicSidebar } from './blog/PublicSidebar'
import { PublicCTA } from './blog/PublicCTA'
import { PublicSearchFilter } from './blog/PublicSearchFilter'

export default function Blog() {
  const { settings } = useBranding()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const baseUrl = isDashboard ? '/dashboard/blog' : '/blog'
  const [sidebarEmail, setSidebarEmail] = useState('')
  const [sidebarSubmitting, setSidebarSubmitting] = useState(false)
  const [publicEmail, setPublicEmail] = useState('')
  const [publicSubmitting, setPublicSubmitting] = useState(false)

  const handleNewsletter = async (
    email: string,
    setEmail: (v: string) => void,
    setSubmitting: (v: boolean) => void
  ) => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    setSubmitting(true)
    const success = await adminService.subscribeToNewsletter(email.trim())
    setSubmitting(false)
    if (success) {
      toast.success("Subscribed! You'll receive The Base Weekly.")
      setEmail('')
    } else toast.error('Subscription failed. Please try again.')
  }

  useEffect(() => {
    let isMounted = true
    async function fetchPosts() {
      setLoading(true)
      try {
        const data = await contentService.getBlogPosts()
        if (isMounted) setPosts(data)
      } catch (err) {
        console.error('Failed to fetch blog posts:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchPosts()
    return () => {
      isMounted = false
    }
  }, [])

  const [currentPage, setCurrentPage] = useState(1)
  const POSTS_PER_PAGE = 6

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))]

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const q = searchQuery.trim().toLowerCase()
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q) ||
      (p.authorName || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)
  const featured = currentPage === 1 ? paginated[0] : null
  const rest = currentPage === 1 ? paginated.slice(1) : paginated

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setCurrentPage(1)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setCurrentPage(1)
  }

  // ── Dashboard layout ──────────────────────────────────────────────────────
  if (isDashboard) {
    return (
      <div className="main">
        <DashboardPageHeader />

        <CategoryFilterBar
          categories={categories}
          activeCategory={activeCategory}
          posts={posts}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              gap: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 32,
                color: 'hsl(var(--primary))',
                animation: 'spin 1.2s linear infinite',
              }}
            >
              sync
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Loading articles…
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 32,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.3,
                display: 'block',
                marginBottom: 8,
              }}
            >
              article
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No articles published yet.
            </p>
          </div>
        ) : (
          <div className="main-sidebar" style={{ alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {featured && <DashboardFeaturedPost post={featured} baseUrl={baseUrl} />}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                  {rest.map((post) => (
                    <BlogPostCard key={post.id} post={post} baseUrl={baseUrl} />
                  ))}
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>

            <DashboardSidebar
              categories={categories}
              activeCategory={activeCategory}
              posts={posts}
              onCategoryChange={handleCategoryChange}
              sidebarEmail={sidebarEmail}
              onSidebarEmailChange={setSidebarEmail}
              sidebarSubmitting={sidebarSubmitting}
              onSidebarSubscribe={() =>
                handleNewsletter(sidebarEmail, setSidebarEmail, setSidebarSubmitting)
              }
            />
          </div>
        )}
      </div>
    )
  }

  // ── Public layout ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-stone-50/50 font-meta">
        <SEO
          title="Updates & Articles"
          description="Perspectives on governance, youth empowerment, diaspora engagement and the future of Ghana from within The Base Movement."
          canonical="/blog"
        />
        <PublicHero />

        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 md:mt-16 pb-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <span
                className="material-symbols-outlined text-brand-green animate-spin"
                style={{ fontSize: 32 }}
              >
                progress_activity
              </span>
              <p className="text-micro font-semibold tracking-tight text-stone-400">
                Loading articles...
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-sm font-medium text-stone-400 tracking-tight">
                No articles published yet.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile/tablet search + filter — sidebar handles desktop */}
              <PublicSearchFilter
                categories={categories}
                activeCategory={activeCategory}
                posts={posts}
                searchQuery={searchQuery}
                onCategoryChange={handleCategoryChange}
                onSearchChange={handleSearchChange}
              />

              {featured && (
                <PublicFeaturedPost post={featured} baseUrl={baseUrl} logoUrl={settings.logo_url} />
              )}

              <section>
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/3">
                    {rest.length > 0 && (
                      <>
                        <h2 className="text-stone-900 font-bold tracking-tight mb-5 text-base">
                          Latest articles
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-5 md:gap-8">
                          {rest.map((post) => (
                            <BlogPostCard key={post.id} post={post} baseUrl={baseUrl} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <PublicSidebar
                    categories={categories}
                    activeCategory={activeCategory}
                    posts={posts}
                    onCategoryChange={setActiveCategory}
                    publicEmail={publicEmail}
                    onPublicEmailChange={setPublicEmail}
                    publicSubmitting={publicSubmitting}
                    onPublicSubscribe={() =>
                      handleNewsletter(publicEmail, setPublicEmail, setPublicSubmitting)
                    }
                  />
                </div>
              </section>

              {/* Mobile newsletter — below articles, above CTA, desktop-only sidebar handles this */}
              <div className="lg:hidden mt-10 bg-[#181d19] p-6 border-l-4 border-[hsl(var(--accent))] text-white">
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#fff',
                    marginBottom: 4,
                  }}
                >
                  The Base Weekly
                </p>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.6,
                    margin: '0 0 12px',
                  }}
                >
                  Policy briefs and movement news, delivered weekly.
                </p>
                <input
                  aria-label="Email address"
                  name="name-pub-mobile"
                  id="input-pub-mobile"
                  type="email"
                  placeholder="Email address"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    color: '#fff',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 8,
                  }}
                />
                <button
                  onClick={() => handleNewsletter(publicEmail, setPublicEmail, setPublicSubmitting)}
                  disabled={publicSubmitting}
                  style={{
                    width: '100%',
                    height: 40,
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {publicSubmitting ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <PublicCTA />
    </>
  )
}
