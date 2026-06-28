/**
 * import-diaspora.mjs
 * Reads all diaspora_batch_*.csv files from docs/diaspora/ and bulk-inserts
 * them into the public.users table via the Supabase service role client.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<your-service-role-key> node scripts/import-diaspora.mjs
 *
 * The service role key bypasses RLS so inserts work without auth.
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

const BATCH_SIZE = 50
const CSV_DIR = join(ROOT, 'docs', 'diaspora')

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
// Only the columns that exist in public.users (ignore job taxonomy IDs etc.)
const KEEP = new Set([
  'full_name', 'email', 'platform', 'country', 'phone_number',
  'gender', 'region', 'constituency', 'chapter', 'profession',
  'joined_at', 'status', 'age_range', 'education_level',
  'emergency_name', 'emergency_relationship', 'emergency_phone',
  'verification_status', 'national_id', 'children_count',
  'residential_address', 'city', 'registration_source', 'referred_by',
  'newsletter_opt_out',
])

// ── Registration number generator ────────────────────────────────────────────
function genRegNo(platform) {
  const year = new Date().getFullYear().toString().slice(-2)
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `TBM-${platform === 'DIASPORA' ? 'DI' : 'GH'}-${year}${rand}`
}

// ── Parse one CSV file into user objects ─────────────────────────────────────
function parseFile(filePath) {
  const text = readFileSync(filePath, 'utf-8')
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1).flatMap((row) => {
    const rec = {}
    headers.forEach((h, i) => {
      if (KEEP.has(h)) rec[h] = row[i]?.trim() ?? ''
    })

    // Skip rows with no name or phone
    if (!rec.full_name) return []

    // Normalise children_count
    rec.children_count = parseInt(rec.children_count || '0', 10) || 0

    // newsletter_opt_out → boolean
    rec.newsletter_opt_out = rec.newsletter_opt_out?.toLowerCase() === 'true'

    // Defaults
    rec.id = crypto.randomUUID()
    rec.platform = rec.platform || 'DIASPORA'
    rec.status = rec.status || 'Pending'
    rec.verification_status = rec.verification_status || 'In Review'
    rec.registration_source = rec.registration_source || 'physical_form'
    rec.registration_number = genRegNo(rec.platform)
    rec.joined_at = rec.joined_at || new Date().toISOString()
    rec.country = rec.country || 'Unknown'

    // Empty strings → null for nullable fields to avoid constraint issues
    ;['email', 'national_id', 'residential_address', 'city', 'referred_by', 'joined_at'].forEach(
      (k) => { if (rec[k] === '') rec[k] = null }
    )
    // phone_number: strip to +digits only, cap at 20 chars (column constraint)
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


    return [rec]
  })
}

// ── Pre-check and dedup helper ────────────────────────────────────────────────
async function dedupeAndResolve(batch, globalSeenRegNos) {
  const phones = batch.map((u) => u.phone_number).filter(Boolean)
  const emails = batch.map((u) => u.email).filter(Boolean)

  const [phoneRes, emailRes] = await Promise.all([
    phones.length ? supabase.from('users').select('phone_number').in('phone_number', phones) : { data: [] },
    emails.length ? supabase.from('users').select('email').in('email', emails) : { data: [] },
  ])

  // existingRegNos comes from caller (pre-loaded from DB + all inserts so far)
  const existingPhones = new Set((phoneRes.data ?? []).map((u) => u.phone_number))
  const existingEmails = new Set((emailRes.data ?? []).map((u) => u.email))
  const seenPhones = new Set()
  const seenEmails = new Set()
  const seenRegNos = new Set()

  const newRecords = []
  let skipped = 0

  for (const u of batch) {
    if (u.phone_number && (existingPhones.has(u.phone_number) || seenPhones.has(u.phone_number))) {
      skipped++
      continue
    }
    if (u.email && (existingEmails.has(u.email) || seenEmails.has(u.email))) {
      skipped++
      continue
    }

    // Resolve registration number collision — checks DB (via globalSeenRegNos) + this batch
    let regNo = u.registration_number
    while (!regNo || globalSeenRegNos.has(regNo) || seenRegNos.has(regNo)) {
      regNo = genRegNo(u.platform)
    }
    seenRegNos.add(regNo)
    globalSeenRegNos.add(regNo) // track across all batches
    if (u.phone_number) seenPhones.add(u.phone_number)
    if (u.email) seenEmails.add(u.email)

    newRecords.push({ ...u, registration_number: regNo })
  }

  return { newRecords, skipped }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const csvFiles = readdirSync(CSV_DIR)
    .filter((f) => f.startsWith('diaspora_batch_') && f.endsWith('.csv'))
    .sort()
    .map((f) => join(CSV_DIR, f))

  console.log(`📂  Found ${csvFiles.length} CSV file(s): ${csvFiles.map((f) => f.split(/[\\/]/).pop()).join(', ')}`)

  let allUsers = []
  for (const filePath of csvFiles) {
    const users = parseFile(filePath)
    console.log(`  ✅  ${filePath.split(/[\\/]/).pop()} → ${users.length} rows parsed`)
    allUsers = allUsers.concat(users)
  }

  console.log(`\n📊  Total parsed: ${allUsers.length} records`)

  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0

  // Pre-load ALL existing registration numbers from DB once, so collision resolution is accurate
  console.log('🔍  Loading existing registration numbers from DB…')
  let allDbRegNos = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('users')
      .select('registration_number')
      .range(from, from + PAGE - 1)
    if (error) { console.error('Failed to load reg_nos:', error.message); break }
    if (!data || data.length === 0) break
    allDbRegNos = allDbRegNos.concat(data.map((u) => u.registration_number).filter(Boolean))
    if (data.length < PAGE) break
    from += PAGE
  }
  const globalSeenRegNos = new Set(allDbRegNos)
  console.log(`  ✅  ${globalSeenRegNos.size} existing reg_nos loaded.\n`)

  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    const batch = allUsers.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allUsers.length / BATCH_SIZE)

    const { newRecords, skipped } = await dedupeAndResolve(batch, globalSeenRegNos)
    totalSkipped += skipped

    if (newRecords.length === 0) {
      console.log(`  ⏭️   Batch ${batchNum}/${totalBatches} — all ${batch.length} skipped (duplicates)`)
      continue
    }

    const { error } = await supabase.from('users').insert(newRecords)
    if (error) {
      console.error(`  ❌  Batch ${batchNum}/${totalBatches} failed:`, error.message)
      // Remove failed reg_nos from global set so they won't block future retries
      newRecords.forEach((r) => globalSeenRegNos.delete(r.registration_number))
      totalErrors += newRecords.length
    } else {
      totalInserted += newRecords.length
      // Add successfully inserted reg_nos to global set
      newRecords.forEach((r) => globalSeenRegNos.add(r.registration_number))
      console.log(`  ✅  Batch ${batchNum}/${totalBatches} — ${newRecords.length} inserted, ${skipped} skipped`)
    }
  }

  console.log(`\n🎉  Done!`)
  console.log(`   Inserted : ${totalInserted}`)
  console.log(`   Skipped  : ${totalSkipped}  (already in DB)`)
  console.log(`   Errors   : ${totalErrors}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
