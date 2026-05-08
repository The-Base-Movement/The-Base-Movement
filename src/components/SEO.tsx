import { Helmet } from 'react-helmet-async'
import { useBranding } from '@/hooks/useBranding'

interface SEOProps {
  title?: string
  description?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  canonical?: string
  jsonLd?: Record<string, any>
}

export default function SEO({ 
  title, 
  description, 
  ogImage, 
  ogType = 'website',
  canonical 
}: SEOProps) {
  const { settings } = useBranding()
  
  const siteName = "The Base Movement"
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} – Ghana First, Jobs for the Youth!`
  const defaultDescription = "We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future."
  const metaDescription = description || defaultDescription
  const image = ogImage || settings.logo_url
  const siteUrl = "https://thebasemovement.com"
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Canonical Link */}
      {canonical && <link rel="canonical" href={`${siteUrl}${canonical}`} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
