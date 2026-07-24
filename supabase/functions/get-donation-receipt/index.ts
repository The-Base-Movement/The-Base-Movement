// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageDonations, canViewGuestDonationReceipts, json } from '../_shared/admin-auth.ts'

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ReceiptLocation = {
  bucket: string
  path: string
}

function normalizeLocation(bucket: string, path: string): ReceiptLocation | null {
  const normalizedBucket = bucket.trim()
  const normalizedPath = decodeURIComponent(path.trim()).replace(/^\/+/, '')
  if (!normalizedBucket || !normalizedPath) return null
  return { bucket: normalizedBucket, path: normalizedPath }
}

function parseStoredReceiptLocation(
  storedValue: string | null | undefined,
  donationId: string
): ReceiptLocation[] {
  const fallback = [{ bucket: 'receipts', path: `${donationId}.html` }]
  if (!storedValue?.trim()) return fallback

  const value = storedValue.trim()
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      const publicMatch = url.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
      const signMatch = url.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/)
      const match = publicMatch ?? signMatch
      if (match) {
        const parsed = normalizeLocation(match[1], match[2])
        return parsed ? [parsed, ...fallback] : fallback
      }
    } catch {
      return fallback
    }
  }

  const parts = value.split('/')
  if (parts.length > 1) {
    const parsed = normalizeLocation(parts[0], parts.slice(1).join('/'))
    return parsed ? [parsed, ...fallback] : fallback
  }

  return fallback
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders)
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ error: 'Not authenticated.' }, 401, corsHeaders)

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt)
    if (userError || !user) {
      return json({ error: 'Not authenticated.' }, 401, corsHeaders)
    }

    const body = await req.json().catch(() => ({}))
    const donationId = typeof body?.donationId === 'string' ? body.donationId.trim() : ''
    if (!donationId) {
      return json({ error: 'donationId is required' }, 400, corsHeaders)
    }

    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .select('id, member_id, reference, receipt_url')
      .eq('id', donationId)
      .maybeSingle()

    if (donationError || !donation) {
      return json({ error: 'Donation not found.' }, 404, corsHeaders)
    }

    const isOwner = donation.member_id === user.id

    let isDonationAdmin = false
    if (!isOwner) {
      const { data: adminRow } = await supabaseAdmin
        .from('admins')
        .select('id, role, permissions')
        .eq('id', user.id)
        .maybeSingle()
      isDonationAdmin = canManageDonations(adminRow)
      if (!donation.member_id) {
        isDonationAdmin = canViewGuestDonationReceipts(adminRow)
      }
    }

    if (!isOwner && !isDonationAdmin) {
      return json({ error: 'Not authorized.' }, 403, corsHeaders)
    }

    const attempted = parseStoredReceiptLocation(donation.receipt_url, donation.id)
    const seen = new Set<string>()

    for (const location of attempted) {
      const key = `${location.bucket}/${location.path}`
      if (seen.has(key)) continue
      seen.add(key)

      const { data, error } = await supabaseAdmin.storage
        .from(location.bucket)
        .createSignedUrl(location.path, 300)

      if (!error && data?.signedUrl) {
        return json(
          {
            signedUrl: data.signedUrl,
            bucket: location.bucket,
            path: location.path,
            reference: donation.reference ?? donation.id.slice(0, 8).toUpperCase(),
          },
          200,
          corsHeaders
        )
      }
    }

    return json({ error: 'Receipt file not found.' }, 404, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return json({ error: message }, 400, corsHeaders)
  }
})
