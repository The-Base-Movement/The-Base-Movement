// THE BASE: SENDGRID SINGLE-CONTACT SYNC
// Upserts one member into the SendGrid marketing contacts list.
//
// Required secret: SENDGRID_API_KEY
// Optional secret: SENDGRID_LIST_ID  — if set, contact is added to a specific list
//
// Invocation: POST with JSON body:
//   { email, first_name, last_name, reg_no, region, constituency, platform, status }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      email,
      first_name = '',
      last_name = '',
      reg_no = '',
      region = '',
      constituency = '',
      platform = '',
      status = '',
    } = body as Record<string, string>

    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    // @ts-expect-error: Deno global
    const listId: string | undefined = Deno.env.get('SENDGRID_LIST_ID')

    if (!sgKey) {
      console.warn('[SENDGRID] SENDGRID_API_KEY not set — skipping contact sync for', email)
      return new Response(JSON.stringify({ skipped: true, reason: 'no api key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const contact: Record<string, string> = {
      email,
      first_name,
      last_name,
    }

    // Custom fields are referenced by the field name they were created with
    // in your SendGrid account (Marketing > Contacts > Custom Fields).
    // We include these as reserved fields where SendGrid accepts them,
    // and as custom_fields for the rest.
    const payload: Record<string, unknown> = {
      contacts: [
        {
          ...contact,
          custom_fields: {
            // These keys must match the SendGrid custom field names you've created.
            // Create them at: SendGrid > Marketing > Contacts > Custom Fields
            // Field names used here: e_0 through e_4 are placeholders — replace with
            // your actual field IDs after creating them in the SendGrid dashboard.
            reg_no,
            region,
            constituency,
            platform,
            membership_status: status,
          },
        },
      ],
    }

    if (listId) {
      payload.list_ids = [listId]
    }

    const res = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sgKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 202) {
      // SendGrid returns 202 Accepted — contact sync is queued asynchronously
      const data = await res.json()
      console.warn('[SENDGRID] Contact sync accepted for', email, '— job_id:', data.job_id)
      return new Response(JSON.stringify({ success: true, job_id: data.job_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      const errText = await res.text()
      console.error('[SENDGRID] Contact sync failed for', email, res.status, errText)
      return new Response(JSON.stringify({ error: errText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[SENDGRID-CONTACT-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
