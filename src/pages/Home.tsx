import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Globe } from 'lucide-react'

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  const getColor = (val: number) => {
    if (val <= 100000) return '#CE1126' // Red
    if (val <= 200001) return '#DAA520' // Gold
    return '#006B3F' // Green
  }

  return (
    <div ref={ref} className="text-6xl md:text-[5rem] font-meta font-black tracking-tighter transition-colors duration-300" style={{ color: getColor(count) }}>
      {count.toLocaleString()}
    </div>
  )
}

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <main className="bg-surface-warm font-body-md">
      {/* Hero Section */}
      <section 
        className="relative bg-charcoal-dark text-white pt-32 pb-32 md:pt-40 md:pb-40 overflow-hidden border-b-[8px] border-warm-gold group"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity transition-opacity duration-1000 group-hover:opacity-20" style={{ backgroundImage: "url('/hero-bg.png')" }}></div>
        
        {/* Color Spotlight */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
          style={{ 
            backgroundImage: "url('/hero-bg.png')",
            WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
          }}
        ></div>

        <div className="absolute inset-0 z-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/60 to-transparent"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-h1 font-meta font-black mb-6 leading-[1.1] tracking-tighter uppercase">
              Ghana First,<br />Jobs for the youth!
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-10 leading-relaxed font-body-md mx-auto md:mx-0">
              A global political movement uniting people worldwide to build a stronger, more prosperous Ghana.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link to="/register" className="bg-[#CE1126] hover:bg-[#b30f20] text-white font-meta font-bold uppercase tracking-wider px-10 py-5 flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 shadow-lg w-full sm:w-auto">
                Register Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/our-agenda" className="border-2 border-white/30 text-white hover:bg-white hover:text-charcoal-dark font-meta font-bold uppercase tracking-wider px-10 py-5 transition-all w-full sm:w-auto text-center">
                Read the Agenda
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end opacity-90 relative">
            <img src="/logo.png" alt="The Base" className="w-64 md:w-96 drop-shadow-2xl transition-all duration-700" />
          </div>
        </div>
      </section>

      {/* Ghana vs Diaspora - Stark architectural blocks */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24">
            <div className="border-t-[4px] border-brand-green pt-8 group">
              <h3 className="text-h3 font-meta font-black text-charcoal-dark mb-4 flex items-center gap-3 uppercase tracking-tight">
                <MapPin className="text-brand-green w-8 h-8" /> Base Ghana
              </h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-body-md">
                For Ghanaians living in Ghana. Join our grassroots movement and make your voice heard in the development of our great nation.
              </p>
              <Link to="/register?platform=GHANA" className="inline-flex items-center gap-2 text-brand-green font-meta font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity">
                Register for Base Ghana <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="border-t-[4px] border-warm-gold pt-8 group">
              <h3 className="text-h3 font-meta font-black text-charcoal-dark mb-4 flex items-center gap-3 uppercase tracking-tight">
                <Globe className="text-warm-gold w-8 h-8" /> Base Diaspora
              </h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-body-md">
                For Ghanaians and friends of Ghana living abroad. Stay connected and contribute to Ghana's progress from anywhere in the world.
              </p>
              <Link to="/register?platform=DIASPORA" className="inline-flex items-center gap-2 text-warm-gold font-meta font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity">
                Register for Base Diaspora <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vision, Mission, Values - Editorial Grid */}
      <section className="py-24 bg-charcoal-dark text-white border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-meta font-black leading-tight mb-6 uppercase tracking-tighter">
              Our Foundation
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="border-l-2 border-[#CE1126] pl-6">
              <span className="text-[var(--brand-red)] font-meta font-bold tracking-widest uppercase text-xs mb-3 block">Our Mission</span>
              <h3 className="text-2xl font-meta font-bold mb-4 uppercase tracking-tight text-white">Actionable Agenda</h3>
              <p className="text-slate-400 leading-relaxed font-body-md text-sm">
                To deliver an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians, covering education, governance, industrialisation, infrastructure, institutional reform, and agriculture.
              </p>
            </div>
            <div className="border-l-2 border-warm-gold pl-6">
              <span className="text-warm-gold font-meta font-bold tracking-widest uppercase text-xs mb-3 block">Our Values</span>
              <h3 className="text-2xl font-meta font-bold mb-4 uppercase tracking-tight text-white">Patriotism, Honesty, Discipline</h3>
              <p className="text-slate-400 leading-relaxed font-body-md text-sm">
                We are guided by love of country, transparency in leadership, and the moral courage to do what is right for Ghana.
              </p>
            </div>
            <div className="border-l-2 border-brand-green pl-6">
              <span className="text-brand-green font-meta font-bold tracking-widest uppercase text-xs mb-3 block">Our Vision</span>
              <h3 className="text-2xl font-meta font-bold mb-4 uppercase tracking-tight text-white">A Transformed Nation</h3>
              <p className="text-slate-400 leading-relaxed font-body-md text-sm">
                A Ghana with quality education, lean accountable government, industrialisation, tourism, and agro-processing, quality infrastructure, comprehensive institutional reform, and expertise-led agriculture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Stark Typography */}
      <section className="py-24 md:py-32 bg-surface-warm border-y border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 md:gap-8 items-center">
            <div className="pl-8 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" />
              <AnimatedCounter target={355482} />
              <p className="text-xl text-slate-500 mt-4 uppercase tracking-widest font-meta font-bold">Citizens Joined</p>
            </div>
            <div className="pl-8 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" />
              <AnimatedCounter target={2} />
              <p className="text-xl text-slate-500 mt-4 uppercase tracking-widest font-meta font-bold">Global Platforms</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Insights Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-brand-green font-meta font-bold tracking-widest uppercase text-xs mb-3 block">Movement Updates</span>
              <h2 className="text-3xl md:text-h2 font-meta font-black text-charcoal-dark uppercase tracking-tight">Latest Insights</h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-brand-green font-meta font-bold uppercase tracking-widest text-xs hover:underline">
              View All News <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Ghana First: Why Civic Participation Has Never Mattered More",
                date: "April 28, 2026",
                category: "Movement",
                image: "https://images.unsplash.com/photo-1589519160732-576f165b9aad?w=800&q=80"
              },
              {
                title: "Jobs, Skills and the Next Generation: Our Policy Position",
                date: "April 22, 2026",
                category: "Youth",
                image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80"
              },
              {
                title: "How Ghanaians Abroad Are Reshaping the Movement",
                date: "April 15, 2026",
                category: "Diaspora",
                image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
              }
            ].map((news, i) => (
              <Link key={i} to="/blog" className="group">
                <div className="aspect-[16/10] overflow-hidden mb-6 border border-slate-200">
                  <img 
                    src={news.image} 
                    alt={news.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-meta font-bold text-brand-green uppercase tracking-widest">{news.category}</span>
                  <span className="text-[10px] text-slate-400 font-meta">{news.date}</span>
                </div>
                <h3 className="text-lg font-meta font-bold text-charcoal-dark uppercase tracking-tight leading-tight group-hover:text-brand-green transition-colors">
                  {news.title}
                </h3>
              </Link>
            ))}
          </div>

          <Link to="/blog" className="md:hidden flex items-center justify-center gap-2 mt-10 text-brand-green font-meta font-bold uppercase tracking-widest text-xs border border-brand-green py-4">
            View All News <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Decisive CTA Band */}
      <section className="bg-brand-green text-white py-24 md:py-32">
        <div className="max-w-[1280px] mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-[4rem] font-meta font-black mb-6 tracking-tighter uppercase leading-none">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl md:text-2xl text-[#e6f2eb] mb-12 leading-relaxed font-body-md max-w-3xl mx-auto">
            Join over 355,482 people who are building a better future for Ghana. Your voice, your community, your movement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="bg-[var(--brand-red)] hover:bg-[#b30f20] text-white font-meta font-bold uppercase tracking-widest px-12 py-6 text-lg transition-transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3">
              Join The Base <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
