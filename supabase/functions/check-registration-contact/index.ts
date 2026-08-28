// Public (unauthenticated) pre-registration existence check. The registration
// form calls this on email/phone blur so a member finds out they already have
// an account immediately, instead of filling out all 4 steps and failing at
// the very end.
//
// public.users has no anon SELECT policy (RLS), so a plain client-side query
// always returns empty -- this must run server-side with the service role.
// Only booleans are ever returned, never member data, and it's rate-limited
// per IP the same way every other public pre-registration endpoint is.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return handleCorsPreflight(req)

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const ip = clientIp(req)
    const rateCheck = await checkPersistentRateLimit(
      supabase,
      `check-registration-contact::${ip}`,
      30,
      600
    )
    if (!rateCheck.allowed) {
      return json({ error: 'Too many checks. Please slow down.' }, 429)
    }

    const { email, phone } = (await req.json()) as { email?: string; phone?: string }
    const cleanEmail = typeof email === 'string' ? email.trim() : ''
    const cleanPhone = typeof phone === 'string' ? phone.trim() : ''

    const [emailRes, phoneRes] = await Promise.all([
      cleanEmail
        ? supabase.from('users').select('id').ilike('email', cleanEmail).limit(1)
        : Promise.resolve({ data: [], error: null }),
      cleanPhone
        ? supabase.from('users').select('id').eq('phone_number', cleanPhone).limit(1)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (emailRes.error) throw emailRes.error
    if (phoneRes.error) throw phoneRes.error

    return json({
      emailTaken: !!emailRes.data?.length,
      phoneTaken: !!phoneRes.data?.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[CHECK-REGISTRATION-CONTACT-ERROR] ${message}`)
    return json({ error: 'Could not check right now.' }, 500)
  }
})
