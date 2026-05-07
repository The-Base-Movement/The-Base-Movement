import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { BlogPostCard } from '@/components/BlogPostCard'
import { adminService, type BlogPost } from '@/services/adminService'
import { Helmet } from 'react-helmet-async'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const baseUrl = isDashboard ? '/dashboard/blog' : '/blog'

  useEffect(() => {
    let isMounted = true
    async function fetchPosts() {
      setLoading(true)
      try {
        const data = await adminService.getBlogPosts()
        if (isMounted) setPosts(data)
      } catch (err) {
        console.error('Failed to fetch blog posts:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchPosts()
    return () => { isMounted = false }
  }, [])

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]
  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)
  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="bg-surface-warm font-body-md min-h-screen">
      <Helmet>
        <title>Updates | The Base Movement</title>
        <meta name="description" content="Perspectives on governance, youth empowerment, diaspora engagement and the future of Ghana from within The Base Movement." />
        <meta property="og:title" content="Updates | The Base Movement" />
        <meta property="og:description" content="Ideas, analysis and updates from The Base." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero */}
      <section className="bg-charcoal-dark text-white py-20 px-8 border-b-4 border-[var(--brand-green)]">
        <div className="max-w-[1280px] mx-auto">
          <p className="font-meta text-warm-gold tracking-tight text-[12px] mb-3">The Base Insights</p>
          <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4 max-w-2xl">
            Ideas, analysis & movement news
          </h1>
          <p className="text-slate-400 max-w-xl text-base">
            Perspectives from within the movement on governance, youth empowerment, diaspora engagement and the future of Ghana.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-8 py-16">

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "shadow-md" : "text-slate-500 hover:border-brand-green hover:text-brand-green"}
            >
              {cat}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            <p className="text-[10px] font-bold tracking-tight text-stone-400">Loading insights...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-sm font-bold text-stone-400 tracking-tight">No insights published yet.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <section className="mb-16">
                <p className="font-meta text-xs text-warm-gold tracking-tight mb-6">Featured</p>
                <div className="grid md:grid-cols-2 gap-0 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="h-64 md:h-auto overflow-hidden bg-stone-100">
                    {featured.imageUrl ? (
                      <img src={featured.imageUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                       decoding="async" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />
                        <img src="/logo.png" alt="The Base" className="w-16 h-16 opacity-20 mb-4 grayscale" />
                        <span className="text-[10px] font-bold text-white/20 tracking-tight">The Base Editorial</span>
                      </div>
                    )}
                  </div>
                  <div className="p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-tight border transition-all duration-300 ${
                        featured.category === 'Impact' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                        featured.category === 'Diaspora' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        featured.category === 'Digital Strategy' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        featured.category === 'Events' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-stone-50 text-stone-500 border-stone-100'
                      }`}>
                        {featured.category}
                      </span>
                      <span className="mx-2 text-stone-300 opacity-50">|</span>
                      <span className="text-xs text-slate-400 font-meta font-medium">
                        {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <Link to={`${baseUrl}/${featured.slug}`}>
                      <h2 className="text-xl md:text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-4 hover:text-brand-green transition-colors">
                        {featured.title}
                      </h2>
                    </Link>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">{featured.excerpt}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-[10px] font-medium text-stone-400 tracking-tight">
                        {featured.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : featured.authorName} <span className="mx-2 opacity-50">|</span> {featured.readTime}
                      </div>
                      <Button asChild variant="link" className="p-0 h-auto text-brand-green">
                        <Link to={`${baseUrl}/${featured.slug}`} className="flex items-center gap-2">
                          Read article
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* All Posts Grid & Sidebar */}
            {rest.length > 0 && (
              <section>
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/3">
                    <h2 className="text-stone-900 font-bold tracking-tight mb-6">Latest articles</h2>
                    <div className="grid sm:grid-cols-2 gap-8">
                      {rest.map((post) => (
                        <BlogPostCard
                          key={post.id}
                          post={post}
                          baseUrl={baseUrl}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <aside className="lg:w-1/3 space-y-12">
                    <div>
                      <h2 className="text-stone-900 font-bold tracking-tight mb-6">Categories</h2>
                      <div className="bg-white border border-slate-200 p-8 space-y-2">
                        {categories.filter(c => c !== 'All').map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className="w-full flex items-center justify-between p-3 text-xs font-bold tracking-tight text-slate-600 hover:bg-slate-50 hover:text-brand-green transition-all group"
                          >
                            {cat}
                            <span className="text-[10px] text-slate-300 font-meta group-hover:text-brand-green transition-colors">
                              {posts.filter(p => p.category === cat).length} Posts
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
                      <h4 className="font-meta font-bold text-lg tracking-tight mb-4">The Base Weekly</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        Get the movement's authoritative policy briefs and news delivered directly to your inbox every week.
                      </p>
                      <div className="space-y-3">
                        <input
                          type="email"
                          placeholder="Email Address"
                          className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-colors rounded-sm"
                        />
                        <Button variant="primary" className="w-full h-12">
                          Subscribe
                        </Button>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        <section className="mt-20 py-16 px-12 bg-charcoal-dark text-white text-center border-l-4 border-brand-green">
          <p className="font-meta text-warm-gold tracking-tight text-[12px] mb-3">Join the conversation</p>
          <h2 className="font-meta font-bold text-3xl tracking-tight mb-4">Become a member. Shape the narrative.</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
            Registered members get early access to analysis, policy briefs and updates directly from our research desk.
          </p>
          <Button asChild variant="gold" size="lg" className="h-14 px-10">
            <Link to="/register">
              Join The Base
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
