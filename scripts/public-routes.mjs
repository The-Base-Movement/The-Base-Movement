/**
 * Single source of truth for the site's static, indexable public routes.
 * Consumed by both prerender.mjs (which pages get static HTML) and
 * generate-sitemap.mjs (the sitemap's static entries). Keep this in sync with
 * the PublicLayout routes in src/routes.tsx.
 */

export const SITE_URL = 'https://www.thebasemovement.org.gh'

export const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.9' },
  { path: '/register', changefreq: 'monthly', priority: '0.9' },
  { path: '/our-agenda', changefreq: 'weekly', priority: '0.8' },
  { path: '/officers', changefreq: 'weekly', priority: '0.8' },
  { path: '/chapters', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/jobs', changefreq: 'weekly', priority: '0.7' },
  { path: '/impact', changefreq: 'weekly', priority: '0.7' },
  { path: '/polls', changefreq: 'weekly', priority: '0.7' },
  { path: '/store', changefreq: 'weekly', priority: '0.7' },
  { path: '/constituencies', changefreq: 'monthly', priority: '0.6' },
  { path: '/donate', changefreq: 'monthly', priority: '0.6' },
  { path: '/press', changefreq: 'weekly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
]
