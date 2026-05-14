import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <SEO 
        title="Page Not Found"
        noindex
      />
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 flex">
        <div className="flex-1 bg-brand-red"></div>
        <div className="flex-1 bg-brand-gold"></div>
        <div className="flex-1 bg-brand-green"></div>
      </div>
      
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl"></div>

      <div className="text-center relative z-10 max-w-lg mx-auto">
        <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl flex items-center justify-center mx-auto mb-10 group hover:rotate-6 transition-transform duration-500">
          <span className="material-symbols-outlined text-brand-green group-hover:scale-110 transition-transform" style={{ fontSize: 40 }}>search</span>
        </div>

        <p className="font-meta text-brand-green tracking-tight text-xs font-bold mb-4">Error 404</p>
        <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight text-charcoal-dark mb-6">
          Path not found <span className="text-brand-green">.</span>
        </h1>
        
        <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-10 px-4">
          The coordinate you requested does not exist or has been archived within the movement's vault. Let's get you back to the front lines.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="h-14 px-10 w-full sm:w-auto bg-primary text-white flex items-center justify-center font-bold text-sm gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>home</span>
            Return home
          </Link>

          <Link to="/blog" className="h-14 px-10 w-full sm:w-auto border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm gap-2 hover:bg-slate-50 transition-colors">
            Browse insights
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Movement Motto */}
      <div className="mt-20 text-center">
        <p className="text-micro font-bold text-slate-300 tracking-tight mb-0">Ghana first • Collective progress</p>
      </div>
    </main>
  )
}
