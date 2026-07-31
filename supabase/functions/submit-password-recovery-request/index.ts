// @ts-ignore: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'
import { normalizeRecoveryPhone } from '../_shared/recovery-phone.ts'

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

async function notifyDiscord(fullName: string, phone: string): Promise<boolean> {
  const webhookUrl = Deno.env.get('DISCORD_PASSWORD_RESET_WEBHOOK_URL')?.trim()
  if (!webhookUrl) return false

  const maskedPhone = phone.length <= 6 ? phone : `${phone.slice(0, 4)}•••••${phone.slice(-3)}`
  const siteUrl = Deno.env.get('SITE_URL')?.trim() || 'https://www.thebasemovement.org.gh'
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: 'Password recovery request submitted',
          color: 0xf59e0b,
          fields: [
            { name: 'Full name', value: fullName, inline: false },
            { name: 'Old number', value: maskedPhone, inline: false },
            { name: 'Review page', value: `${siteUrl}/admin/password-resets`, inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  })

  return response.ok
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status,
    })

  if (req.method === 'OPTIONS') return handleCorsPreflight(req)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { full_name, old_phone } = await req.json()
    const fullName = String(full_name ?? '').trim()
    const oldPhone = String(old_phone ?? '').trim()
    if (!fullName || !oldPhone) {
      return json({ error: 'Full name and old number are required.' }, 400)
    }

    const normalizedOldPhone = normalizeRecoveryPhone(oldPhone)
    const rateCheck = await checkPersistentRateLimit(
      supabaseAdmin,
      `password-recovery-request::${clientIp(req)}::${normalizedOldPhone}`,
      5,
      3600
    )
    if (!rateCheck.allowed) {
      return json(
        {
          error: `Too many recovery requests. Please wait ${rateCheck.retry_after_sec} seconds.`,
        },
        429
      )
    }

    const { data: record, error: insertError } = await supabaseAdmin
      .from('password_recovery_requests')
      .insert({
        full_name: fullName,
        old_phone: oldPhone,
        normalized_old_phone: normalizedOldPhone,
      })
      .select('id')
      .single()
    if (insertError || !record) {
      throw new Error(insertError?.message || 'Failed to create recovery request.')
    }

    try {
      const notified = await notifyDiscord(fullName, normalizedOldPhone)
      if (notified) {
        await supabaseAdmin
          .from('password_recovery_requests')
          .update({ discord_notified_at: new Date().toISOString() })
          .eq('id', record.id)
      }
    } catch (discordError) {
      console.warn('[RECOVERY-REQUEST] Discord notification failed:', discordError)
    }

    return json(
      {
        success: true,
        message:
          'If the details match our records, your recovery request has been submitted for review.',
      },
      200
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[SUBMIT-PASSWORD-RECOVERY-REQUEST] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
