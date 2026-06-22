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
 * - JSON-LD structured data (defaults to a `PoliticalParty` Organization schema;
 *   override via the `jsonLd` prop for article or other page types)
 *
 * `ogImage` defaults to the `og_image_url` branding setting from Supabase.
 */

import { Helmet } from 'react-helmet-async'
import { useBranding } from '@/hooks/useBranding'

interface SEOProps {
  title?: string
  description?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  canonical?: string
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

export default function SEO({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonical,
  jsonLd,
  noindex,
}: SEOProps) {
  const { settings } = useBranding()

  const siteName = 'The Base Movement'
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} – Ghana First, Jobs for the Youth!`
  const defaultDescription =
    'We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.'
  const metaDescription = description || defaultDescription
  const image = ogImage || settings.og_image_url
  const siteUrl = 'https://thebasemovement.info'
  const canonicalPath = canonical ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  const canonicalUrl = canonicalPath ? `${siteUrl}${canonicalPath}` : null

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'PoliticalParty',
    name: 'The Base Movement',
    alternateName: 'TBM',
    url: siteUrl,
    logo: settings.logo_url.startsWith('http')
      ? settings.logo_url
      : `${siteUrl}${settings.logo_url}`,
    description: defaultDescription,
    foundingDate: '2026',
    foundingLocation: { '@type': 'Place', name: 'Accra, Ghana' },
    areaServed: ['Ghana', 'Diaspora'],
    slogan: 'Ghana First, Jobs for the Youth!',
    sameAs: ['https://www.instagram.com/thebasemovementgh'],
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Search Engine Directives */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

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
      <meta name="twitter:site" content="@thebasemovementgh" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {!noindex && (
        <script type="application/ld+json">{JSON.stringify(jsonLd ?? organizationSchema)}</script>
      )}
    </Helmet>
  )
}
