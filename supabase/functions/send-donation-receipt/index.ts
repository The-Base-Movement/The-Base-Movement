// THE BASE: DONATION RECEIPT — generates HTML receipt + emails member
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { donationReceiptEmail, donationReceiptHtml } from '../_shared/email-templates.ts'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const { donationId } = (await req.json()) as { donationId: string }
    if (!donationId) throw new Error('donationId is required')

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
      users: { email: string } | null
    }

    const { data, error: donErr } = await supabaseAdmin
      .from('donations')
      .select(
        'id, full_name, amount, payment_method, reference, created_at, member_id, hubtel_reference, receipt_url, users(email)'
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
      const html = donationReceiptHtml({
        name: row.full_name,
        amount: amountStr,
        method: row.payment_method ?? 'N/A',
        reference: row.reference,
        hubtelReference: row.hubtel_reference ?? undefined,
        date: dateStr,
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
      return new Response(JSON.stringify({ success: true, skipped: true, receiptUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const html = donationReceiptEmail({
      name: row.full_name,
      amount: amountStr,
      method: row.payment_method ?? 'N/A',
      reference: row.reference,
      date: dateStr,
      monthlyUrl: 'https://thebasemovement.com/dashboard/donate',
      receiptPdfUrl: receiptUrl ?? undefined,
    })

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    if (sgKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: memberEmail }] }],
          from: { email: 'noreply@thebasemovement.com', name: 'The Base Movement' },
          subject: `Your ${amountStr} contribution is confirmed — Receipt ${row.reference}`,
          content: [{ type: 'text/html', value: html }],
        }),
      })
      console.log('[RECEIPT] Email sent to', memberEmail, res.status)
    } else {
      console.warn('[RECEIPT] SENDGRID_API_KEY not set — would send to', memberEmail)
    }

    return new Response(JSON.stringify({ success: true, receiptUrl }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[RECEIPT-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
