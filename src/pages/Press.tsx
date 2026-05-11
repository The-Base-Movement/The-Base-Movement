import { useState, useEffect } from 'react'
import { Newspaper, FileText, Download, Mail, ExternalLink, ArrowRight, X, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { adminService } from '@/services/adminService'
import type { PressRelease, MediaKitAsset } from '@/types/admin'
import SEO from '@/components/SEO'



export default function Press() {
  const [releases, setReleases] = useState<PressRelease[]>([])
  const [mediaKit, setMediaKit] = useState<MediaKitAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRelease, setSelectedRelease] = useState<PressRelease | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [prData, mkData] = await Promise.all([
          adminService.getPressReleases(),
          adminService.getMediaKitAssets()
        ])
        setReleases(prData)
        setMediaKit(mkData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  return (
    <main className="bg-stone-50/50 min-h-screen pb-24">
      <SEO 
        title="Press Center"
        description="Authoritative updates, media assets, and official statements from The Base Movement's communication desk."
        canonical="/press"
      />
      {/* Hero */}
      <header className="bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10">
          <Breadcrumbs />
          <p className="font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6">Media & communications</p>
          <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Press <span className="text-brand-green">center</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl font-body-md">
            Authoritative updates, media assets, and official statements from The Base Movement's communication desk.
          </p>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="font-meta font-bold text-2xl tracking-tight mb-8 flex items-center gap-3">
                <Newspaper className="w-6 h-6 text-brand-green" />
                Latest press releases
              </h2>
              
              <div className="space-y-8">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-stone-300">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-micro font-bold tracking-tight">Scanning dispatch desk...</p>
                  </div>
                ) : releases.length > 0 ? (
                  releases.map((pr) => (
                    <div key={pr.id} className="bg-white p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-bold tracking-tight rounded-sm">
                          {pr.category}
                        </span>
                        <span className="text-tiny text-slate-400 font-medium tracking-tight">
                          {new Date(pr.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-charcoal-dark mb-4 group-hover:text-brand-green transition-colors">
                        {pr.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                        {pr.excerpt}
                      </p>
                      <Button variant="link" className="p-0 h-auto text-brand-green" onClick={() => setSelectedRelease(pr)}>
                        View full release
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 border-2 border-dashed border-slate-100 text-center">
                    <Newspaper className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-bold tracking-tight">No active dispatches found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Media Contact */}
            <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
              <h3 className="font-meta font-bold text-xl tracking-tight mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-warm-gold" />
                Media inquiries
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                For interview requests, official commentary, or verified data inquiries, contact our communications team.
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-micro font-bold tracking-tight text-slate-500 mb-1">General press</p>
                  <p className="text-sm font-bold">press@thebasemovement.org</p>
                </div>
                <div>
                  <p className="text-micro font-bold tracking-tight text-slate-500 mb-1">Global diaspora</p>
                  <p className="text-sm font-bold">diaspora.media@thebasemovement.org</p>
                </div>
              </div>
            </div>

            {/* Media Kit */}
            <div className="bg-white p-8 border border-slate-100 shadow-sm">
              <h3 className="font-meta font-bold text-xl tracking-tight mb-4 flex items-center gap-2 text-charcoal-dark">
                <Download className="w-5 h-5 text-brand-green" />
                Media kit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Download official brand assets, leadership bios, and movement backgrounders for editorial use.
              </p>
              <div className="space-y-3">
                {mediaKit.length > 0 ? (
                  mediaKit.map((asset) => (
                    <Button 
                      key={asset.id}
                      variant="ghost" 
                      className="w-full justify-between text-slate-600 border-slate-100 hover:bg-slate-50"
                      onClick={() => window.open(asset.fileUrl, '_blank')}
                    >
                      <div className="flex items-center gap-2">
                        {asset.fileType === 'LOGO' ? <ExternalLink className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        {asset.title}
                      </div>
                      <Download className="w-4 h-4 opacity-50" />
                    </Button>
                  ))
                ) : (
                  <>
                    <Button disabled variant="ghost" className="w-full justify-between text-slate-600 border-slate-100 opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Brand Guidelines
                      </div>
                      <Download className="w-4 h-4 opacity-50" />
                    </Button>
                    <Button disabled variant="ghost" className="w-full justify-between text-slate-600 border-slate-100 opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        High-Res Logos
                      </div>
                      <Download className="w-4 h-4 opacity-50" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* Release Detail Modal */}
      {selectedRelease && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedRelease(null)}>
          <div className="bg-white w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-stone-50/50">
              <div className="pr-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-bold tracking-tight rounded-sm">
                    {selectedRelease.category}
                  </span>
                  <span className="text-tiny text-slate-400 font-medium tracking-tight">
                    {new Date(selectedRelease.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-0">
                  {selectedRelease.title}
                </h2>
              </div>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => setSelectedRelease(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4">
                <p className="font-bold text-charcoal-dark">ACCRA, GHANA — Official Statement</p>
                <p>{selectedRelease.excerpt}</p>
                <p>
                  "The Base Movement remains committed to the principle of collective progress. This milestone/policy reflects our deep engagement with the grassroots and our vision for a sovereign, prosperous nation. We invite all citizens and members of the Diaspora to review the full implications of this development."
                </p>
                <p>
                  For further information or to schedule an interview with movement leadership, please contact the communications desk at press@thebasemovement.org.
                </p>
              </div>
            </div>
            <div className="p-6 bg-stone-50 border-t border-slate-100 text-center">
              <Button variant="primary" onClick={() => setSelectedRelease(null)}>
                Close Release
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
