/**
 * Shared Origin-Matching CORS Utility for Supabase Edge Functions
 * -------------------------------------------------------------
 * For allowed origins: returns matching Access-Control-Allow-Origin header.
 * For disallowed origins and missing Origin: returns no ACAO header (browser blocks),
 * and preflight returns HTTP 403 to make the rejection explicit.
 */

export const ALLOWED_ORIGINS = [
  'https://www.thebasemovement.org.gh',
  'https://thebasemovement.org.gh',
  'http://localhost:3000',
  'http://localhost:5173',
]

const COMMON_ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-custom-trace-id'
const COMMON_ALLOW_METHODS = 'POST, GET, OPTIONS, PUT, DELETE'

/**
 * Returns dynamic CORS headers for allowed origins only.
 * Disallowed or missing origins receive no Access-Control-Allow-Origin header.
 */
export function getCorsHeaders(
  req: Request,
  options?: { allowAny?: boolean }
): Record<string, string> {
  if (options?.allowAny) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': COMMON_ALLOW_HEADERS,
      'Access-Control-Allow-Methods': COMMON_ALLOW_METHODS,
    }
  }

  const origin = req.headers.get('Origin') ?? req.headers.get('origin') ?? ''
  const isAllowed = origin !== '' && ALLOWED_ORIGINS.includes(origin)

  if (!isAllowed) {
    // Return no ACAO header — the browser will block the request.
    // Still include allow-headers/methods so the connection itself is not confused.
    return {
      'Access-Control-Allow-Headers': COMMON_ALLOW_HEADERS,
      'Access-Control-Allow-Methods': COMMON_ALLOW_METHODS,
      Vary: 'Origin',
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': COMMON_ALLOW_HEADERS,
    'Access-Control-Allow-Methods': COMMON_ALLOW_METHODS,
    Vary: 'Origin',
  }
}

/**
 * Preflight OPTIONS request handler helper.
 * Returns 403 for disallowed origins, 200 for allowed.
 */
export function handleCorsPreflight(req: Request, options?: { allowAny?: boolean }) {
  const headers = getCorsHeaders(req, options)
  const isBlocked = !('Access-Control-Allow-Origin' in headers)
  return new Response(isBlocked ? 'Forbidden' : 'ok', {
    status: isBlocked ? 403 : 200,
    headers,
  })
}
