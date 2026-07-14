// @ts-nocheck
// THE BASE: SENDGRID BULK CONTACT SYNC (MIGRATED TO RESEND)
// Fetches all members from the database and upserts them into
// the Resend global contacts list.
//
// Required secrets: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Invocation: POST (no body required; admin-auth enforced via service role)
// Returns: { total, success, failed }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageNewsletters, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

interface MemberRow {
  id: string
  email: string
  full_name: string | null
  registration_number: string | null
  region: string | null
  constituency: string | null
  platform: string | null
  status: string | null
}

function splitName(full: string | null): { first_name: string; last_name: string } {
  const parts = (full ?? '').trim().split(/\s+/)
  return {
    first_name: parts[0] ?? '',
    last_name: parts.slice(1).join(' '),
  }
}

async function syncResendContactsInBulk(contacts: any[], resendApiKey: string) {
  const CONCURRENCY_LIMIT = 8
  let index = 0
  const results = { success: 0, failed: 0 }

  async function worker() {
    while (index < contacts.length) {
      const currentIdx = index++
      const contact = contacts[currentIdx]
      if (!contact) break

      try {
        const createRes = await fetch('https://api.resend.com/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(contact),
        })

        if (createRes.ok) {
          results.success++
          continue
        }

        // If it failed (e.g. contact already exists), update via PATCH
        const updateRes = await fetch(
          `https://api.resend.com/contacts/${encodeURIComponent(contact.email)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              first_name: contact.first_name,
              last_name: contact.last_name,
              properties: contact.properties,
            }),
          }
        )

        if (updateRes.ok) {
          results.success++
        } else {
          results.failed++
        }
      } catch (err) {
        results.failed++
      }
    }
  }

  // Spawn workers
  const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, contacts.length) }, () =>
    worker()
  )
  await Promise.all(workers)

  return results
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const resendApiKey: string | undefined = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response(JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const authz = await requireAuthorizedAdmin(req, supabase, canManageNewsletters)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ensure contact properties exist in Resend
    const props = [
      { key: 'reg_no', type: 'string' },
      { key: 'region', type: 'string' },
      { key: 'constituency', type: 'string' },
      { key: 'platform', type: 'string' },
      { key: 'membership_status', type: 'string' },
    ]
    for (const prop of props) {
      try {
        await fetch('https://api.resend.com/contact-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(prop),
        })
      } catch (e) {
        // Safe to ignore if already exists or schema setup fails
      }
    }

    // Fetch all members with an email
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, registration_number, region, constituency, platform, status')
      .not('email', 'is', null)
      .neq('email', '')

    if (error) throw error

    // Keep only rows with a syntactically valid email.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const members: MemberRow[] = (data ?? [])
      .map((m: MemberRow) => ({ ...m, email: (m.email ?? '').trim() }))
      .filter((m: MemberRow) => EMAIL_RE.test(m.email))
    const total = members.length

    if (total === 0) {
      return new Response(JSON.stringify({ total: 0, success: 0, failed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Build contact objects
    const contacts = members.map((m) => {
      const { first_name, last_name } = splitName(m.full_name)
      return {
        email: m.email,
        first_name,
        last_name,
        unsubscribed: false,
        properties: {
          reg_no: m.registration_number ?? '',
          region: m.region ?? '',
          constituency: m.constituency ?? '',
          platform: m.platform ?? '',
          membership_status: m.status ?? '',
        },
      }
    })

    // Sync in bulk using concurrency queue
    const syncResult = await syncResendContactsInBulk(contacts, resendApiKey)

    return new Response(
      JSON.stringify({
        total,
        success: syncResult.success,
        failed: syncResult.failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err)
    console.error('[RESEND-BULK-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
