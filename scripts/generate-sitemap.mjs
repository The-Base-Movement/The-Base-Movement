/**
 * Build-time sitemap generator.
 * -------------------------------------------------------------
 * Writes dist/sitemap.xml = the static public routes (from public-routes.mjs)
 * PLUS live dynamic pages pulled from Supabase: published blog posts, party
 * officials, and published jobs. Runs after the build so crawlers get every
 * indexable URL. If Supabase env is missing it degrades to static-only rather
 * than failing the build.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { STATIC_ROUTES, SITE_URL } from './public-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../dist/sitemap.xml')

// Matches src/pages/OfficerDetail.tsx toSlug so /officers/:slug URLs resolve.
const toSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const iso = (v) => (typeof v === 'string' && v ? v.slice(0, 10) : null)

function urlEntry(loc, { changefreq, priority, lastmod }) {
  return [
    '  <url>',
    `    <loc>${SITE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')
}

// Load Supabase creds from the environment (Vercel) or a local .env fallback so
// local builds also produce a complete sitemap.
function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8')
    const line = envFile.split('\n').find((l) => l.startsWith(`${name}=`))
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : undefined
  } catch {
    return undefined
  }
}

async function dynamicEntries(today) {
  // Vercel exposes the VITE_-prefixed vars; local .env uses the bare names.
  const url = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL')
  const key = readEnv('VITE_SUPABASE_ANON_KEY') || readEnv('SUPABASE_ANON_KEY')
  if (!url || !key) {
    console.warn('[SITEMAP] Supabase env not set — writing static routes only.')
    return []
  }
  const supabase = createClient(url, key)
  const entries = []

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .is('deleted_at', null)
    .eq('status', 'Published')
  for (const p of posts ?? [])
    entries.push(
      urlEntry(`/blog/${p.slug}`, {
        changefreq: 'monthly',
        priority: '0.6',
        lastmod: iso(p.published_at) ?? today,
      })
    )

  const { data: officers } = await supabase.from('party_officials').select('name')
  for (const o of officers ?? [])
    if (o.name)
      entries.push(
        urlEntry(`/officers/${toSlug(o.name)}`, {
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: today,
        })
      )

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, updated_at')
    .eq('status', 'published')
  for (const j of jobs ?? [])
    entries.push(
      urlEntry(`/jobs/${j.id}`, {
        changefreq: 'weekly',
        priority: '0.6',
        lastmod: iso(j.updated_at) ?? today,
      })
    )

  console.log(
    `[SITEMAP] dynamic: ${posts?.length ?? 0} posts, ${officers?.length ?? 0} officers, ${jobs?.length ?? 0} jobs`
  )
  return entries
}

async function main() {
  if (!fs.existsSync(path.dirname(OUT))) {
    console.error('[SITEMAP] dist/ not found — run the build first.')
    process.exit(1)
  }
  const today = new Date().toISOString().slice(0, 10)
  const staticEntries = STATIC_ROUTES.map((r) =>
    urlEntry(r.path, { changefreq: r.changefreq, priority: r.priority, lastmod: today })
  )
  const dynamic = await dynamicEntries(today).catch((e) => {
    console.warn('[SITEMAP] dynamic fetch failed — static only:', e.message)
    return []
  })
  const all = [...staticEntries, ...dynamic]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.join('\n')}\n</urlset>\n`
  fs.writeFileSync(OUT, xml)
  console.log(`[SITEMAP] Wrote ${all.length} URLs to dist/sitemap.xml`)
}

main()
