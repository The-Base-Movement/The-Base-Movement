/**
 * Build-time RSS Feed generator.
 * -------------------------------------------------------------
 * Writes:
 *   - dist/feed.xml
 *   - dist/rss.xml
 *   - dist/blog/feed.xml
 * Fetches published blog posts and press releases from Supabase.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://www.thebasemovement.org.gh'

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

function escapeXml(unsafe) {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function main() {
  const url = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL')
  const key = readEnv('VITE_SUPABASE_ANON_KEY') || readEnv('SUPABASE_ANON_KEY')

  const items = []
  if (url && key) {
    const supabase = createClient(url, key)

    // Fetch published blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, content, published_at, category')
      .is('deleted_at', null)
      .eq('status', 'Published')
      .order('published_at', { ascending: false })
      .limit(30)

    for (const p of posts ?? []) {
      items.push({
        title: p.title,
        link: `${SITE_URL}/blog/${p.slug}`,
        guid: `${SITE_URL}/blog/${p.slug}`,
        pubDate: p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString(),
        description: p.excerpt || p.content?.slice(0, 280) || '',
        category: p.category || 'Updates',
      })
    }

    // Fetch press releases
    const { data: releases } = await supabase
      .from('press_releases')
      .select('title, excerpt, content, published_at, category')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(20)

    for (const r of releases ?? []) {
      items.push({
        title: `[Press Release] ${r.title}`,
        link: `${SITE_URL}/press`,
        guid: `${SITE_URL}/press#${r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        pubDate: r.published_at ? new Date(r.published_at).toUTCString() : new Date().toUTCString(),
        description: r.excerpt || r.content?.slice(0, 280) || '',
        category: r.category || 'Press Release',
      })
    }

    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
  } else {
    console.warn('[RSS] Supabase env missing — writing fallback feed.')
  }

  const now = new Date().toUTCString()
  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
    </item>`
    )
    .join('\n')

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Base Movement | Official RSS Feed</title>
    <link>${SITE_URL}/blog</link>
    <description>Official updates, press releases, policy announcements, and articles from The Base Movement communications desk.</description>
    <language>en-gh</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>
`

  const distDir = path.resolve(__dirname, '../dist')
  const blogDir = path.resolve(__dirname, '../dist/blog')

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true })
  }

  // Also write to public/ directory for dev mode & static serving
  const publicDir = path.resolve(__dirname, '../public')
  const publicBlogDir = path.resolve(__dirname, '../public/blog')
  if (!fs.existsSync(publicBlogDir)) {
    fs.mkdirSync(publicBlogDir, { recursive: true })
  }

  fs.writeFileSync(path.resolve(distDir, 'feed.xml'), rssXml)
  fs.writeFileSync(path.resolve(distDir, 'rss.xml'), rssXml)
  fs.writeFileSync(path.resolve(blogDir, 'feed.xml'), rssXml)

  fs.writeFileSync(path.resolve(publicDir, 'feed.xml'), rssXml)
  fs.writeFileSync(path.resolve(publicDir, 'rss.xml'), rssXml)
  fs.writeFileSync(path.resolve(publicBlogDir, 'feed.xml'), rssXml)

  console.log(
    `[RSS] Wrote ${items.length} items to dist/feed.xml, dist/rss.xml, dist/blog/feed.xml & public equivalents`
  )
}

main()
