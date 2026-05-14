import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2, Newspaper } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/neon-button'
import { BlogPostCard } from '@/components/BlogPostCard'
import { adminService, type BlogPost } from '@/services/adminService'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'

export default function Blog() {
  const { settings } = useBranding()
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

  // ── Dashboard layout ──────────────────────────────────────────────────────
  if (isDashboard) {
    return (
      <div className="main">

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              style={{ justifyContent: 'center' }}
            >
              {cat}
              <span style={{ marginLeft: 6, fontWeight: 700, opacity: 0.6, fontSize: 10 }}>
                {cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--primary))', animation: 'spin 1.2s linear infinite' }}>sync</span>
            <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>Loading insights…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))', opacity: 0.3, display: 'block', marginBottom: 8 }}>article</span>
            <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>No insights published yet.</p>
          </div>
        ) : (
          <div className="main-sidebar" style={{ alignItems: 'start' }}>

            {/* Posts column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {featured && (
                <div className="panel" style={{ overflow: 'hidden' }}>
                  {featured.imageUrl && (
                    <div style={{ height: 200, overflow: 'hidden' }}>
                      <img src={featured.imageUrl} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" />
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {featured.category && (
                        <span className="pill pill-ok" style={{ fontSize: 9 }}>{featured.category}</span>
                      )}
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <Link to={`${baseUrl}/${featured.slug}`} style={{ textDecoration: 'none' }}>
                      <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', margin: '0 0 8px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{featured.title}</h2>
                    </Link>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.55, margin: '0 0 14px' }}>{featured.excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {featured.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : featured.authorName} · {featured.readTime}
                      </span>
                      <Link to={`${baseUrl}/${featured.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))', textDecoration: 'none' }}>
                        Read article
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {rest.map(post => (
                    <BlogPostCard key={post.id} post={post} baseUrl={baseUrl} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Categories */}
              <div className="panel">
                <div className="ph"><span>Categories</span></div>
                <div style={{ padding: '0 16px 12px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, marginBottom: 2, background: activeCategory === cat ? 'rgba(0,107,63,0.07)' : 'none', color: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))' }}
                    >
                      <span>{cat === 'All' ? 'All Insights' : cat}</span>
                      <span style={{ fontWeight: 800, fontSize: 10, opacity: 0.5 }}>
                        {cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div style={{ background: '#181d19', borderRadius: 6, padding: 20, borderLeft: '4px solid hsl(var(--accent))' }}>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>The Base Weekly</div>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  Get policy briefs and movement news delivered to your inbox weekly.
                </p>
                <input type="email" placeholder="Email address" style={{ width: '100%', height: 38, padding: '0 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Subscribe</button>
              </div>

            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Public layout (unchanged) ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50/50 font-meta pb-20">
      <SEO
        title="Updates & Insights"
        description="Perspectives on governance, youth empowerment, diaspora engagement and the future of Ghana from within The Base Movement."
        canonical="/blog"
      />
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <Newspaper className="w-10 h-10 text-brand-green" />
              Updates & Insights
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Perspectives from within the movement on governance, youth empowerment, diaspora engagement and the future of Ghana.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            <p className="text-micro font-bold tracking-tight text-stone-400">Loading insights...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-sm font-bold text-stone-400 tracking-tight">No insights published yet.</p>
          </div>
        ) : (
          <>
            {featured && (
              <section className="mb-16">
                <p className="font-meta text-xs text-warm-gold tracking-tight mb-6">Featured</p>
                <div className="grid md:grid-cols-2 gap-0 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="h-64 md:h-auto overflow-hidden bg-stone-100">
                    {featured.imageUrl ? (
                      <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" decoding="async" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative">
                        <img src={settings.logo_url} alt="The Base" className="w-16 h-16 opacity-20 mb-4 grayscale" />
                        <span className="text-micro font-bold text-white/20 tracking-tight">The Base Editorial</span>
                      </div>
                    )}
                  </div>
                  <div className="p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2.5 py-1 rounded-sm text-micro font-bold tracking-tight border bg-stone-50 text-stone-500 border-stone-100">{featured.category}</span>
                      <span className="mx-2 text-stone-300 opacity-50">|</span>
                      <span className="text-xs text-slate-400 font-meta font-medium">
                        {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <Link to={`${baseUrl}/${featured.slug}`}>
                      <h2 className="text-xl md:text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-4 hover:text-brand-green transition-colors">{featured.title}</h2>
                    </Link>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">{featured.excerpt}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-micro font-medium text-stone-400 tracking-tight">
                        {featured.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : featured.authorName} <span className="mx-2 opacity-50">|</span> {featured.readTime}
                      </div>
                      <Button asChild variant="link" className="p-0 h-auto text-brand-green">
                        <Link to={`${baseUrl}/${featured.slug}`} className="flex items-center gap-2">
                          Read article <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section>
              <div className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-2/3">
                  {rest.length > 0 && (
                    <>
                      <h2 className="text-stone-900 font-bold tracking-tight mb-6">Latest articles</h2>
                      <div className="grid sm:grid-cols-2 gap-8">
                        {rest.map(post => <BlogPostCard key={post.id} post={post} baseUrl={baseUrl} />)}
                      </div>
                    </>
                  )}
                </div>
                <aside className="lg:w-1/3 space-y-12 lg:sticky lg:top-8 lg:self-start">
                  <div>
                    <h2 className="text-stone-900 font-bold tracking-tight mb-6">Categories</h2>
                    <div className="bg-white border border-slate-200 p-8 space-y-2">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full flex items-center justify-between p-3 text-xs font-bold tracking-tight transition-all group ${activeCategory === cat ? 'bg-brand-green/10 text-brand-green' : 'text-slate-600 hover:bg-slate-50 hover:text-brand-green'}`}>
                          {cat === 'All' ? 'All Insights' : cat}
                          <span className={`text-micro font-meta transition-colors ${activeCategory === cat ? 'text-brand-green' : 'text-slate-300 group-hover:text-brand-green'}`}>
                            {cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length} Posts
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
                    <h4 className="font-meta font-bold text-lg tracking-tight mb-4">The Base Weekly</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">Get the movement's policy briefs and news delivered directly to your inbox every week.</p>
                    <div className="space-y-3">
                      <input type="email" placeholder="Email Address" className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-colors rounded-sm" />
                      <Button variant="primary" className="w-full h-12">Subscribe</Button>
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          </>
        )}

        <section className="mt-20 py-16 px-12 bg-charcoal-dark text-white text-center border-l-4 border-brand-green">
          <p className="font-meta text-warm-gold tracking-tight text-xs mb-3">Join the conversation</p>
          <h2 className="font-meta font-bold text-3xl tracking-tight mb-4">Become a member. Shape the narrative.</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">Registered members get early access to analysis, policy briefs and updates directly from our research desk.</p>
          <Button asChild variant="gold" size="lg" className="h-14 px-10">
            <Link to="/register">Join The Base <ArrowRight className="w-5 h-5 ml-2" /></Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
