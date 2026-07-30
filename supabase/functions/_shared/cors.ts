/**
 * Shared Origin-Matching CORS Utility for Supabase Edge Functions
 * -------------------------------------------------------------
 * Replaces wildcard '*' on member-sensitive edge functions with strict origin matching
 * for official production and local development origins.
 */

export const ALLOWED_ORIGINS = [
  'https://www.thebasemovement.org.gh',
  'https://thebasemovement.org.gh',
  'http://localhost:3000',
  'http://localhost:5173',
]

/**
 * Returns dynamic CORS headers based on the incoming request Origin header.
 */
export function getCorsHeaders(req: Request, options?: { allowAny?: boolean }) {
  const origin = req.headers.get('Origin') ?? req.headers.get('origin') ?? ''

  if (options?.allowAny) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-custom-trace-id',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    }
  }

  const isAllowed = ALLOWED_ORIGINS.includes(origin)
  const matchedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-custom-trace-id',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    Vary: 'Origin',
  }
}

/**
 * Preflight OPTIONS request handler helper.
 */
export function handleCorsPreflight(req: Request, options?: { allowAny?: boolean }) {
  return new Response('ok', {
    status: 200,
    headers: getCorsHeaders(req, options),
  })
}
