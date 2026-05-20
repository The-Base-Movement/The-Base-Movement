import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { adminService } from '@/services/adminService'
import type { PressRelease, MediaKitAsset } from '@/types/admin'
import SEO from '@/components/SEO'
import { PressSidebar } from './press/components/PressSidebar'
import { ReleaseDetailModal } from './press/components/ReleaseDetailModal'

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
          adminService.getMediaKitAssets(),
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
          <p className="font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6">
            Media & communications
          </p>
          <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Press <span className="text-brand-green">center</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl font-body-md">
            Authoritative updates, media assets, and official statements from The Base Movement's
            communication desk.
          </p>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="font-meta font-bold text-2xl tracking-tight mb-8 flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-brand-green"
                  style={{ fontSize: 24 }}
                >
                  newspaper
                </span>
                Latest press releases
              </h2>

              <div className="space-y-8">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-stone-300">
                    <span
                      className="material-symbols-outlined animate-spin"
                      style={{ fontSize: 32 }}
                    >
                      progress_activity
                    </span>
                    <p className="text-micro font-bold tracking-tight">Scanning dispatch desk...</p>
                  </div>
                ) : releases.length > 0 ? (
                  releases.map((pr) => (
                    <div
                      key={pr.id}
                      className="bg-white p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-bold tracking-tight rounded-sm">
                          {pr.category}
                        </span>
                        <span className="text-tiny text-slate-400 font-medium tracking-tight">
                          {new Date(pr.publishedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-charcoal-dark mb-4 group-hover:text-brand-green transition-colors">
                        {pr.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                        {pr.excerpt}
                      </p>
                      <button
                        onClick={() => setSelectedRelease(pr)}
                        className="flex items-center gap-2 text-brand-green font-bold text-xs bg-transparent border-none cursor-pointer hover:underline p-0"
                      >
                        View full release
                        <span
                          className="material-symbols-outlined transition-transform group-hover:translate-x-1"
                          style={{ fontSize: 16 }}
                        >
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 border-2 border-dashed border-slate-100 text-center">
                    <span
                      className="material-symbols-outlined text-slate-200 block mx-auto mb-4"
                      style={{ fontSize: 48 }}
                    >
                      newspaper
                    </span>
                    <p className="text-slate-400 text-sm font-bold tracking-tight">
                      No active dispatches found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <PressSidebar mediaKit={mediaKit} />
          </div>
        </div>
      </div>
      {selectedRelease && (
        <ReleaseDetailModal release={selectedRelease} onClose={() => setSelectedRelease(null)} />
      )}
    </main>
  )
}
