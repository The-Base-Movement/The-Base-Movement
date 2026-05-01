import { Link } from 'react-router-dom'

const posts = [
  {
    id: 1,
    category: 'Movement',
    date: 'April 28, 2026',
    title: 'Ghana First: Why Civic Participation Has Never Mattered More',
    excerpt:
      'As Ghana faces mounting economic pressure, the call for organised, disciplined citizen action has never been louder. Here is why The Base believes collective effort is the only path forward.',
    author: 'The Base Editorial',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1589519160732-576f165b9aad?w=800&q=80',
  },
  {
    id: 2,
    category: 'Youth',
    date: 'April 22, 2026',
    title: 'Jobs, Skills and the Next Generation: Our Policy Position',
    excerpt:
      'Youth unemployment in Ghana sits at a critical juncture. The Base outlines a comprehensive position on technical education, apprenticeships, and entrepreneurship incentives.',
    author: 'Policy Desk',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
  },
  {
    id: 3,
    category: 'Diaspora',
    date: 'April 15, 2026',
    title: 'How Ghanaians Abroad Are Reshaping the Movement',
    excerpt:
      'From London to Toronto, diaspora members are not just sending remittances — they are becoming the organisational backbone of a nationwide civic transformation.',
    author: 'Diaspora Desk',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  },
  {
    id: 4,
    category: 'Integrity',
    date: 'April 8, 2026',
    title: 'Accountability Starts at Home: Building a Culture of Discipline',
    excerpt:
      'Systemic change requires individual transformation first. The Base\'s framework for civic virtue starts with personal accountability before demanding it from public officers.',
    author: 'The Base Editorial',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
  },
  {
    id: 5,
    category: 'Economy',
    date: 'March 30, 2026',
    title: "Ghana's Resource Wealth and Who It Should Serve",
    excerpt:
      'Gold, bauxite, cocoa — Ghana is rich. Yet millions remain below the poverty line. The Base examines why resource revenue must be restructured for people-first outcomes.',
    author: 'Research Unit',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
  },
  {
    id: 6,
    category: 'Community',
    date: 'March 21, 2026',
    title: 'The Power of Local Chapters: Building from the Ground Up',
    excerpt:
      'National change flows from community roots. A look at how The Base chapter model is driving tangible development from Tamale to Takoradi.',
    author: 'Field Reports',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80',
  },
]

const categoryColors: Record<string, string> = {
  Movement: 'bg-brand-green/10 text-brand-green',
  Youth: 'bg-blue-50 text-blue-700',
  Diaspora: 'bg-purple-50 text-purple-700',
  Integrity: 'bg-amber-50 text-amber-700',
  Economy: 'bg-orange-50 text-orange-700',
  Community: 'bg-emerald-50 text-emerald-700',
}

export default function Blog() {
  const [featured, ...rest] = posts

  return (
    <div className="bg-surface-warm font-body-md min-h-screen">
      {/* Hero */}
      <section className="bg-charcoal-dark text-white py-20 px-8 border-b-4 border-brand-green">
        <div className="max-w-[1280px] mx-auto">
          <p className="font-meta text-warm-gold uppercase tracking-widest text-sm mb-3">The Base — Insights</p>
          <h1 className="font-meta font-black text-4xl md:text-5xl uppercase tracking-tight leading-tight mb-4 max-w-2xl">
            Ideas, Analysis &amp; Movement News
          </h1>
          <p className="text-slate-400 max-w-xl text-base">
            Perspectives from within the movement on governance, youth empowerment, diaspora engagement and the future of Ghana.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-8 py-16">

        {/* Featured Post */}
        <section className="mb-16">
          <p className="font-meta text-xs text-warm-gold uppercase tracking-widest mb-6">Featured</p>
          <div className="grid md:grid-cols-2 gap-0 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="h-64 md:h-auto overflow-hidden">
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-meta font-bold uppercase tracking-wider ${categoryColors[featured.category] ?? ''}`}>
                  {featured.category}
                </span>
                <span className="text-xs text-slate-400 font-meta">{featured.date}</span>
              </div>
              <Link to={`/blog/${featured.id}`}>
                <h2 className="font-meta font-black text-2xl text-charcoal-dark uppercase tracking-tight leading-tight mb-4 hover:text-brand-green transition-colors">
                  {featured.title}
                </h2>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs font-meta text-slate-400 uppercase tracking-wider">
                  {featured.author} · {featured.readTime}
                </div>
                <Link
                  to={`/blog/${featured.id}`}
                  className="flex items-center gap-1.5 text-xs font-meta font-bold text-brand-green uppercase tracking-wider hover:underline"
                >
                  Read Article
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* All Posts Grid & Sidebar */}
        <section>
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3">
              <p className="font-meta text-xs text-warm-gold uppercase tracking-widest mb-6">Latest Articles</p>
              <div className="grid sm:grid-cols-2 gap-8">
                {rest.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full"
                  >
                    <div className="h-44 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-meta font-bold uppercase tracking-wider ${categoryColors[post.category] ?? ''}`}>
                          {post.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-meta">{post.date}</span>
                      </div>
                      <Link to={`/blog/${post.id}`}>
                        <h3 className="font-meta font-black text-base text-charcoal-dark uppercase tracking-tight leading-tight mb-3 hover:text-brand-green transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-slate-500 text-xs leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                        <span className="text-[10px] font-meta text-slate-400 uppercase tracking-wider">{post.readTime}</span>
                        <Link
                          to={`/blog/${post.id}`}
                          className="text-[10px] font-meta font-bold text-brand-green uppercase tracking-wider hover:underline flex items-center gap-1"
                        >
                          Read
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-1/3 space-y-12">
              <div>
                <p className="font-meta text-xs text-warm-gold uppercase tracking-widest mb-6">Categories</p>
                <div className="bg-white border border-slate-200 p-8 space-y-2">
                  {Object.keys(categoryColors).map((cat) => (
                    <button 
                      key={cat} 
                      className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-brand-green transition-all group"
                    >
                      {cat}
                      <span className="text-[10px] text-slate-300 font-meta group-hover:text-brand-green transition-colors">12 Posts</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
                <h4 className="font-meta font-black text-lg uppercase tracking-tight mb-4">The Base Weekly</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Get the movement's authoritative policy briefs and news delivered directly to your inbox every week.
                </p>
                <div className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-colors"
                  />
                  <Button className="w-full bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold uppercase tracking-widest h-12">
                    Subscribe
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Pagination */}
        <div className="mt-12 flex justify-center items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-brand-green text-white font-meta font-bold">1</button>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-meta font-bold">2</button>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-meta font-bold">3</button>
          <span className="text-slate-400 px-2 font-meta">...</span>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-meta font-bold">8</button>
          <button className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>chevron_right</span>
          </button>
        </div>

        {/* CTA */}
        <section className="mt-20 py-16 px-12 bg-charcoal-dark text-white text-center border-l-4 border-brand-green">
          <p className="font-meta text-warm-gold uppercase tracking-widest text-sm mb-3">Join the Conversation</p>
          <h2 className="font-meta font-black text-3xl uppercase tracking-tight mb-4">Become a Member. Shape the Narrative.</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
            Registered members get early access to analysis, policy briefs and movement updates directly from our research desk.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-brand-green text-white font-meta font-bold uppercase tracking-widest px-8 py-4 hover:opacity-90 transition-all active:scale-95"
          >
            Join The Base
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>arrow_forward</span>
          </Link>
        </section>
      </div>
    </div>
  )
}
