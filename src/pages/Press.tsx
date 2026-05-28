import { useState, useEffect } from 'react'
import { EmptyState, Skeleton } from '@/components/states'
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
    <main className="min-h-screen pb-24" style={{ background: 'hsl(var(--container-low))' }}>
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
          <h1 className="font-meta font-medium text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Press <span className="text-brand-green">center</span>
          </h1>
          <p className="text-lg max-w-2xl font-body-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
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
              <h2 className="font-meta font-medium text-2xl tracking-tight mb-8 flex items-center gap-3">
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Skeleton variant="text-sm" width={80} />
                        <Skeleton variant="text-lg" width="70%" />
                        <Skeleton variant="text-md" />
                        <Skeleton variant="text-md" width="80%" />
                        <Skeleton variant="text-sm" width="40%" />
                      </div>
                    ))}
                  </div>
                ) : releases.length > 0 ? (
                  releases.map((pr) => (
                    <div
                      key={pr.id}
                      className="bg-white p-8 border border-border shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-medium tracking-tight rounded-sm">
                          {pr.category}
                        </span>
                        <span
                          className="text-tiny font-medium tracking-tight"
                          style={{ color: 'hsl(var(--on-surface-muted))' }}
                        >
                          {new Date(pr.publishedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-medium text-charcoal-dark mb-4 group-hover:text-brand-green transition-colors">
                        {pr.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed mb-6 line-clamp-2"
                        style={{ color: 'hsl(var(--on-surface-muted))' }}
                      >
                        {pr.excerpt}
                      </p>
                      <button
                        onClick={() => setSelectedRelease(pr)}
                        className="flex items-center gap-2 text-brand-green font-medium text-xs bg-transparent border-none cursor-pointer hover:underline p-0"
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
                  <EmptyState
                    icon="newspaper"
                    title="No dispatches found."
                    body="Press releases and media updates will appear here."
                    bordered
                  />
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
