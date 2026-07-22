// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// IndexNow: ping search engines (Bing, Yandex, etc.) the moment a URL changes so
// they re-crawl immediately instead of waiting. The key file must be hosted at
// https://<HOST>/<KEY>.txt (see public/aadb12316ed74e68a71db271317e17e0.txt).
// ponytail: key + host hardcoded — the key is public (served at the site root),
// so there's nothing to hide in a secret. If the key rotates, update both the
// public file and this constant.
const HOST = 'www.thebasemovement.org.gh'
const KEY = 'aadb12316ed74e68a71db271317e17e0'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const ALLOWED_PREFIX = `https://${HOST}/`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { urls } = await req.json()
    // Trust boundary: this endpoint is unauthenticated, so only accept URLs on
    // our own host — otherwise anyone could submit arbitrary URLs under our key.
    const urlList = (Array.isArray(urls) ? urls : [urls]).filter(
      (u: unknown): u is string => typeof u === 'string' && u.startsWith(ALLOWED_PREFIX)
    )
    if (urlList.length === 0) return json({ error: 'No valid URLs' }, 400)

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
    })
    // IndexNow returns 200 (ok) or 202 (accepted); both mean success.
    return json({ submitted: urlList.length, indexnowStatus: res.status }, res.ok ? 200 : 502)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
