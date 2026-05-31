// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { csvImportWelcomeEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'

function generateTempPassword(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('')
}

function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // @ts-expect-error: Deno global
    const atApiKey = Deno.env.get('AT_API_KEY')
    // @ts-expect-error: Deno global
    const atUsername = Deno.env.get('AT_USERNAME')
    // @ts-expect-error: Deno global
    const sgKey = Deno.env.get('SENDGRID_API_KEY')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { members } = await req.json()
    if (!members || !Array.isArray(members)) {
      return new Response(JSON.stringify({ error: 'Invalid members array in request body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const createdUsers = []
    const skippedUsers = []
    const failedUsers = []

    for (const member of members) {
      const normalizedPhone = normalizePhoneNumber(member.phone)
      const tempPassword = generateTempPassword()

      try {
        // 1. Generate a standard dummy email fallback if missing to bypass Phone-Auth signup restrictions
        const finalEmail = member.email || `${normalizedPhone.replace('+', '')}@thebase.org`

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          phone: normalizedPhone,
          password: tempPassword,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            reg_no: member.reg_no,
            name: member.name,
            must_change_password: true,
          },
        })

        if (authError) {
          if (authError.message.includes('already exists') || authError.status === 400) {
            skippedUsers.push({ reg_no: member.reg_no, reason: 'Auth account already exists.' })
            continue
          }
          throw authError
        }

        const newUserId = authData.user?.id
        if (!newUserId) {
          throw new Error('User creation returned empty ID.')
        }

        // 2. Update the public.users table to map primary key id to auth user ID
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .update({
            id: newUserId,
            must_change_password: true,
            temp_password_sent_at: new Date().toISOString(),
          })
          .eq('registration_number', member.reg_no)

        if (dbError) {
          console.error(
            `[CSV-IMPORT] Failed to update public.users record for ${member.reg_no}:`,
            dbError
          )
          // Attempt to roll back auth user if profile linking fails to prevent orphaned accounts
          await supabaseAdmin.auth.admin.deleteUser(newUserId)
          failedUsers.push({
            reg_no: member.reg_no,
            reason: `DB update failed: ${dbError.message}`,
          })
          continue
        }

        // 3. Send SMS via Africa's Talking API if secrets are loaded
        if (atApiKey && atUsername) {
          try {
            const smsRes = await fetch('https://api.africastalking.com/version1/messaging', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                apiKey: atApiKey,
              },
              body: new URLSearchParams({
                username: atUsername,
                to: normalizedPhone,
                message: `Welcome to The Base Movement, ${member.name}!\n\nYour login credentials:\nPhone: ${normalizedPhone}\nTemp Password: ${tempPassword}\n\nLogin at nevermind-beta.vercel.app/login and change your password.\n- The Base`,
                from: 'THEBASE',
              }),
            })
            if (!smsRes.ok) {
              const smsErr = await smsRes.text()
              console.error(
                `[CSV-IMPORT] Africa's Talking SMS failed for ${member.reg_no}:`,
                smsErr
              )
            }
          } catch (smsErr) {
            console.error(`[CSV-IMPORT] SMS dispatch network error for ${member.reg_no}:`, smsErr)
          }
        } else {
          console.warn(
            `[CSV-IMPORT] AT_API_KEY or AT_USERNAME not set. Generated credentials for ${member.name} (${member.reg_no}):\nPhone: ${normalizedPhone}\nTemp Password: ${tempPassword}`
          )
        }

        // 4. Send email via SendGrid if member has an email address
        if (sgKey && member.email) {
          try {
            const html = csvImportWelcomeEmail({
              name: member.name,
              regNo: member.reg_no,
              phone: normalizedPhone,
              tempPassword,
              loginUrl: 'https://nevermind-beta.vercel.app/login',
            })
            const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: member.email }] }],
                from: { email: 'brastyphler17@gmail.com', name: 'The Base Movement' },
                subject: 'Your Base Movement account is ready',
                content: [{ type: 'text/html', value: html }],
              }),
            })
            if (!emailRes.ok) {
              const emailErr = await emailRes.text()
              console.error(`[CSV-IMPORT] SendGrid email failed for ${member.reg_no}:`, emailErr)
            }
          } catch (emailErr) {
            console.error(`[CSV-IMPORT] Email dispatch error for ${member.reg_no}:`, emailErr)
          }
        } else if (!sgKey) {
          console.warn(
            `[CSV-IMPORT] SENDGRID_API_KEY not set — skipping email for ${member.reg_no}`
          )
        }

        createdUsers.push({ reg_no: member.reg_no, phone: normalizedPhone, tempPassword })
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error(`[CSV-IMPORT-ROW-ERROR] Failed for ${member.reg_no}:`, errMsg)
        failedUsers.push({ reg_no: member.reg_no, reason: errMsg })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: createdUsers.length,
        skipped: skippedUsers.length,
        failed: failedUsers.length,
        createdUsers: createdUsers.map((u) => ({
          reg_no: u.reg_no,
          phone: u.phone,
          tempPassword: u.tempPassword,
        })),
        skippedUsers,
        failedUsers,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[CSV-IMPORT-GLOBAL-ERROR] ${errorMessage}`)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
