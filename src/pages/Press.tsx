import { useState, useEffect } from 'react'
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
                <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 24 }}>newspaper</span>
                Latest press releases
              </h2>
              
              <div className="space-y-8">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-stone-300">
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
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
                      <button onClick={() => setSelectedRelease(pr)} className="flex items-center gap-2 text-brand-green font-bold text-xs bg-transparent border-none cursor-pointer hover:underline p-0">
                        View full release
                        <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: 16 }}>arrow_forward</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 border-2 border-dashed border-slate-100 text-center">
                    <span className="material-symbols-outlined text-slate-200 block mx-auto mb-4" style={{ fontSize: 48 }}>newspaper</span>
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
                <span className="material-symbols-outlined text-warm-gold" style={{ fontSize: 20 }}>mail</span>
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
                <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 20 }}>download</span>
                Media kit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Download official brand assets, leadership bios, and movement backgrounders for editorial use.
              </p>
              <div className="space-y-3">
                {mediaKit.length > 0 ? (
                  mediaKit.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => window.open(asset.fileUrl, '_blank')}
                      className="w-full flex items-center justify-between text-slate-600 border border-slate-100 hover:bg-slate-50 px-3 py-2 bg-white cursor-pointer text-xs font-medium transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{asset.fileType === 'LOGO' ? 'open_in_new' : 'description'}</span>
                        {asset.title}
                      </div>
                      <span className="material-symbols-outlined opacity-50" style={{ fontSize: 16 }}>download</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button disabled className="w-full flex items-center justify-between text-slate-600 border border-slate-100 opacity-50 cursor-not-allowed px-3 py-2 bg-white text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                        Brand Guidelines
                      </div>
                      <span className="material-symbols-outlined opacity-50" style={{ fontSize: 16 }}>download</span>
                    </button>
                    <button disabled className="w-full flex items-center justify-between text-slate-600 border border-slate-100 opacity-50 cursor-not-allowed px-3 py-2 bg-white text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                        High-Res Logos
                      </div>
                      <span className="material-symbols-outlined opacity-50" style={{ fontSize: 16 }}>download</span>
                    </button>
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
              <button onClick={() => setSelectedRelease(null)} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-white/10 rounded-full transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
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
              <button onClick={() => setSelectedRelease(null)} className="h-10 px-6 bg-primary text-white font-bold text-xs border-none cursor-pointer hover:opacity-90 transition-opacity">
                Close Release
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
