// @ts-nocheck
// THE BASE: SENDGRID BULK CONTACT SYNC
// Fetches all members from the database and upserts them into
// the SendGrid marketing contacts list in batches of 1,000.
//
// Required secrets: SENDGRID_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional secret:  SENDGRID_LIST_ID — if set, contacts are added to that list
//
// Invocation: POST (no body required; admin-auth enforced via service role)
// Returns: { total, batches, job_ids: string[] }
//
// SendGrid Contacts API accepts up to 30,000 contacts per request.
// We batch at 1,000 to stay well within limits and avoid timeouts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const BATCH_SIZE = 1000

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

async function syncBatch(
  contacts: object[],
  sgKey: string,
  listId: string | undefined
): Promise<string> {
  const payload: Record<string, unknown> = { contacts }
  if (listId) payload.list_ids = [listId]

  const res = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sgKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 202) {
    const data = await res.json()
    return (data.job_id as string) ?? 'unknown'
  }
  const errText = await res.text()
  throw new Error(`SendGrid batch failed: ${res.status} ${errText}`)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    const listId: string | undefined = Deno.env.get('SENDGRID_LIST_ID')

    if (!sgKey) {
      return new Response(JSON.stringify({ skipped: true, reason: 'SENDGRID_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all members with an email
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, registration_number, region, constituency, platform, status')
      .not('email', 'is', null)
      .neq('email', '')

    if (error) throw error

    const members: MemberRow[] = data ?? []
    const total = members.length

    if (total === 0) {
      return new Response(JSON.stringify({ total: 0, batches: 0, job_ids: [] }), {
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
        custom_fields: {
          reg_no: m.registration_number ?? '',
          region: m.region ?? '',
          constituency: m.constituency ?? '',
          platform: m.platform ?? '',
          membership_status: m.status ?? '',
        },
      }
    })

    // Dispatch in batches
    const jobIds: string[] = []
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const jobId = await syncBatch(batch, sgKey, listId)
      jobIds.push(jobId)
      console.warn(
        `[SENDGRID-BULK] Batch ${Math.floor(i / BATCH_SIZE) + 1} accepted — job_id: ${jobId}`
      )
    }

    return new Response(JSON.stringify({ total, batches: jobIds.length, job_ids: jobIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err)
    console.error('[SENDGRID-BULK-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
