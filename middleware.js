const REDIRECT_CACHE_TTL_MS = 60_000
const REDIRECT_STATUSES = new Set([301, 302, 307, 308])
const SKIP_PREFIXES = [
  '/admin',
  '/dashboard',
  '/api',
  '/assets',
  '/branding',
  '/flags',
  '/social-icons',
  '/priorities',
  '/favicon',
]

const STATIC_FILE_PATTERN = /\.[a-z0-9]{2,8}$/i
const cache = new Map()

function shouldSkip(pathname) {
  if (pathname === '/') return true
  if (STATIC_FILE_PATTERN.test(pathname)) return true
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '')
}

function getSupabaseConfig() {
  const env = typeof process !== 'undefined' ? process.env : {}
  return {
    url: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
  }
}

async function findRedirectRule(sourcePath) {
  const cached = cache.get(sourcePath)
  if (cached && cached.expiresAt > Date.now()) return cached.rule

  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) return null

  const endpoint = new URL('/rest/v1/redirect_rules', url)
  endpoint.searchParams.set('source_path', `eq.${sourcePath}`)
  endpoint.searchParams.set('is_active', 'eq.true')
  endpoint.searchParams.set('select', 'destination_path,status_code,preserve_query')
  endpoint.searchParams.set('limit', '1')

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
      },
    })
    if (!response.ok) return null
    const [rule] = await response.json()
    cache.set(sourcePath, {
      rule: rule || null,
      expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS,
    })
    return rule || null
  } catch {
    return null
  }
}

export default async function middleware(request) {
  const requestUrl = new URL(request.url)
  const sourcePath = normalizePath(requestUrl.pathname)

  if (shouldSkip(sourcePath)) return

  const rule = await findRedirectRule(sourcePath)
  if (!rule) return

  const status = REDIRECT_STATUSES.has(rule.status_code) ? rule.status_code : 301
  const destinationUrl = new URL(rule.destination_path, requestUrl.origin)
  if (rule.preserve_query && requestUrl.search && !destinationUrl.search) {
    destinationUrl.search = requestUrl.search
  }

  if (destinationUrl.href === requestUrl.href) return

  return Response.redirect(destinationUrl, status)
}

export const config = {
  runtime: 'edge',
  matcher: ['/((?!.*\\.[a-zA-Z0-9]{2,8}$).*)'],
}
