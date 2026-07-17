// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: auth, error: authError } = await admin.auth.getUser(jwt)
  if (authError || !auth.user) return json({ error: 'Not authenticated.' }, 401)

  const { fullName } = await req.json()
  const { data: member, error: memberError } = await admin
    .from('users')
    .select('full_name')
    .eq('id', auth.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (memberError || !member) return json({ error: 'Active membership not found.' }, 404)
  if (String(fullName).trim() !== member.full_name.trim()) {
    return json({ error: 'Full name does not match.' }, 400)
  }

  const { error: updateError } = await admin
    .from('users')
    .update({ deleted_at: new Date().toISOString(), status: 'Inactive' })
    .eq('id', auth.user.id)
  if (updateError) return json({ error: 'Could not deactivate membership.' }, 500)

  const { error: banError } = await admin.auth.admin.updateUserById(auth.user.id, {
    ban_duration: '876000h',
  })
  if (banError) {
    await admin.from('users').update({ deleted_at: null, status: 'Active' }).eq('id', auth.user.id)
    return json({ error: 'Could not block account access.' }, 500)
  }

  return json({ success: true })
})
