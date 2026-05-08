import { Link } from 'react-router-dom'
import { Home, Search, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/neon-button'
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
          <Search className="w-10 h-10 text-brand-green group-hover:scale-110 transition-transform" />
        </div>

        <p className="font-meta text-brand-green tracking-tight text-xs font-bold mb-4">Error 404</p>
        <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight text-charcoal-dark mb-6">
          Path not found <span className="text-brand-green">.</span>
        </h1>
        
        <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-10 px-4">
          The coordinate you requested does not exist or has been archived within the movement's vault. Let's get you back to the front lines.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="primary" size="lg" className="h-14 px-10 w-full sm:w-auto">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return home
            </Link>
          </Button>
          
          <Button asChild variant="ghost" size="lg" className="h-14 px-10 w-full sm:w-auto border-slate-200">
            <Link to="/blog">
              Browse insights
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Movement Motto */}
      <div className="mt-20 text-center">
        <p className="text-micro font-bold text-slate-300 tracking-tight mb-0">Ghana first • Collective progress</p>
      </div>
    </main>
  )
}
