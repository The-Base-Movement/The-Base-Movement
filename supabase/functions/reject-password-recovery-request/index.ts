// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status,
    })

  if (req.method === 'OPTIONS') return handleCorsPreflight(req)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const admin = createClient(supabaseUrl, serviceKey)

    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const {
      data: { user: caller },
    } = await admin.auth.getUser(jwt)
    if (!caller) return json({ error: 'Not authenticated.' }, 401)

    const { data: callerAdmin } = await admin
      .from('admins')
      .select('id')
      .eq('id', caller.id)
      .maybeSingle()
    if (!callerAdmin) return json({ error: 'Not authorized.' }, 403)

    const { id, review_notes } = await req.json()
    if (!id) return json({ error: 'id is required.' }, 400)

    const { data, error } = await admin
      .from('password_recovery_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: caller.id,
        review_notes: String(review_notes ?? '').trim() || null,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return json({ error: 'Recovery request not found or already reviewed.' }, 404)

    return json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[REJECT-PASSWORD-RECOVERY-REQUEST] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
