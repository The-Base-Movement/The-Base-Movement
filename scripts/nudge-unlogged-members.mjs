import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Auto-load .env ────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        const val = trimmed.slice(idx + 1).trim()
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY

if (!SERVICE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY in your environment or .env file.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const DRY_RUN = process.env.DRY_RUN !== 'false'
const BATCH_SIZE = 25

function normalizeGhanaPhone(raw) {
  if (!raw) return ''
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('233')) return digits
  if (trimmed.startsWith('+')) return digits
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return `233${digits}`
}

function formatSmsText(name, regNo) {
  const firstName = (name || 'Compatriot').split(' ')[0]
  return `Akwaaba ${firstName}! Activate your official member dashboard to verify your membership and download your digital ID card: https://www.thebasemovement.org.gh/login (Reg No: ${regNo}) - The Base`
}

async function sendMnotifySms(phone, message) {
  if (!MNOTIFY_API_KEY) {
    console.warn(`[SMS-MNOTIFY] MNOTIFY_API_KEY is not set in .env!`)
    return false
  }
  const normalized = normalizeGhanaPhone(phone)
  if (!normalized) return false

  try {
    const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(MNOTIFY_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        recipient: [normalized],
        sender: process.env.MNOTIFY_SENDER_ID || 'The Base',
        message,
        is_schedule: false,
        schedule_date: '',
      }),
    })
    const text = await res.text()
    if (res.ok && (text.includes('success') || text.includes('2000'))) {
      return true
    }
    console.warn(`⚠️ mNotify SMS failed for ${phone}: ${text}`)
    return false
  } catch (err) {
    console.warn(`⚠️ SMS error for ${phone}: ${err.message}`)
    return false
  }
}

async function main() {
  console.log(`🚀 Starting Unlogged Member Activation Nudge... (DRY_RUN = ${DRY_RUN})\n`)

  // Query users who are unverified or pending activation
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone_number, registration_number, chapter, status, verification_status')
    .or('status.eq.Pending,status.eq.In Review,verification_status.eq.Unverified,verification_status.is.null')
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching unlogged/unverified members:', error.message)
    process.exit(1)
  }

  console.log(`📊 Found ${users.length} members who need dashboard activation / membership verification.`)
  if (users.length === 0) {
    console.log('🎉 All members are active and verified!')
    return
  }

  console.log('\n--- SAMPLE SMS TEXT ---')
  const sampleUser = users[0]
  console.log(formatSmsText(sampleUser.full_name, sampleUser.registration_number))
  console.log('-----------------------\n')

  if (DRY_RUN) {
    console.log('📋 --- DRY RUN ACTIVE: LISTING RECIPIENTS ---')
    users.slice(0, 30).forEach((u, i) => {
      console.log(`[${i + 1}] ${u.full_name} | Reg: ${u.registration_number} | Phone: ${u.phone_number || 'N/A'} | Email: ${u.email || 'N/A'} | Status: ${u.status || 'N/A'}`)
    })
    if (users.length > 30) {
      console.log(`... and ${users.length - 30} more members.`)
    }
    console.log('---------------------------------------------')
    console.log('\nTo execute dispatch for real, set DRY_RUN=false:')
    console.log('  $env:DRY_RUN="false"; node scripts/nudge-unlogged-members.mjs')
    return
  }

  // Create temporary SUPER_ADMIN credentials to authenticate Edge Function calls
  const tempEmail = `temp_nudge_admin_${Date.now()}@thebasemovement.org.gh`
  const tempPassword = `TempNudgeAdmin${Math.floor(1000 + Math.random() * 9000)}!`

  console.log(`\n🔑 Authenticating admin caller session for Edge Function dispatches...`)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    console.error('❌ Failed to create admin user:', authError?.message)
    process.exit(1)
  }

  const tempAdminId = authData.user.id

  try {
    await supabase.from('users').insert({
      id: tempAdminId,
      full_name: 'Temp Nudge Admin',
      platform: 'GHANA',
      registration_number: `TBM-GH-TEMP-${Date.now().toString().slice(-4)}`,
      status: 'Active',
      country: 'Ghana',
    })

    await supabase.from('admins').insert({
      id: tempAdminId,
      role: 'SUPER_ADMIN',
      permissions: { can_manage_members: true },
    })

    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword,
    })

    if (loginError || !sessionData.session) {
      throw new Error(`Login failed: ${loginError?.message}`)
    }

    const callerJwt = sessionData.session.access_token

    console.log(`\n✉️ Sending notifications in batches of ${BATCH_SIZE}...`)
    let emailsSent = 0
    let smsSent = 0

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}...`)

      for (const u of batch) {
        const smsContent = formatSmsText(u.full_name, u.registration_number)

        // Dispatch SMS via mNotify if phone number exists
        if (u.phone_number) {
          const sent = await sendMnotifySms(u.phone_number, smsContent)
          if (sent) smsSent++
        }

        // Dispatch Email via send-welcome-email Edge Function if email exists
        if (u.email) {
          try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${callerJwt}`,
              },
              body: JSON.stringify({
                type: 'unlogged_nudge',
                email: u.email,
                name: u.full_name,
                regNo: u.registration_number,
                chapter: u.chapter,
              }),
            })
            if (res.ok) emailsSent++
          } catch (err) {
            console.warn(`⚠️ Email send error for ${u.registration_number}:`, err.message)
          }
        }
      }
    }

    console.log(`\n✅ Dispatch complete! Emails sent: ${emailsSent}, SMS sent: ${smsSent}`)
  } finally {
    // Cleanup temporary admin user
    await supabase.from('admins').delete().eq('id', tempAdminId)
    await supabase.from('users').delete().eq('id', tempAdminId)
    await supabase.auth.admin.deleteUser(tempAdminId)
  }
}

main().catch(console.error)
