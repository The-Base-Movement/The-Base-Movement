// THE BASE: DONATION RECEIPT EMAIL
// Called after a donation is verified by an admin.
// Set RESEND_API_KEY in Supabase secrets to activate sending.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { donationReceiptEmail } from '../_shared/email-templates.ts'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const { donationId } = await req.json()
    if (!donationId) throw new Error('donationId is required')

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch donation + member email via join
    const { data: donation, error: donErr } = await supabaseAdmin
      .from('donations')
      .select(
        'id, full_name, amount, payment_method, reference, created_at, member_id, users(email)'
      )
      .eq('id', donationId)
      .single()

    if (donErr || !donation) throw new Error(`Donation not found: ${donErr?.message}`)

    interface DonationRow {
      id: string
      full_name: string
      amount: number | string
      payment_method: string
      reference: string
      created_at: string
      member_id: string | null
      users: { email: string } | null
    }
    const row = donation as unknown as DonationRow

    const memberEmail = row.users?.email
    if (!memberEmail) {
      console.warn('[RECEIPT] No email for member_id', row.member_id, '— skipping')
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
    const html = donationReceiptEmail({
      name: row.full_name,
      amount: amountStr,
      method: row.payment_method ?? 'N/A',
      reference: row.reference,
      date: dateStr,
      monthlyUrl: 'https://thebasemovement.com/dashboard/donate',
    })

    // @ts-expect-error: Deno global
    const resendKey: string | undefined = Deno.env.get('RESEND_API_KEY')

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'The Base Movement <noreply@thebasemovement.com>',
          to: [memberEmail],
          subject: `Your ${amountStr} contribution is confirmed — Receipt ${row.reference}`,
          html,
        }),
      })
      const data = await res.json()
      console.warn('[RECEIPT] Sent to', memberEmail, data)
    } else {
      console.warn('[RECEIPT] RESEND_API_KEY not set — would send to', memberEmail)
    }

    return new Response(JSON.stringify({ success: true }), {
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
