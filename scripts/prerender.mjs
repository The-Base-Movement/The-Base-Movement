/**
 * Production Static Site Generation (SSG) Script
 * -------------------------------------------------------------
 * Performs static pre-rendering of public SEO routes in the build directory.
 * Mocking global document/navigator API context to support safe SSR execution.
 *
 * In two phases:
 *  1. STATIC_ROUTES  — fully SSR-rendered (content + head) via the server bundle.
 *  2. Dynamic pages  — blog posts / officers / jobs get a per-URL HTML file with
 *     the correct SEO <head> (title, canonical, OG/Twitter) so crawlers and
 *     social scrapers stop seeing the homepage shell. Body stays client-rendered
 *     (the app uses createRoot, so the empty root is safe and Google renders JS).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { STATIC_ROUTES, SITE_URL } from './public-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

dotenv.config({ path: toAbsolute('../.env') })
dotenv.config({ path: toAbsolute('../.env.local'), override: true })

const routesToPrerender = STATIC_ROUTES.map((r) => r.path)

// ── Dynamic SEO head helpers (mirror src/components/SEO.tsx) ──────────────────
const SITE_NAME = 'The Base Movement'
const DEFAULT_DESC =
  'We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.'
const DEFAULT_OG = `${SITE_URL}/branding/og-image.png`

const escHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const cleanText = (s, max = 200) =>
  String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const toSlug = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

// data-rh markers let client react-helmet-async reconcile these (no dup tags).
function seoHead({ path: routePath, title, description, image, ogType }) {
  const fullTitle = escHtml(`${title} | ${SITE_NAME}`)
  const desc = escHtml(cleanText(description) || DEFAULT_DESC)
  const url = escHtml(`${SITE_URL}${routePath}`)
  const img = escHtml(image || DEFAULT_OG)
  return [
    `<title data-rh="true">${fullTitle}</title>`,
    `<meta data-rh="true" name="description" content="${desc}"/>`,
    `<link data-rh="true" rel="canonical" href="${url}"/>`,
    `<meta data-rh="true" property="og:type" content="${ogType}"/>`,
    `<meta data-rh="true" property="og:locale" content="en_GH"/>`,
    `<meta data-rh="true" property="og:title" content="${fullTitle}"/>`,
    `<meta data-rh="true" property="og:description" content="${desc}"/>`,
    `<meta data-rh="true" property="og:image" content="${img}"/>`,
    `<meta data-rh="true" property="og:image:width" content="1200"/>`,
    `<meta data-rh="true" property="og:image:height" content="630"/>`,
    `<meta data-rh="true" property="og:url" content="${url}"/>`,
    `<meta data-rh="true" property="og:site_name" content="${escHtml(SITE_NAME)}"/>`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image"/>`,
    `<meta data-rh="true" name="twitter:title" content="${fullTitle}"/>`,
    `<meta data-rh="true" name="twitter:description" content="${desc}"/>`,
    `<meta data-rh="true" name="twitter:image" content="${img}"/>`,
  ].join('\n    ')
}

// Fetch blog/officer/job metadata and write per-URL HTML with the right head.
async function prerenderDynamic(template, distDir) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[PRERENDER] Supabase env missing — skipping dynamic SEO pages.')
    return
  }
  const supabase = createClient(url, key)

  let defaultOg = DEFAULT_OG
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'og_image_url')
      .maybeSingle()
    if (data?.value) defaultOg = String(data.value)
  } catch {
    // fall back to DEFAULT_OG
  }
  const absImg = (img) => (img && /^https?:\/\//.test(img) ? img : defaultOg)

  const pages = []

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, seo_title, excerpt, meta_description, image_url')
    .is('deleted_at', null)
    .eq('status', 'Published')
  for (const p of posts ?? [])
    if (p.slug)
      pages.push({
        path: `/blog/${p.slug}`,
        title: p.seo_title || p.title || 'Update',
        description: p.meta_description || p.excerpt,
        image: absImg(p.image_url),
        ogType: 'article',
      })

  const { data: officers } = await supabase.from('party_officials').select('name, role, bio')
  for (const o of officers ?? [])
    if (o.name)
      pages.push({
        path: `/officers/${toSlug(o.name)}`,
        title: o.name,
        description: o.bio ? cleanText(o.bio, 155) : `${o.name} — ${o.role || SITE_NAME}`,
        image: defaultOg,
        ogType: 'website',
      })

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description')
    .eq('status', 'published')
  for (const j of jobs ?? [])
    if (j.id)
      pages.push({
        path: `/jobs/${j.id}`,
        title: j.title || 'Job opening',
        description: j.description,
        image: defaultOg,
        ogType: 'website',
      })

  let written = 0
  for (const page of pages) {
    const html = template.replace('<!--app-head-->', seoHead(page))
    const filePath = path.join(distDir, page.path, 'index.html')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, html)
    written++
  }
  console.log(`[PRERENDER] Wrote ${written} dynamic SEO pages (blog/officers/jobs).`)
}

// Main function to run the production SSG build for specified static routes
async function prerender() {
  console.log('[PRERENDER] Starting production SSG process...')

  const templatePath = toAbsolute('../dist/index.html')
  if (!fs.existsSync(templatePath)) {
    console.error(`[PRERENDER] Client template not found at ${templatePath}. Run build:client first.`)
    process.exit(1)
  }

  const template = fs.readFileSync(templatePath, 'utf-8')

  const serverEntryPath = toAbsolute('../dist/server/entry-server.js')
  if (!fs.existsSync(serverEntryPath)) {
    console.error(`[PRERENDER] Server bundle not found at ${serverEntryPath}. Run build:server first.`)
    process.exit(1)
  }

  // Define minimal globals ONLY if they are missing and causing crashes during module initialization.
  // We avoid setting a full 'window' to allow the app's own SSR-safety checks to work correctly.
  const noop = () => {}
  const elementMock = {
    style: {},
    appendChild: noop,
    removeChild: noop,
    setAttribute: noop,
    getAttribute: () => null,
    classList: { add: noop, remove: noop }
  }

  // Some libraries check for global 'document' or 'navigator' at the top level.
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      createElement: () => ({ ...elementMock }),
      createTextNode: (text) => ({ text, ...elementMock }),
      getElementsByTagName: () => [elementMock],
      querySelector: () => elementMock,
      documentElement: elementMock,
      head: elementMock,
      body: elementMock,
      addEventListener: noop,
      removeEventListener: noop,
    }
  }

  if (typeof globalThis.navigator === 'undefined') {
    try {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'node' },
        configurable: true,
        enumerable: true,
        writable: true
      })
    } catch (e) {}
  }

  // Import the built SSR bundle
  const { render } = await import(`file://${serverEntryPath}`)

  try {
    for (const url of routesToPrerender) {
      console.log(`[PRERENDER] Rendering route: ${url}`)

      let { appHtml, head } = await render(url)

      // Regex to extract SEO tags from appHtml if they ended up there (common in React 18 streaming)
      // Matches <title>...</title>, <meta...>, <link...>, and <script type="application/ld+json">...</script>
      const seoTagsRegex = /<(title|script)[^>]*>.*?<\/\1>|<(meta|link)[^>]*\/?>/gi
      const extractedTags = []

      appHtml = appHtml.replace(seoTagsRegex, (match) => {
        // Only move tags that are typical for the head or SEO
        if (match.includes('<title') || match.includes('<meta') || match.includes('<link') || match.includes('application/ld+json')) {
          extractedTags.push(match)
          return ''
        }
        return match
      })

      const finalHead = (head || '') + extractedTags.join('\n')

      const html = template
        .replace('<!--app-head-->', finalHead)
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

      const filePath = path.join(toAbsolute('../dist'), url === '/' ? 'index.html' : `${url}/index.html`)
      const dirPath = path.dirname(filePath)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      fs.writeFileSync(filePath, html)
      console.log(`[PRERENDER] Saved: ${url} (${html.length} bytes)`)
    }

    // Phase 2: dynamic pages (blog/officers/jobs) get correct SEO heads.
    await prerenderDynamic(template, toAbsolute('../dist'))

    console.log('[PRERENDER] SSG completed successfully!')
  } catch (e) {
    console.error('[PRERENDER] SSG failed:', e)
    process.exit(1)
  }
}

prerender()
