/**
 * import-ghana.mjs
 * Reads all ghana_batch_*.csv files from docs/ghana/ and bulk-inserts
 * them into the public.users table via the Supabase service role client.
 * Corrects email domain typos on-the-fly and preserves job taxonomy fields.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<your-service-role-key> node scripts/import-ghana.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_KEY before running.')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const BATCH_SIZE = 100
const CONCURRENCY_LIMIT = 5
const CSV_DIR = join(ROOT, 'docs', 'ghana')

// ── Email typo correction ─────────────────────────────────────────────────────
const KNOWN_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.com',
  'hotmail.co.uk', 'live.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'proton.me', 'ymail.com', 'googlemail.com',
  'msn.com', 'bt.com', 'sky.com'
]

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function suggestEmailDomain(email) {
  if (!email) return null
  const atIdx = email.lastIndexOf('@')
  if (atIdx < 1) return null

  const local = email.slice(0, atIdx)
  const domain = email.slice(atIdx + 1).toLowerCase()

  if (!domain || !domain.includes('.')) return null
  if (KNOWN_DOMAINS.includes(domain)) return null

  let best = null
  let bestDist = Infinity

  for (const known of KNOWN_DOMAINS) {
    const d = levenshtein(domain, known)
    if (d < bestDist) {
      bestDist = d
      best = known
    }
  }

  if (best && bestDist <= 2) {
    return `${local}@${best}`
  }

  return null
}

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = []
  let row = ['']
  let inQuotes = false
  for (const char of text) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      row.push('')
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (row.length > 1 || row[0] !== '') lines.push(row)
      row = ['']
    } else {
      row[row.length - 1] += char
    }
  }
  if (row.length > 1 || row[0] !== '') lines.push(row)
  return lines.filter((r) => r.some((c) => c.trim() !== ''))
}

// ── Column mapping ────────────────────────────────────────────────────────────
const KEEP = new Set([
  'full_name', 'email', 'platform', 'country', 'phone_number',
  'gender', 'region', 'constituency', 'chapter', 'profession',
  'joined_at', 'status', 'age_range', 'education_level',
  'emergency_name', 'emergency_relationship', 'emergency_phone',
  'verification_status', 'national_id', 'children_count',
  'residential_address', 'city', 'registration_source', 'referred_by',
  'newsletter_opt_out', 'job_industry_id', 'job_sub_category_id',
  'job_role_id', 'job_custom_title'
])

// ── Registration number generator ────────────────────────────────────────────
function genRegNo(platform, yearOffset = 0) {
  const currentYear = new Date().getFullYear()
  const year = (currentYear - yearOffset).toString().slice(-2)
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `TBM-${platform === 'DIASPORA' ? 'DI' : 'GH'}-${year}${rand}`
}


// ── Parse one CSV file into user objects ─────────────────────────────────────
function parseFile(filePath, validIndustry, validSubCat, validRole) {
  const text = readFileSync(filePath, 'utf-8')
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const parsed = []
  let emailCorrections = 0

  rows.slice(1).forEach((row) => {
    const rec = {}
    headers.forEach((h, i) => {
      if (KEEP.has(h)) rec[h] = row[i]?.trim() ?? ''
    })

    // Skip rows with no name
    if (!rec.full_name) return

    // Normalise children_count
    rec.children_count = parseInt(rec.children_count || '0', 10) || 0

    // newsletter_opt_out → boolean
    rec.newsletter_opt_out = rec.newsletter_opt_out?.toLowerCase() === 'true'

    // Clean & correct email
    if (rec.email) {
      const corrected = suggestEmailDomain(rec.email)
      if (corrected) {
        console.log(`  📧  Email corrected: ${rec.email} ──> ${corrected}`)
        rec.email = corrected
        emailCorrections++
      }
    }

    // Defaults
    rec.id = crypto.randomUUID()
    rec.platform = rec.platform || 'GHANA'
    rec.status = rec.status || 'Pending'
    rec.verification_status = rec.verification_status || 'In Review'
    rec.registration_source = rec.registration_source || 'physical_form'
    rec.registration_number = genRegNo(rec.platform)
    rec.joined_at = rec.joined_at || new Date().toISOString()
    rec.country = rec.country || 'Ghana'

    // Empty strings → null for nullable fields to avoid constraint issues
    ;['email', 'national_id', 'residential_address', 'city', 'referred_by', 'joined_at'].forEach(
      (k) => { if (rec[k] === '') rec[k] = null }
    )

    // phone_number: strip to +digits only, cap at 20 chars
    if (rec.phone_number) {
      const digits = rec.phone_number.replace(/[^\d]/g, '')
      const hasPlus = rec.phone_number.trimStart().startsWith('+')
      rec.phone_number = ((hasPlus ? '+' : '') + digits).slice(0, 20)
    }
    if (!rec.phone_number) rec.phone_number = null

    // emergency_phone: same VARCHAR(20) constraint
    if (rec.emergency_phone) {
      const digits = rec.emergency_phone.replace(/[^\d]/g, '')
      const hasPlus = rec.emergency_phone.trimStart().startsWith('+')
      rec.emergency_phone = ((hasPlus ? '+' : '') + digits).slice(0, 20)
    }
    if (!rec.emergency_phone) rec.emergency_phone = ''

    // Truncate fields that have VARCHAR constraints in DB
    if (rec.profession) rec.profession = rec.profession.slice(0, 100)
    if (rec.emergency_name) rec.emergency_name = rec.emergency_name.slice(0, 100)
    if (rec.emergency_relationship) rec.emergency_relationship = rec.emergency_relationship.slice(0, 100)
    if (rec.education_level) rec.education_level = rec.education_level.slice(0, 100)
    if (rec.city) rec.city = rec.city.slice(0, 100)
    if (rec.residential_address) rec.residential_address = rec.residential_address.slice(0, 255)

    // Job taxonomy constraints validation
    const indId = parseInt(rec.job_industry_id, 10)
    const subId = parseInt(rec.job_sub_category_id, 10)
    const roleId = parseInt(rec.job_role_id, 10)
    rec.job_industry_id = indId && validIndustry.has(indId) ? indId : null
    rec.job_sub_category_id = subId && validSubCat.has(subId) ? subId : null
    rec.job_role_id = roleId && validRole.has(roleId) ? roleId : null
    rec.job_custom_title = rec.job_custom_title ? rec.job_custom_title.slice(0, 100) : null

    parsed.push(rec)
  })

  return { parsed, emailCorrections }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Pre-load valid job taxonomy IDs to prevent foreign key errors
  console.log('🔍  Loading valid job taxonomy IDs from DB…')
  const [indRes, subRes, roleRes] = await Promise.all([
    supabase.from('job_industries').select('id'),
    supabase.from('job_sub_categories').select('id'),
    supabase.from('job_roles').select('id'),
  ])
  const validIndustry = new Set((indRes.data ?? []).map((r) => r.id))
  const validSubCat   = new Set((subRes.data ?? []).map((r) => r.id))
  const validRole     = new Set((roleRes.data ?? []).map((r) => r.id))
  console.log(`  ✅  ${validIndustry.size} industries, ${validSubCat.size} sub-cats, ${validRole.size} roles loaded.`)

  const csvFiles = readdirSync(CSV_DIR)
    .filter((f) => f.startsWith('ghana_batch_') && f.endsWith('.csv'))
    .sort()
    .map((f) => join(CSV_DIR, f))

  console.log(`\n📂  Found ${csvFiles.length} CSV file(s): ${csvFiles.map((f) => f.split(/[\\/]/).pop()).join(', ')}`)

  let allUsers = []
  let totalEmailCorrections = 0
  for (const filePath of csvFiles) {
    const { parsed, emailCorrections } = parseFile(filePath, validIndustry, validSubCat, validRole)
    console.log(`  ✅  ${filePath.split(/[\\/]/).pop()} → ${parsed.length} rows parsed`)
    allUsers = allUsers.concat(parsed)
    totalEmailCorrections += emailCorrections
  }

  console.log(`\n📊  Total parsed: ${allUsers.length} records`)
  console.log(`📧  Total email corrections: ${totalEmailCorrections}`)

  // Pre-load ALL existing users' emails, phones, and reg_nos to memory for super-fast deduplication
  console.log('\n🔍  Caching existing database users to memory…')
  let existingEmails = new Set()
  let existingPhones = new Set()
  let globalSeenRegNos = new Set()

  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('users')
      .select('email, phone_number, registration_number')
      .range(from, from + PAGE - 1)
    if (error) { console.error('Failed to load users:', error.message); break }
    if (!data || data.length === 0) break
    data.forEach((u) => {
      if (u.email) existingEmails.add(u.email.toLowerCase())
      if (u.phone_number) existingPhones.add(u.phone_number)
      if (u.registration_number) globalSeenRegNos.add(u.registration_number)
    })
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`  ✅  Cached ${globalSeenRegNos.size} users.`)

  // Perform in-memory deduplication and registration number collision resolution
  console.log('🔍  Deduplicating and generating registration numbers…')
  const newRecords = []
  let skipped = 0

  for (const u of allUsers) {
    if (u.phone_number && existingPhones.has(u.phone_number)) {
      skipped++
      continue
    }
    if (u.email && existingEmails.has(u.email.toLowerCase())) {
      skipped++
      continue
    }

    // Resolve registration number collision
    let regNo = u.registration_number
    let yearOffset = 0
    let attempts = 0
    while (!regNo || globalSeenRegNos.has(regNo)) {
      regNo = genRegNo(u.platform, yearOffset)
      attempts++
      if (attempts > 20) {
        yearOffset = (yearOffset + 1) % 4 // cycle between offsets 0, 1, 2, 3 (years 26, 25, 24, 23)
        attempts = 0
      }
    }
    globalSeenRegNos.add(regNo)
    if (u.phone_number) existingPhones.add(u.phone_number)
    if (u.email) existingEmails.add(u.email.toLowerCase())

    newRecords.push({ ...u, registration_number: regNo })

  }

  console.log(`  ✅  Ready to insert: ${newRecords.length} records (${skipped} duplicates skipped).`)

  if (newRecords.length === 0) {
    console.log('🎉  Done! No new records to insert.')
    return
  }

  console.log(`\n🚀  Bulk inserting into database in batches of ${BATCH_SIZE}…`)
  let inserted = 0
  let errors = 0

  const chunks = []
  for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
    chunks.push(newRecords.slice(i, i + BATCH_SIZE))
  }

  // Insert chunks concurrently
  for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
    const chunkBatch = chunks.slice(i, i + CONCURRENCY_LIMIT)
    await Promise.all(chunkBatch.map(async (chunk) => {
      const { error } = await supabase.from('users').insert(chunk)
      if (error) {
        console.error(`  ❌  Insertion chunk failed:`, error.message)
        errors += chunk.length
      } else {
        inserted += chunk.length
      }
    }))
    const progress = Math.min((i + CONCURRENCY_LIMIT) * BATCH_SIZE, newRecords.length)
    process.stdout.write(`\r  ⏳  Progress: ${progress}/${newRecords.length}`)
  }

  console.log(`\n\n🎉  Import finished!`)
  console.log(`   Inserted : ${inserted}`)
  console.log(`   Skipped  : ${skipped}  (already in DB)`)
  console.log(`   Errors   : ${errors}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
