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

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vhlyekyxutwbxlvktnzd.supabase.co'
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
// One campaign key per send. Every dispatch is written to member_nudges under
// this key, and the audience query excludes anyone already logged against it,
// so re-running the script never re-contacts the same member.
const CAMPAIGN = process.env.CAMPAIGN || 'activate_dashboard_2026_08'
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : 0
// 'GHANA' | 'DIASPORA' | '' (both). The constituency backlog this campaign
// targets is Ghana-only, and mNotify SMS to foreign numbers costs more and
// delivers less reliably -- so scope deliberately rather than by accident.
const PLATFORM = (process.env.PLATFORM || '').toUpperCase()
const PAGE_SIZE = 1000

// Mirrors isGhanaNumber() in supabase/functions/_shared/sms.ts. MNotify is the
// cheap domestic route and is used for Ghana numbers only; diaspora numbers go
// to Twilio. Sending a foreign number through MNotify burns a credit for poor
// delivery, which is the exact waste this campaign cannot afford.
function isGhanaNumber(raw) {
  const trimmed = (raw || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return false
  if (digits.startsWith('233')) return true
  if (trimmed.startsWith('+')) return false
  if (digits.startsWith('00')) return false
  return true
}

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
    const res = await fetch(
      `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(MNOTIFY_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          recipient: [normalized],
          sender: process.env.MNOTIFY_SENDER_ID || 'The Base',
          message,
          is_schedule: false,
          schedule_date: '',
        }),
      }
    )
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

  // Audience = members who have NEVER signed in (auth.users.last_sign_in_at is
  // null), minus opt-outs, minus anyone already logged for this campaign.
  // The previous version filtered on verification status instead, which is a
  // different question entirely and included members who log in regularly.
  // Paged: PostgREST caps a single response at 1000 rows, and the audience is
  // north of 12,000 -- an unpaged read silently nudges the first 1000 only.
  const fetchAudience = async (channel) => {
    const all = []
    for (let page = 0; ; page++) {
      const { data, error } = await supabase
        .rpc('get_nudge_audience', { p_campaign: CAMPAIGN, p_channel: channel })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      if (error) {
        console.error(`Error fetching ${channel} audience:`, error.message)
        process.exit(1)
      }
      all.push(...(data || []))
      if (!data || data.length < PAGE_SIZE) break
    }
    return PLATFORM ? all.filter((u) => (u.platform || '').toUpperCase() === PLATFORM) : all
  }

  const allSmsTargets = await fetchAudience('sms')
  let smsTargets = allSmsTargets.filter((u) => isGhanaNumber(u.phone_number))
  const intlSmsTargets = allSmsTargets.filter((u) => !isGhanaNumber(u.phone_number))
  let emailTargets = await fetchAudience('email')
  if (LIMIT > 0) {
    smsTargets = smsTargets.slice(0, LIMIT)
    emailTargets = emailTargets.slice(0, LIMIT)
  }

  console.log(`📊 Campaign "${CAMPAIGN}" — never-signed-in members still to contact:`)
  console.log(`   SMS via MNotify (Ghana):    ${smsTargets.length}`)
  console.log(
    `   SMS via Twilio (diaspora):  ${intlSmsTargets.length}  [not dispatched by this script]`
  )
  console.log(`   Email via Resend:           ${emailTargets.length}`)
  if (LIMIT > 0) console.log(`   (capped by LIMIT=${LIMIT})`)

  const users = smsTargets
  if (smsTargets.length === 0 && emailTargets.length === 0) {
    console.log('🎉 Nobody left to contact on this campaign.')
    return
  }

  console.log('\n--- SAMPLE SMS TEXT ---')
  const sampleUser = users[0]
  console.log(formatSmsText(sampleUser.full_name, sampleUser.registration_number))
  console.log('-----------------------\n')

  if (DRY_RUN) {
    console.log('📋 --- DRY RUN ACTIVE: LISTING RECIPIENTS ---')
    users.slice(0, 30).forEach((u, i) => {
      console.log(
        `[${i + 1}] ${u.full_name} | Reg: ${u.registration_number} | Phone: ${u.phone_number || 'N/A'} | Email: ${u.email || 'N/A'}`
      )
    })
    if (users.length > 30) {
      console.log(`... and ${users.length - 30} more members.`)
    }
    console.log(`
Estimated SMS credits needed: ${smsTargets.length} (mNotify balance is checked at dispatch).`)
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

    // Claim the member BEFORE dispatching. The unique index on
    // (user_id, channel, campaign) means a claim that fails is a member
    // someone else already contacted -- skip rather than double-send. Erring
    // this way can log a send that then fails, which is the safe direction.
    const claim = async (u, channel, recipient) => {
      const { error } = await supabase
        .from('member_nudges')
        .insert({ user_id: u.user_id, channel, campaign: CAMPAIGN, recipient })
      if (error) {
        if (error.code === '23505') return false // already nudged on this campaign
        console.warn(`Could not claim ${channel} for ${u.registration_number}: ${error.message}`)
        return false
      }
      return true
    }

    const markFailed = async (u, channel, response) => {
      await supabase
        .from('member_nudges')
        .update({ status: 'failed', provider_response: String(response).slice(0, 500) })
        .eq('user_id', u.user_id)
        .eq('channel', channel)
        .eq('campaign', CAMPAIGN)
    }

    console.log(`
Sending notifications in batches of ${BATCH_SIZE}...`)
    let emailsSent = 0
    let smsSent = 0
    let smsFailed = 0
    let emailsFailed = 0

    for (let i = 0; i < smsTargets.length; i += BATCH_SIZE) {
      const batch = smsTargets.slice(i, i + BATCH_SIZE)
      console.log(
        `SMS batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(smsTargets.length / BATCH_SIZE)}...`
      )
      for (const u of batch) {
        if (!(await claim(u, 'sms', u.phone_number))) continue
        const sent = await sendMnotifySms(
          u.phone_number,
          formatSmsText(u.full_name, u.registration_number)
        )
        if (sent) {
          smsSent++
        } else {
          smsFailed++
          await markFailed(u, 'sms', 'mnotify send failed')
        }
      }
    }

    for (let i = 0; i < emailTargets.length; i += BATCH_SIZE) {
      const batch = emailTargets.slice(i, i + BATCH_SIZE)
      console.log(
        `Email batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(emailTargets.length / BATCH_SIZE)}...`
      )
      for (const u of batch) {
        if (!(await claim(u, 'email', u.email))) continue
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
          if (res.ok) {
            emailsSent++
          } else {
            emailsFailed++
            await markFailed(u, 'email', `HTTP ${res.status}`)
          }
        } catch (err) {
          emailsFailed++
          await markFailed(u, 'email', err.message)
          console.warn(`Email send error for ${u.registration_number}:`, err.message)
        }
      }
    }

    console.log(`
Dispatch complete. SMS sent: ${smsSent} (failed ${smsFailed}), emails sent: ${emailsSent} (failed ${emailsFailed})`)
    console.log(`Every dispatch is logged in member_nudges under campaign "${CAMPAIGN}".`)
  } finally {
    // Cleanup temporary admin user
    await supabase.from('admins').delete().eq('id', tempAdminId)
    await supabase.from('users').delete().eq('id', tempAdminId)
    await supabase.auth.admin.deleteUser(tempAdminId)
  }
}

main().catch(console.error)
