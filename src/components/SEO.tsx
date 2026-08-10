/**
 * SEO Component
 * -------------------------------------------------------------
 * Centralized SEO metadata component for all public and dashboard pages.
 * Wraps `react-helmet-async`'s `<Helmet>` to inject:
 *
 * - `<title>` — appends "| The Base Movement" suffix
 * - `<meta name="description">`
 * - Robots / canonical tags (suppressed when `noindex` is true)
 * - Open Graph tags (`og:type`, locale `en_GH`, title, description, image, URL)
 * - Twitter card tags
 * `ogImage` defaults to the `og_image_url` branding setting from Supabase.
 */

import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  canonical?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export const DEFAULT_SEO_KEYWORDS =
  'the base movement ghana, the base movement, Dr George Oti Bonsu, Dr. George Oti Bonsu, George Oti Bonsu, the base movement ghana registration online, the base registration online login, the base ghana, base movement ghana, the base movement ghana registration, thebasemovement.org.gh, the base movement app, the base movement limited by guarantee, the base movement lbg, oti bonsu base movement, george oti bonsu npp, the base movement founder, how to register for the base movement, the base movement registration link, the base movement login, the base movement head office accra, the base movement tesano, the base movement chapters, ghana first jobs for the youth, new political movements in ghana 2026, jobs for the youth ghana, third force political party ghana, the base ghana first, the base movement ghana registration form, the base movement ghana jobs, the base ghana first sues the base movement, the base ghana first registration, the base party'

export default function SEO({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonical,
  noindex,
  jsonLd,
}: SEOProps) {
  const { settings } = useBranding()
  const { pathname } = useLocation()

  const siteName = 'The Base Movement LBG'
  const fullTitle = title
    ? title.includes(siteName)
      ? title // already brand-qualified (e.g. homepage) — don't double-append
      : `${title} | ${siteName}`
    : `${siteName} – Ghana First, Jobs for the Youth!`
  const defaultDescription =
    'We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.'
  const metaDescription = description || defaultDescription
  const metaKeywords = keywords || DEFAULT_SEO_KEYWORDS
  const image = ogImage || settings.og_image_url
  const siteUrl = 'https://www.thebasemovement.org.gh'
  // Router location works during SSR/prerender too (StaticRouter), so canonical
  // and og:url are present in the static HTML crawlers see — not just client-side.
  const canonicalPath = canonical ?? pathname
  const canonicalUrl = canonicalPath ? `${siteUrl}${canonicalPath}` : null


  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Search Engine Directives */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* RSS Feed Auto-Discovery */}
      <link rel="alternate" type="application/rss+xml" title="The Base Movement RSS Feed" href="https://www.thebasemovement.org.gh/blog/feed.xml" />
      <link rel="alternate" type="application/rss+xml" title="The Base Movement News Feed" href="https://www.thebasemovement.org.gh/feed.xml" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="en_GH" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl ?? ''} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@thebasemovement" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data Schema */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
