import { supabase } from '@/lib/supabase'

const SITE = 'https://www.thebasemovement.org.gh'

/**
 * Notify IndexNow (Bing, Yandex, …) that the given pages changed so they
 * re-crawl immediately. Fire-and-forget — publishing must never block or fail
 * because the ping did. Accepts site-relative paths ('/blog/my-post') or full
 * URLs; anything not on our canonical host is dropped by the edge function.
 */
export function pingIndexNow(paths: string[]): void {
  const urls = paths.map((p) =>
    p.startsWith('http') ? p : `${SITE}${p.startsWith('/') ? p : `/${p}`}`
  )
  supabase.functions.invoke('indexnow-submit', { body: { urls } }).catch((err) => {
    console.warn('[INDEXNOW] submit failed:', err)
  })
}
