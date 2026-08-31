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
  const [activeCategory, setActiveCategory] = useState<string>('All')

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

  const categories = ['All', 'National Announcements', 'Regional Operations', 'Diaspora Engagement']

  const filteredReleases =
    activeCategory === 'All'
      ? releases
      : releases.filter((pr) => pr.category?.toLowerCase() === activeCategory.toLowerCase())

  const pressSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: releases.slice(0, 10).map((pr, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'NewsArticle',
        headline: pr.title,
        description: pr.excerpt,
        datePublished: pr.publishedAt,
        publisher: {
          '@type': 'Organization',
          name: 'The Base Movement',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.thebasemovement.org.gh/branding/logo.png',
          },
        },
      },
    })),
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'hsl(var(--container-low))' }}>
      <SEO
        title="Press Room & Official Media Updates | The Base Movement"
        description="Access official press releases, downloadable media kits, policy updates, and brand assets from The Base Movement's national communications and media relations desk."
        keywords="the base movement press release, the base movement media kit, official statements Dr George Oti Bonsu, Ghana political news releases, the base movement press room"
        canonical="/press"
        jsonLd={pressSchema}
      />
      {/* Hero */}
      <header className="bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="page-container relative z-10">
          <Breadcrumbs />
          <p className="font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6">
            Media &amp; communications desk
          </p>
          <h1 className="font-meta font-medium text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            The Base Movement Press Room &amp; Official Media Updates
          </h1>
          <p
            className="text-lg max-w-2xl font-body-md mb-8"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Authoritative statements, official press releases, and brand guidelines from The Base
            Movement communications team.
          </p>
          <div>
            <a
              href={mediaKit[0]?.fileUrl || '/branding/logo.png'}
              download="The-Base-Movement-Official-Press-Kit.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-brand-green text-white font-bold text-sm rounded-full shadow-lg hover:bg-brand-green/90 transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                download
              </span>
              Download Official TBM Press Kit (PDF)
            </a>
          </div>
        </div>
      </header>

      <div className="page-container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-meta font-medium text-2xl tracking-tight flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-brand-green"
                    style={{ fontSize: 24 }}
                  >
                    newspaper
                  </span>
                  Latest press releases
                </h2>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`btn btn-xs ${
                        activeCategory === cat ? 'btn-primary' : 'btn-outline'
                      }`}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

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
                ) : filteredReleases.length > 0 ? (
                  filteredReleases.map((pr) => (
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
                    body={`No press releases found for "${activeCategory}".`}
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
