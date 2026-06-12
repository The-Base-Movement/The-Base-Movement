// @ts-nocheck
// THE BASE: NEWSLETTER UNSUBSCRIBE
// Decodes the user token from the query param, sets newsletter_opt_out = true,
// and returns a branded HTML confirmation page.
//
// verify_jwt: false — called from email link; no session available.
// Required auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function htmlPage(title: string, heading: string, body: string, isError = false): string {
  const accentColor = isError ? '#CE1126' : '#006B3F'
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700;800&display=swap" rel="stylesheet">
<title>${title} · The Base Movement</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f4f4f4;font-family:'Public Sans',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#fff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .bar{height:5px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F)}
  .header{background:#181d19;padding:20px 28px;display:flex;align-items:center;gap:12px}
  .header img{height:32px;width:auto}
  .body{padding:32px 28px}
  .icon{width:52px;height:52px;border-radius:50%;background:${isError ? 'rgba(206,17,38,.1)' : 'rgba(0,107,63,.1)'};display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:26px}
  h1{font-size:22px;font-weight:800;color:#181d19;margin-bottom:10px}
  p{font-size:14px;color:#666;line-height:1.6}
  .accent{color:${accentColor};font-weight:700}
  .footer-bar{width:60px;height:3px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F);border-radius:99px;margin-top:24px}
</style>
</head>
<body>
<div class="card">
  <div class="bar"></div>
  <div class="header">
    <img src="https://thebasemovement.creativeutil.com/branding/logo.png" alt="The Base Movement">
  </div>
  <div class="body">
    <div class="icon">${isError ? '✕' : '✓'}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <div class="footer-bar"></div>
  </div>
</div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(
      htmlPage(
        'Invalid link',
        'Invalid unsubscribe link',
        'This unsubscribe link is missing required information. Please contact <span class="accent">support@thebasemovement.org</span> if you need help.',
        true
      ),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  let userId: string
  try {
    // Reverse URL-safe base64: restore +, /, = padding then decode
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4)
    userId = atob(padded)
    // Validate it looks like a UUID
    if (!/^[0-9a-f-]{36}$/.test(userId)) throw new Error('not a uuid')
  } catch {
    return new Response(
      htmlPage(
        'Invalid link',
        'Invalid unsubscribe link',
        'This link appears to be malformed. Please use the unsubscribe link from the original email, or contact <span class="accent">support@thebasemovement.org</span> for help.',
        true
      ),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { error } = await supabase
    .from('users')
    .update({ newsletter_opt_out: true })
    .eq('id', userId)

  if (error) {
    console.error('[UNSUB] DB error', error.message)
    return new Response(
      htmlPage(
        'Error',
        'Something went wrong',
        'We were unable to process your request. Please try again or contact <span class="accent">support@thebasemovement.org</span>.',
        true
      ),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
    )
  }

  return new Response(
    htmlPage(
      'Unsubscribed',
      "You've been unsubscribed",
      'You will no longer receive newsletter emails from The Base Movement. If this was a mistake, please contact <span class="accent">support@thebasemovement.org</span> and we\'ll re-enable your subscription.'
    ),
    { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
  )
})
