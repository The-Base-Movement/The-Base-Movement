// THE BASE: DONATION RECEIPT — generates HTML receipt + emails + SMS member
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { donationReceiptEmail, donationReceiptHtml } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'
import { json, requireServiceRoleCall, getSenderEmail } from '../_shared/admin-auth.ts'

const SITE_BASE = 'https://thebasemovement.info'

function normalizePhone(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) return cleaned
  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // @ts-ignore: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) return authz.response

    const { donationId } = (await req.json()) as { donationId: string }
    if (!donationId) throw new Error('donationId is required')

    // @ts-ignore: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, serviceKey ?? '')

    interface DonationRow {
      id: string
      full_name: string
      amount: number | string
      payment_method: string | null
      reference: string
      created_at: string
      member_id: string | null
      hubtel_reference: string | null
      receipt_url: string | null
      verification_notes: string | null
      users: { email: string; phone_number: string | null } | null
      donation_campaigns: { title: string } | null
    }

    const { data, error: donErr } = await supabaseAdmin
      .from('donations')
      .select(
        'id, full_name, amount, payment_method, reference, created_at, member_id, hubtel_reference, receipt_url, verification_notes, users(email, phone_number), donation_campaigns(title)'
      )
      .eq('id', donationId)
      .single()

    if (donErr || !data) throw new Error(`Donation not found: ${donErr?.message}`)
    const row = data as unknown as DonationRow

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

    // ── 1. Generate + upload receipt HTML if not already stored ──────────────
    let receiptUrl = row.receipt_url ?? null

    if (!receiptUrl) {
      // Branding comes from the DB: logo path from site_settings (same source as
      // the frontend's BrandingContext), eagle artwork from the media library.
      const [logoRes, eagleRes] = await Promise.all([
        supabaseAdmin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle(),
        supabaseAdmin
          .from('media_library')
          .select('url')
          .eq('filename', 'eagle-in-flight.webp')
          .maybeSingle(),
      ])

      const logoPath = (logoRes.data?.value as string | null) ?? '/branding/logo.png'
      const logoUrl = logoPath.startsWith('http') ? logoPath : `${SITE_BASE}${logoPath}`
      const eagleUrl =
        (eagleRes.data?.url as string | null) ??
        `${SITE_BASE}/branding/patterns/eagle-in-flight.webp`

      const html = donationReceiptHtml({
        name: row.full_name,
        amount: amountStr,
        method: row.payment_method ?? 'N/A',
        reference: row.reference,
        hubtelReference: row.hubtel_reference ?? undefined,
        date: dateStr,
        campaign: row.donation_campaigns?.title ?? undefined,
        internalNote: row.verification_notes ?? undefined,
        logoUrl,
        eagleUrl,
      })

      const encoder = new TextEncoder()
      const { error: uploadError } = await supabaseAdmin.storage
        .from('receipts')
        .upload(`${donationId}.html`, encoder.encode(html), {
          contentType: 'text/html',
          upsert: true,
        })

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('receipts').getPublicUrl(`${donationId}.html`)

        receiptUrl = publicUrl

        await supabaseAdmin
          .from('donations')
          .update({ receipt_url: publicUrl })
          .eq('id', donationId)
      } else {
        console.error('[RECEIPT] Upload failed:', uploadError.message)
      }
    }

    // ── 2. Send email ─────────────────────────────────────────────────────────
    const memberEmail = row.users?.email
    if (!memberEmail) {
      console.warn('[RECEIPT] No email for member_id', row.member_id, '— skipping email')
    } else {
      const emailHtml = donationReceiptEmail({
        name: row.full_name,
        amount: amountStr,
        method: row.payment_method ?? 'N/A',
        reference: row.reference,
        date: dateStr,
        monthlyUrl: 'https://thebasemovement.info/dashboard/donate',
        receiptPdfUrl: receiptUrl ?? undefined,
      })

      // @ts-expect-error: Deno global
      const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

      if (sgKey) {
        const senderEmail = await getSenderEmail(supabaseAdmin)
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: memberEmail }] }],
            from: { email: senderEmail, name: 'The Base Movement' },
            subject: `Your ${amountStr} contribution is confirmed — Receipt ${row.reference}`,
            content: [{ type: 'text/html', value: emailHtml }],
          }),
        })
        console.log('[RECEIPT] Email sent to', memberEmail, res.status)
      } else {
        console.warn('[RECEIPT] SENDGRID_API_KEY not set — would send to', memberEmail)
      }
    }

    // ── 3. Send SMS via MNotify ───────────────────────────────────────────────
    const rawPhone = row.users?.phone_number
    if (rawPhone) {
      const phone = normalizePhone(rawPhone)
      const sms = await sendSms(
        [phone],
        `Hi ${row.full_name.split(' ')[0]}! Your ${amountStr} contribution to The Base Movement is confirmed. Ref: ${row.reference}.${receiptUrl ? ` Download receipt: ${receiptUrl}` : ''} Thank you, Patriot!`
      )
      if (sms.ok) {
        console.log('[RECEIPT-SMS] Sent to', phone)
      }
    } else {
      console.warn('[RECEIPT-SMS] No phone for member_id', row.member_id)
    }

    return new Response(JSON.stringify({ success: true, receiptUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[RECEIPT-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
