import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY in your environment.')
  console.error('Example: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/nudge-unlogged-members.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const DRY_RUN = process.env.DRY_RUN !== 'false'
const BATCH_SIZE = 25

function formatSmsText(name, regNo) {
  const firstName = (name || 'Compatriot').split(' ')[0]
  return `Akwaaba ${firstName}! Activate your official member dashboard to verify your membership and download your digital ID card: https://www.thebasemovement.org.gh/login (Reg No: ${regNo}) - The Base`
}

async function main() {
  console.log(`🚀 Starting Unlogged Member Activation Nudge... (DRY_RUN = ${DRY_RUN})\n`)

  // Query users who have never logged in (last_login_at is null OR must_change_password is true)
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone_number, registration_number, chapter, last_login_at, must_change_password, status')
    .or('last_login_at.is.null,must_change_password.eq.true')
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching unlogged members:', error.message)
    process.exit(1)
  }

  console.log(`📊 Found ${users.length} members who have never logged in or haven't activated their account.`)
  if (users.length === 0) {
    console.log('🎉 All members have logged in!')
    return
  }

  console.log('\n--- SAMPLE SMS TEXT ---')
  const sampleUser = users[0]
  console.log(formatSmsText(sampleUser.full_name, sampleUser.registration_number))
  console.log('-----------------------\n')

  if (DRY_RUN) {
    console.log('📋 --- DRY RUN ACTIVE: LISTING RECIPIENTS ---')
    users.slice(0, 20).forEach((u, i) => {
      console.log(`[${i + 1}] ${u.full_name} | Reg: ${u.registration_number} | Phone: ${u.phone_number || 'N/A'} | Email: ${u.email || 'N/A'} | Chapter: ${u.chapter || 'Unassigned'}`)
    })
    if (users.length > 20) {
      console.log(`... and ${users.length - 20} more members.`)
    }
    console.log('---------------------------------------------')
    console.log('\nTo execute dispatch for real, set DRY_RUN=false:')
    console.log('  $env:DRY_RUN="false"; node scripts/nudge-unlogged-members.mjs')
    return
  }

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
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/send-sms-hook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: u.phone_number,
              message: smsContent,
            }),
          })
          if (res.ok) smsSent++
        } catch (err) {
          console.warn(`⚠️ SMS send error for ${u.registration_number}:`, err.message)
        }
      }

      // Dispatch Email via Resend if email exists
      if (u.email) {
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
}

main().catch(console.error)
