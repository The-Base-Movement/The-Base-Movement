// youth-avatar
//
// Uploads a Youth Wing member's profile photo.
//
// Youth Wing members have no auth account, so they cannot write to storage
// themselves and the `youth-avatars` bucket has no anon or authenticated write
// policy at all. This function is the only writer: it verifies the caller,
// uploads with the service role, and records the URL on the member row.
//
// Two accepted callers:
//   1. The member (or their guardian), proving membership_number + date_of_birth
//      -- the same credential pair the portal signs in with.
//   2. An admin, proving a JWT that belongs to a row in `admins`.
//
// Body: { membership_number, date_of_birth?, image_base64, content_type }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function extensionFor(contentType: string): string {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => ({}))
    const membershipNumber: string = (body.membership_number ?? '').trim()
    const dateOfBirth: string | null = body.date_of_birth ?? null
    const contentType: string = body.content_type ?? 'image/jpeg'
    const imageBase64: string = body.image_base64 ?? ''

    if (!membershipNumber) return json({ error: 'membership_number is required' }, 400)
    if (!imageBase64) return json({ error: 'image_base64 is required' }, 400)
    if (!ALLOWED_TYPES.includes(contentType)) {
      return json({ error: 'Only JPEG, PNG or WebP images are accepted' }, 400)
    }

    // Decode first so an oversized payload is rejected before any DB work.
    let bytes: Uint8Array
    try {
      const binary = atob(imageBase64)
      bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    } catch {
      return json({ error: 'Image could not be decoded' }, 400)
    }
    if (bytes.byteLength > MAX_BYTES) return json({ error: 'Image is larger than 5MB' }, 413)

    // Resolve the member. Never trust the number alone.
    // eq() on the normalised number, not ilike(): ilike would treat % and _ in
    // the supplied string as wildcards, letting "TBM-YW-%" match a row the
    // caller never named.
    const { data: member } = await supabase
      .from('youth_wing_members')
      .select('id, membership_number, date_of_birth, avatar_url')
      .eq('membership_number', membershipNumber.toUpperCase())
      .maybeSingle()

    if (!member) return json({ error: 'Member not found' }, 404)

    // Caller check. Either the date of birth matches, or the JWT belongs to an admin.
    let authorized = !!dateOfBirth && member.date_of_birth === dateOfBirth

    if (!authorized) {
      const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
      if (jwt) {
        const {
          data: { user },
        } = await supabase.auth.getUser(jwt)
        if (user) {
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()
          authorized = !!admin
        }
      }
    }

    if (!authorized) return json({ error: 'Unauthorized' }, 401)

    // Path is keyed on the row uuid plus a random filename, never the sequential
    // membership number, so a public bucket is not an enumerable photo dump.
    const path = `${member.id}/${crypto.randomUUID()}.${extensionFor(contentType)}`

    const { error: uploadError } = await supabase.storage
      .from('youth-avatars')
      .upload(path, bytes, { contentType, upsert: false })

    if (uploadError) {
      console.error('[youth-avatar] upload failed:', uploadError)
      return json({ error: 'Upload failed' }, 500)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('youth-avatars').getPublicUrl(path)

    const { error: rpcError } = await supabase.rpc('set_youth_wing_avatar', {
      p_membership_number: member.membership_number,
      p_avatar_url: publicUrl,
    })

    if (rpcError) {
      console.error('[youth-avatar] rpc failed:', rpcError)
      await supabase.storage.from('youth-avatars').remove([path])
      return json({ error: 'Could not save the photo' }, 500)
    }

    // Best-effort cleanup of the photo this one replaces; never fails the request.
    if (member.avatar_url) {
      const marker = '/youth-avatars/'
      const idx = member.avatar_url.indexOf(marker)
      if (idx !== -1) {
        const oldPath = member.avatar_url.slice(idx + marker.length)
        await supabase.storage.from('youth-avatars').remove([oldPath])
      }
    }

    return json({ avatar_url: publicUrl })
  } catch (err) {
    console.error('[youth-avatar] error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
