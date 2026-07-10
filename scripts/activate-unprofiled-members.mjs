import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY in your environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const DRY_RUN = process.env.DRY_RUN !== 'false'
const BATCH_SIZE = 15 // Small batches to avoid overloading the email/SMS gateway

async function main() {
  console.log(`🚀 Starting member activation... (DRY_RUN = ${DRY_RUN})`)

  // 1. Fetch the 170 users who have neither region nor constituency
  console.log('🔍 Fetching unassigned Ghana members from database...')
  const { data: users, error: fetchErr } = await supabase
    .from('users')
    .select('id, full_name, email, phone_number, registration_number')
    .eq('platform', 'GHANA')
    .or('region.is.null,region.eq.""')
    .or('constituency.is.null,constituency.eq.""')

  if (fetchErr) {
    console.error('❌ Failed to fetch users:', fetchErr.message)
    process.exit(1)
  }

  console.log(`📊 Found ${users.length} unassigned members.`)
  if (users.length === 0) {
    console.log('🎉 No unassigned members to activate.')
    return
  }

  if (DRY_RUN) {
    console.log('\n📋 --- DRY RUN ACTIVE: LISTING MEMBERS ---')
    users.forEach((u, i) => {
      console.log(`[${i + 1}] Name: ${u.full_name} | Phone: ${u.phone_number || 'None'} | Email: ${u.email || 'None'} | Reg: ${u.registration_number}`)
    })
    console.log('------------------------------------------')
    console.log('\nTo run activation for real, set DRY_RUN=false env variable:')
    console.log('  $env:DRY_RUN="false"; node scripts/activate-unprofiled-members.mjs')
    return
  }

  // 2. Real Run: Create a temporary admin user to authenticate Edge Function call
  const tempEmail = `temp_auth_migration_admin_${Date.now()}@thebasemovement.org.gh`
  const tempPassword = `TempAdminPassword${Math.floor(1000 + Math.random() * 9000)}!`

  console.log(`\n🔑 Creating temporary SUPER_ADMIN account: ${tempEmail}`)
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    console.error('❌ Failed to create auth user:', authError?.message || 'Unknown error')
    process.exit(1)
  }

  const tempAdminId = authData.user.id

  try {
    // Insert into public.users first to satisfy foreign key constraint on public.admins
    const { error: userDbError } = await supabase
      .from('users')
      .insert({
        id: tempAdminId,
        full_name: 'Temp Migration Admin',
        platform: 'GHANA',
        registration_number: `TBM-GH-TEMP-${Date.now().toString().slice(-4)}`,
        status: 'Active',
        country: 'Ghana',
      })

    if (userDbError) {
      console.error('❌ Failed to insert into public.users:', userDbError.message)
      throw userDbError
    }

    // Insert into public.admins with SUPER_ADMIN role
    const { error: dbError } = await supabase
      .from('admins')
      .insert({
        id: tempAdminId,
        role: 'SUPER_ADMIN',
        permissions: { can_manage_members: true },
      })

    if (dbError) {
      console.error('❌ Failed to insert into public.admins:', dbError.message)
      throw dbError
    }

    // Log in with temporary credentials to get a JWT
    console.log('🔐 Authenticating to obtain caller JWT...')
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword,
    })

    if (loginError || !sessionData.session) {
      console.error('❌ Sign in failed:', loginError?.message || 'No session returned')
      throw loginError
    }

    const jwt = sessionData.session.access_token
    console.log('✅ Caller JWT obtained successfully.')

    // 3. Process unassigned users in batches
    console.log(`\n🚀 Activating ${users.length} members in batches of ${BATCH_SIZE}...`)
    let successCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE)
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)} (${batch.length} members)...`)

      // Format payload expected by create-csv-member-accounts
      const payload = {
        members: batch.map(u => ({
          reg_no: u.registration_number,
          phone: u.phone_number,
          name: u.full_name,
          email: u.email || undefined,
        }))
      }

      // Invoke the Edge Function
      const r = await fetch(`${SUPABASE_URL}/functions/v1/create-csv-member-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      })

      if (!r.ok) {
        console.error(`  ❌ Batch failed: HTTP ${r.status} ${r.statusText}`)
        console.error(await r.text())
        failedCount += batch.length
        continue
      }

      const result = await r.json()
      console.log(`  ✅ Batch complete: Created ${result.created || 0}, Skipped ${result.skipped || 0}, Failed ${result.failed || 0}`)
      
      successCount += result.created || 0
      skippedCount += result.skipped || 0
      failedCount += result.failed || 0

      if (result.failedUsers && result.failedUsers.length > 0) {
        console.warn('  ⚠️ Failed users in batch:', JSON.stringify(result.failedUsers, null, 2))
      }
    }

    console.log('\n📊 Activation Summary:')
    console.log(`   Created : ${successCount}`)
    console.log(`   Skipped : ${skippedCount}`)
    console.log(`   Failed  : ${failedCount}`)

  } finally {
    // 4. Clean up temporary admin user
    console.log(`\n🧹 Cleaning up temporary admin account: ${tempEmail}`)
    // Delete from public.admins (cascade might handle it, but let's delete manually to be safe)
    await supabase.from('admins').delete().eq('id', tempAdminId)
    // Delete from public.users to keep database clean
    await supabase.from('users').delete().eq('id', tempAdminId)
    // Delete auth user
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(tempAdminId)
    if (deleteErr) {
      console.error(`⚠️ Failed to delete auth user ${tempAdminId}:`, deleteErr.message)
    } else {
      console.log('✅ Temporary admin account removed.')
    }
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})
