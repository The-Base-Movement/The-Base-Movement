// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { csvImportWelcomeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'
import {
  canManageMembers,
  json,
  requireAuthorizedAdmin,
  getSenderEmail,
} from '../_shared/admin-auth.ts'

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
  const cleaned = (raw ?? '').trim()
  if (!cleaned) return '' // email-only accounts (e.g. admin/recovery) have no phone
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

async function getDummyEmail(phone: string): Promise<string> {
  const clean = phone.replace('+', '').trim()
  const msgBuffer = new TextEncoder().encode(clean)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hashHex.slice(0, 16)}@thebase.org`
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
    const sgKey = Deno.env.get('SENDGRID_API_KEY')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin has can_manage_members permission
    const authz = await requireAuthorizedAdmin(req, supabaseAdmin, canManageMembers)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
    const senderEmail = sgKey ? await getSenderEmail(supabaseAdmin) : ''

    for (const member of members) {
      const normalizedPhone = normalizePhoneNumber(member.phone)
      const tempPassword = generateTempPassword()

      try {
        // 1. A phone-only member gets a placeholder email; an email-only member
        //    (admin/recovery account) gets no phone at all.
        const finalEmail =
          member.email || (normalizedPhone ? await getDummyEmail(normalizedPhone) : '')
        if (!finalEmail) {
          failedUsers.push({ reg_no: member.reg_no, reason: 'No email or phone provided.' })
          continue
        }

        const createParams: Record<string, unknown> = {
          email: finalEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            reg_no: member.reg_no,
            name: member.name,
            must_change_password: true,
          },
        }
        if (normalizedPhone) {
          createParams.phone = normalizedPhone
          createParams.phone_confirm = true
        }

        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser(createParams)

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

        // 3. Deliver credentials — email if the member has one, else SMS.
        if (member.email && sgKey) {
          try {
            const html = csvImportWelcomeEmail({
              name: member.name,
              regNo: member.reg_no,
              phone: normalizedPhone || 'N/A',
              tempPassword,
              loginUrl: 'https://thebasemovement.info/login',
            })
            const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: member.email }] }],
                from: {
                  email: senderEmail,
                  name: 'The Base Movement',
                },
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
        } else if (normalizedPhone) {
          const sms = await sendSms(
            [normalizedPhone],
            `Welcome to The Base Movement, ${member.name}!\n\nYour login credentials:\nPhone: ${normalizedPhone}\nTemp Password: ${tempPassword}\n\nLogin at thebasemovement.info/login and change your password.\n- The Base`
          )
          if (!sms.ok) {
            console.warn(
              `[CSV-IMPORT] SMS failed for ${member.reg_no} (${sms.detail}). Generated credentials for ${member.name}:\nPhone: ${normalizedPhone}\nTemp Password: ${tempPassword}`
            )
          }
        } else {
          console.warn(
            `[CSV-IMPORT] No delivery channel (no email/SENDGRID or phone) for ${member.reg_no}.`
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
