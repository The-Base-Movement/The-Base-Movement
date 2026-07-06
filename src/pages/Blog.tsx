import { useState, useEffect } from 'react'
import { EmptyState, Skeleton, Banner } from '@/components/states'
import { useLocation } from 'react-router-dom'
import { BlogPostCard } from '@/components/BlogPostCard'
import { adminService, type BlogPost } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import SEO from '@/components/SEO'
import { toast } from 'sonner'
import { DashboardPageHeader } from './blog/DashboardPageHeader'
import { CategoryFilterBar } from './blog/CategoryFilterBar'
import { DashboardFeaturedPost } from './blog/DashboardFeaturedPost'
import { DashboardSidebar } from './blog/DashboardSidebar'
import { Pagination } from '@/components/Pagination'
import { PublicHero } from './blog/PublicHero'
import { PublicFeaturedPost } from './blog/PublicFeaturedPost'
import { PublicSidebar } from './blog/PublicSidebar'
import { PublicCTA } from './blog/PublicCTA'
import { PublicSearchFilter } from './blog/PublicSearchFilter'
import { WingDivider } from '@/components/ui/WingDivider'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const baseUrl = isDashboard ? '/dashboard/blog' : '/blog'
  const [sidebarEmail, setSidebarEmail] = useState('')
  const [sidebarPhone, setSidebarPhone] = useState('')
  const [sidebarSubmitting, setSidebarSubmitting] = useState(false)
  const [sidebarSubscribed, setSidebarSubscribed] = useState(false)
  const [publicEmail, setPublicEmail] = useState('')
  const [publicPhone, setPublicPhone] = useState('')
  const [publicSubmitting, setPublicSubmitting] = useState(false)
  const [publicSubscribed, setPublicSubscribed] = useState(false)
  const [error, setError] = useState(false)

  const handleNewsletter = async (
    email: string,
    phone: string,
    setSubmitting: (v: boolean) => void,
    setSubscribed: (v: boolean) => void
  ) => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (phone.trim() && phone.replace(/\D/g, '').length < 8) {
      toast.error('Please enter a valid phone number for SMS updates, or leave it blank.')
      return
    }
    setSubmitting(true)
    const success = await adminService.subscribeToNewsletter(email.trim(), phone.trim())
    setSubmitting(false)
    if (success) {
      toast.success("Subscribed! You'll receive The Base Weekly.")
      setSubscribed(true)
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
        if (isMounted) setError(true)
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

        {error && (
          <Banner
            variant="error"
            title="Failed to load articles."
            body="Check your connection and try refreshing the page."
            style={{ marginBottom: 16 }}
          />
        )}
        {loading ? (
          <div className="main-sidebar" style={{ alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton variant="img" height={180} />
                <Skeleton variant="chip" width={90} />
                <Skeleton variant="text-xl" width="75%" />
                <Skeleton variant="text-md" />
                <Skeleton variant="text-md" width="55%" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Skeleton variant="img" height={120} />
                    <Skeleton variant="chip" width={70} />
                    <Skeleton variant="text-lg" width="80%" />
                    <Skeleton variant="text-sm" />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="text-md" />
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon="article"
            title="No articles yet."
            body="Stories will appear here once content is published."
          />
        ) : (
          <div className="main-sidebar" style={{ alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {featured && <DashboardFeaturedPost post={featured} baseUrl={baseUrl} />}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
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
              sidebarPhone={sidebarPhone}
              onSidebarPhoneChange={setSidebarPhone}
              sidebarSubmitting={sidebarSubmitting}
              sidebarSubscribed={sidebarSubscribed}
              onSidebarSubscribe={() =>
                handleNewsletter(
                  sidebarEmail,
                  sidebarPhone,
                  setSidebarSubmitting,
                  setSidebarSubscribed
                )
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
      <div className="min-h-screen font-meta" style={{ background: 'hsl(var(--background))' }}>
        <SEO
          title="Updates & Articles"
          description="Perspectives on governance, youth empowerment, diaspora engagement and the future of Ghana from within The Base Movement."
          canonical="/blog"
        />
        <PublicHero />

        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 md:mt-16 pb-16">
          {error && (
            <Banner
              variant="error"
              title="Failed to load articles."
              body="Check your connection and try refreshing the page."
              style={{ marginBottom: 20 }}
            />
          )}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Skeleton variant="img" height={300} style={{ borderRadius: 'var(--radius-lg)' }} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Skeleton variant="img" height={150} />
                    <Skeleton variant="chip" width={70} />
                    <Skeleton variant="text-lg" width="85%" />
                    <Skeleton variant="text-sm" />
                    <Skeleton variant="text-sm" width="60%" />
                  </div>
                ))}
              </div>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="article"
              title="No articles yet."
              body="Stories and updates will appear here once published."
              style={{ maxWidth: 480, margin: '0 auto' }}
            />
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

              {featured && <PublicFeaturedPost post={featured} baseUrl={baseUrl} />}

              <section>
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/3">
                    {rest.length > 0 && (
                      <>
                        <h2
                          className="font-medium tracking-tight mb-5 text-base"
                          style={{ color: 'hsl(var(--on-surface))' }}
                        >
                          Latest articles
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
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
                    publicPhone={publicPhone}
                    onPublicPhoneChange={setPublicPhone}
                    publicSubmitting={publicSubmitting}
                    publicSubscribed={publicSubscribed}
                    onPublicSubscribe={() =>
                      handleNewsletter(
                        publicEmail,
                        publicPhone,
                        setPublicSubmitting,
                        setPublicSubscribed
                      )
                    }
                  />
                </div>
              </section>

              {/* Mobile newsletter — below articles, above CTA, desktop-only sidebar handles this */}
              <div
                className="lg:hidden mt-10 p-6"
                style={{
                  background: '#181d19',
                  borderLeft: '4px solid hsl(var(--accent))',
                  color: '#fff',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                  disabled={publicSubscribed}
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
                <input
                  aria-label="Phone number for SMS"
                  type="tel"
                  placeholder="Phone number for SMS (optional)"
                  value={publicPhone}
                  onChange={(e) => setPublicPhone(e.target.value)}
                  disabled={publicSubscribed}
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
                  onClick={() =>
                    handleNewsletter(
                      publicEmail,
                      publicPhone,
                      setPublicSubmitting,
                      setPublicSubscribed
                    )
                  }
                  disabled={publicSubmitting || publicSubscribed}
                  style={{
                    width: '100%',
                    height: 40,
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {publicSubmitting
                    ? 'Subscribing…'
                    : publicSubscribed
                      ? 'Subscribed'
                      : 'Subscribe'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <WingDivider />

      <PublicCTA />
    </>
  )
}
