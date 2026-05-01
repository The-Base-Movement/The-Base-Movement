import { useParams, Link } from 'react-router-dom'
import { Calendar, User, Clock, ChevronLeft, Share2, MessageSquare, Facebook, Mail, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'

// Mock data for the authoritative blog post
const blogPost = {
  id: '1',
  title: "The Industrialization of Ghana: A Vision for Sustainable Youth Employment",
  excerpt: "Discover the movement's comprehensive roadmap for transforming Ghana into an industrial powerhouse, focused on creating millions of high-quality jobs for the youth.",
  content: `
    <p>The prosperity of any nation lies in its ability to transform raw materials into finished goods. For too long, Ghana has relied on the export of primary resources, leaving our youth vulnerable to global price fluctuations and limited employment opportunities. "The Base" movement believes that industrialization is not just an economic strategy; it is a moral imperative for national survival.</p>
    
    <h3>1. The Foundation of Our Economic Agenda</h3>
    <p>Our agenda, "Ghana First," prioritizes the establishment of regional industrial hubs. These hubs are designed to leverage local resources—from the lithium deposits in Mfantseman to the vast agricultural potential of the Northern regions—to build a self-reliant economy.</p>
    
    <h3>2. Modernizing Agriculture through Technology</h3>
    <p>Agriculture remains the backbone of our society, but it requires a technological revolution. By integrating high-tech irrigation systems and establishing state-of-the-art processing plants, we can ensure food security and create an agricultural value chain that employs thousands of young professionals.</p>
    
    <blockquote>"We are not just building factories; we are building the character of a new Ghana—one that is disciplined, innovative, and unapologetically ambitious."</blockquote>
    
    <h3>3. The Role of the Youth in National Transformation</h3>
    <p>The youth are not the leaders of tomorrow; they are the catalysts of today. Our platform provides the training, resources, and institutional support necessary for young Ghanaians to take charge of the industrial landscape. Through "The Base," we are fostering a generation of creators, not just consumers.</p>
    
    <p>Join us as we embark on this historic journey. Together, we will build a Ghana that works for every citizen, where every young person has the opportunity to thrive and contribute to our collective greatness.</p>
  `,
  author: "Dr. George Oti Bonsu",
  authorRole: "Founder, The Base",
  date: "October 28, 2024",
  readTime: "8 min read",
  category: "Policy & Agenda",
  image: "/hero-bg.png",
  tags: ["Industrialization", "Youth Employment", "Ghana First", "Economic Reform"]
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>()

  // In a real app, you would fetch the post by id. Here we use the mock data.
  const post = blogPost

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Top Reading Progress (additional to global one for emphasis) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#CE1126] via-[#DAA520] to-[#006B3F] sticky top-[72px] z-40"></div>

      <main className="max-w-[1000px] mx-auto px-6 md:px-8 pt-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link 
            to="/blog" 
            className="flex items-center gap-2 text-stone-400 hover:text-brand-green transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Insights
          </Link>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-10 px-4 border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none text-[10px] font-bold uppercase tracking-widest">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" className="h-10 w-10 p-0 border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <article className="space-y-12">
          {/* Header */}
          <header className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-widest">
                {post.category}
              </span>
              <div className="flex items-center gap-4 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-stone-900 leading-[1.1] tracking-tighter font-meta">
              {post.title}
            </h1>
            
            <p className="text-xl text-stone-500 leading-relaxed font-medium italic border-l-4 border-warm-gold pl-6 py-2">
              {post.excerpt}
            </p>
          </header>

          {/* Featured Image */}
          <div className="relative aspect-[21/9] overflow-hidden border border-stone-200">
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-charcoal-dark/10"></div>
          </div>

          {/* Content & Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Sidebar: Author Info */}
            <aside className="lg:col-span-3 space-y-8 order-2 lg:order-1">
              <div className="sticky top-32 space-y-8">
                <div className="p-6 border border-stone-100 bg-stone-50/50 space-y-4">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Authored By</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-charcoal-dark rounded-none flex items-center justify-center text-warm-gold text-lg font-black">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900 leading-none">{post.author}</p>
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-1.5">{post.authorRole}</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed pt-2">
                    Committed to the industrialization and economic transformation of Ghana through disciplined leadership.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Share this Insight</p>
                  <div className="flex gap-2">
                    {[Facebook, MessageSquare, Mail].map((Icon, i) => (
                      <Button key={i} variant="outline" className="h-10 w-10 p-0 border-stone-200 text-stone-500 hover:text-brand-green hover:border-brand-green rounded-none">
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Body */}
            <div className="lg:col-span-9 order-1 lg:order-2">
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
                  <span key={tag} className="px-3 py-1.5 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-green/10 hover:text-brand-green cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Engagement Call to Action */}
              <div className="mt-20 p-10 bg-charcoal-dark text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold font-meta tracking-tight mb-2">Build the Future Together</h3>
                    <p className="text-stone-400 text-sm">Join "The Base" movement and be a part of Ghana's industrial revolution.</p>
                  </div>
                  <Link to="/register">
                    <Button className="bg-brand-green hover:bg-brand-green/90 text-white font-bold tracking-widest text-xs h-14 px-10 rounded-none uppercase">
                      Register as a Member
                    </Button>
                  </Link>
                </div>
                <div className="mt-10 flex h-1 w-full">
                  <div className="flex-1 bg-[#CE1126]"></div>
                  <div className="flex-1 bg-[#DAA520]"></div>
                  <div className="flex-1 bg-[#006B3F]"></div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
