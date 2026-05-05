import { useState, useEffect } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Clock, Share2, Facebook, Mail, Bookmark, ChevronRight, Linkedin, Send } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { CommentSection } from '@/components/CommentSection'
import { adminService, type BlogPost as BlogPostType } from '@/services/adminService'
import { Loader2 } from 'lucide-react'
import { Helmet } from 'react-helmet-async'


export default function BlogPost() {
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
        if (data) {
          setPost(data)
        }
        const allPosts = await adminService.getBlogPosts()
        setRelatedPosts(allPosts.filter(p => p.slug !== slug).slice(0, 3))
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
    
    let shareUrl = ""
    switch(platform) {
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
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        break
      default:
        if (navigator.share) {
          navigator.share({ title, url }).catch(() => {})
        } else {
          navigator.clipboard.writeText(url)
          alert("Link copied to clipboard")
        }
        return
    }
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[var(--brand-green)] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Loading Insight File...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <>
        <Helmet>
          <title>Insight Not Found | The Base Movement</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <p className="text-sm font-bold text-stone-500 uppercase tracking-widest text-center">
            Insight not found or has been moved to the vault.
          </p>
          <Button onClick={() => navigate(baseUrl)} variant="primary" className="h-11 px-8 rounded-none uppercase text-[10px] font-bold tracking-widest">
            Return to Blog
          </Button>
        </div>
      </>
    )
  }

  const pageTitle = post.seoTitle || post.title
  const pageDescription = post.metaDescription || post.excerpt || `Read "${post.title}" on The Base Movement.`
  const canonicalUrl = `${window.location.origin}/blog/${post.slug}`

  return (
    <div className="min-h-screen bg-white pb-20">
      <Helmet>
        <title>{pageTitle} | The Base Movement</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {post.imageUrl && <meta property="og:image" content={post.imageUrl} />}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <main className="max-w-[1280px] mx-auto px-6 md:px-8 pt-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Breadcrumbs currentLabel={post.title} />
          <div className="flex items-center gap-3">
             <Button 
              onClick={() => handleShare()}
              variant="outline" 
              className="h-10 px-4 border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none text-[10px] font-bold uppercase tracking-widest"
             >
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" className="h-10 w-10 p-0 border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <article className="space-y-12">
          {/* Header */}
          <header className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-[var(--brand-green)]/10 text-[var(--brand-green)] text-[10px] font-bold uppercase tracking-widest">
                {post.category}
              </span>
              <div className="flex items-center gap-4 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
              </div>
            </div>
            
            <h1 className="text-stone-900 leading-[1.1] tracking-tighter mb-0">
              {post.title}
            </h1>
            
            <p className="text-stone-500 leading-relaxed font-medium italic border-l-4 border-warm-gold pl-6 py-2 mb-0">
              {post.excerpt}
            </p>
          </header>

          {/* Featured Image */}
          <div className="relative aspect-[21/9] overflow-hidden border border-stone-200">
            <img 
              src={post.imageUrl || '/hero-bg.png'} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-charcoal-dark/10"></div>
          </div>

          {/* Content & Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
            {/* Left Sidebar: Author Info */}
            <aside className="lg:col-span-1 space-y-8 order-2 lg:order-1">
              <div className="sticky top-32 space-y-8">
                <div className="p-6 border border-stone-100 bg-stone-50/50 space-y-4">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0">Authored By</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.authorImage || '/founder.jpg'} 
                      alt={post.authorName} 
                      className="w-12 h-12 bg-charcoal-dark rounded-none object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-900 leading-none mb-0">{post.authorName}</p>
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-1.5 mb-0">{post.authorRole}</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed pt-2 mb-0">
                    {post.authorBio}
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Share this Insight</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { brandColor: '#1877F2', key: 'facebook', icon: <Facebook className="w-4 h-4" /> },
                      { brandColor: '#000000', key: 'twitter', icon: (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                        </svg>
                      ) },
                      { brandColor: '#0A66C2', key: 'linkedin', icon: <Linkedin className="w-4 h-4" /> },
                      { brandColor: '#25D366', key: 'whatsapp', icon: (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      ) },
                      { brandColor: '#24A1DE', key: 'telegram', icon: <Send className="w-4 h-4" /> },
                      { brandColor: '#71717a', key: 'email', icon: <Mail className="w-4 h-4" /> }
                    ].map(({ brandColor, key, icon }, i) => (
                      <Button 
                        key={i} 
                        onClick={() => handleShare(key)}
                        variant="outline" 
                        style={{ color: brandColor, borderColor: `${brandColor}20` }}
                        className="h-12 w-full p-0 border hover:bg-stone-50 rounded-none transition-all duration-300 hover:scale-105"
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-stone-100 space-y-6">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0">Explore Categories</p>
                  <div className="space-y-2">
                    {['Movement', 'Youth', 'Diaspora', 'Integrity', 'Economy', 'Community'].map((cat) => (
                      <Link 
                        to={`/blog?category=${cat.toLowerCase()}`} 
                        key={cat} 
                        className="flex items-center justify-between p-3 bg-stone-50/50 border border-transparent hover:border-stone-200 hover:bg-white text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:text-[var(--brand-green)] transition-all"
                      >
                        {cat}
                        <ChevronRight className="w-3 h-3 text-stone-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Body */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div 
                className="prose prose-stone prose-lg max-w-none 
                  prose-headings:font-meta prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-stone-900
                  prose-p:text-stone-600 prose-p:leading-relaxed prose-p:mb-8
                  prose-blockquote:border-l-brand-green prose-blockquote:bg-stone-50 prose-blockquote:p-8 prose-blockquote:font-bold prose-blockquote:text-stone-900 prose-blockquote:italic
                  prose-strong:text-stone-900 prose-strong:font-bold"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              
              {/* Tags & Footer */}
              <div className="mt-16 pt-8 border-t border-stone-100 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--brand-green)]/10 hover:text-[var(--brand-green)] cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>

              <CommentSection />

              {/* Engagement Call to Action */}
              <div className="mt-24 p-10 bg-charcoal-dark text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-green)]/10 -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-white tracking-tight mb-2">Build the Future Together</h2>
                    <p className="text-stone-400 mb-0">Join "The Base" movement and be a part of Ghana's industrial revolution.</p>
                  </div>
                  <Link to="/register">
                    <Button className="bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-bold tracking-widest text-xs h-14 px-10 rounded-none uppercase">
                      Register as a Member
                    </Button>
                  </Link>
                </div>
                <div className="mt-10 flex h-1 w-full">
                  <div className="flex-1 bg-[var(--brand-red)]"></div>
                  <div className="flex-1 bg-[var(--brand-gold)]"></div>
                  <div className="flex-1 bg-[var(--brand-green)]"></div>
                </div>
              </div>

              {/* Related Insights Section */}
              <div className="mt-24">
                <p className="text-[10px] font-bold text-warm-gold uppercase tracking-widest mb-10">Related Insights</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedPosts.map((related) => (
                    <Link to={`${baseUrl}/${related.slug}`} key={related.id} className="block group">
                      <article className="group cursor-pointer">
                        <div className="aspect-[16/10] overflow-hidden border border-stone-200 mb-4 relative">
                          <img src={related.imageUrl || '/hero-bg.png'} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-green)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </div>
                        <span className="text-[9px] font-bold text-[var(--brand-green)] uppercase tracking-widest mb-0">{related.category}</span>
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
