// THE BASE: BACKFILL DONATION RECEIPTS
// Generates + stores HTML receipts for all Verified donations that don't have one yet.
// Does NOT send emails — this is a silent catch-up for pre-existing donations.
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { donationReceiptHtml } from '../_shared/email-templates.ts'
import { isPrivilegedAdminRole, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

const SITE_BASE = 'https://thebasemovement.info'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAdmin = createClient(supabaseUrl, serviceKey)

  // Authorize caller using admin credentials or service role fallback
  const authz = await requireAuthorizedAdmin(
    req,
    supabaseAdmin,
    (admin) => isPrivilegedAdminRole(admin.role),
    {
      allowServiceRole: true,
      serviceRoleKey: serviceKey,
    }
  )

  if (!authz.ok) {
    return new Response(await authz.response.text(), {
      status: authz.response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
  const force: boolean = body?.force === true

  interface DonationRow {
    id: string
    full_name: string
    amount: number | string
    payment_method: string | null
    reference: string
    hubtel_reference: string | null
    created_at: string
    verification_notes: string | null
    donation_campaigns: { title: string } | null
  }

  try {
    // Fetch Verified donations — all when force=true, otherwise only those missing a receipt
    const baseSelect = supabaseAdmin
      .from('donations')
      .select(
        'id, full_name, amount, payment_method, reference, hubtel_reference, created_at, verification_notes, donation_campaigns(title)'
      )
      .eq('status', 'Verified')
      .order('created_at', { ascending: true })

    const { data, error } = force ? await baseSelect : await baseSelect.is('receipt_url', null)

    if (error) throw new Error(`Failed to fetch donations: ${error.message}`)
    const rows = (data ?? []) as DonationRow[]

    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const dateStr =
          new Date(row.created_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Accra',
          }) + ' GMT'

        const amountStr = `₵${Number(row.amount).toFixed(2)}`

        const html = donationReceiptHtml({
          name: row.full_name,
          amount: amountStr,
          method: row.payment_method ?? 'N/A',
          reference: row.reference,
          hubtelReference: row.hubtel_reference ?? undefined,
          date: dateStr,
          campaign: row.donation_campaigns?.title ?? undefined,
          internalNote: row.verification_notes ?? undefined,
          logoUrl: `${SITE_BASE}/public/branding/logo.png`,
          eagleUrl: `${SITE_BASE}/public/brand/eagle-in-flight.webp`,
        })

        const encoder = new TextEncoder()
        const { error: uploadError } = await supabaseAdmin.storage
          .from('receipts')
          .upload(`${row.id}.html`, encoder.encode(html), {
            contentType: 'text/html',
            upsert: true,
          })

        if (uploadError) throw new Error(uploadError.message)

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('receipts').getPublicUrl(`${row.id}.html`)

        const { error: updateError } = await supabaseAdmin
          .from('donations')
          .update({ receipt_url: publicUrl })
          .eq('id', row.id)

        if (updateError) throw new Error(updateError.message)

        processed++
      } catch (err: unknown) {
        failed++
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${row.id}: ${msg}`)
        console.error(`[BACKFILL] Failed for ${row.id}:`, msg)
      }
    }

    return new Response(
      JSON.stringify({ success: true, force, total: rows.length, processed, failed, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[BACKFILL-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
