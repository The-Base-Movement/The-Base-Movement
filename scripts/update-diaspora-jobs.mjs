/**
 * update-diaspora-jobs.mjs
 * Reads all diaspora_batch_*.csv files and UPDATES existing users
 * with their job taxonomy fields (job_industry_id, job_sub_category_id,
 * job_role_id, job_custom_title) matched by phone_number or email.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<service-role-key> node scripts/update-diaspora-jobs.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SUPABASE_URL = 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) { console.error('❌  Set SUPABASE_SERVICE_KEY'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const CSV_DIR = join(ROOT, 'docs', 'diaspora')
const CONCURRENCY_LIMIT = 30

// ── Minimal CSV parser ────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = []
  let row = ['']
  let inQuotes = false
  for (const char of text) {
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === ',' && !inQuotes) { row.push('') }
    else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (row.some((c) => c.trim() !== '')) lines.push(row)
      row = ['']
    } else { row[row.length - 1] += char }
  }
  if (row.some((c) => c.trim() !== '')) lines.push(row)
  return lines
}

// ── Parse job records from CSVs ───────────────────────────────────────────────
function parseJobRecords(filePath) {
  const text = readFileSync(filePath, 'utf-8')
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase())

  const get = (row, col) => {
    const i = headers.indexOf(col)
    return i >= 0 ? row[i]?.trim() ?? '' : ''
  }

  return rows.slice(1).flatMap((row) => {
    const industryId = parseInt(get(row, 'job_industry_id'), 10)
    const subCatId = parseInt(get(row, 'job_sub_category_id'), 10)
    const roleId = parseInt(get(row, 'job_role_id'), 10)
    const customTitle = get(row, 'job_custom_title')

    // Skip rows with no job data at all
    if (!industryId && !subCatId && !roleId && !customTitle) return []

    const phone = get(row, 'phone_number')
    const email = get(row, 'email')

    // Need at least one identifier to match against
    if (!phone && !email) return []

    // Clean phone the same way as the import script
    const cleanPhone = (() => {
      if (!phone) return null
      const digits = phone.replace(/[^\d]/g, '')
      const hasPlus = phone.trimStart().startsWith('+')
      return ((hasPlus ? '+' : '') + digits).slice(0, 20) || null
    })()

    return [{
      phone: cleanPhone,
      email: email || null,
      job_industry_id: industryId || null,
      job_sub_category_id: subCatId || null,
      job_role_id: roleId || null,
      job_custom_title: customTitle || null,
    }]
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const csvFiles = readdirSync(CSV_DIR)
    .filter((f) => f.startsWith('diaspora_batch_') && f.endsWith('.csv'))
    .sort()
    .map((f) => join(CSV_DIR, f))

  console.log(`📂  Found ${csvFiles.length} CSV file(s)`)

  let allRecords = []
  for (const filePath of csvFiles) {
    const recs = parseJobRecords(filePath)
    console.log(`  ✅  ${filePath.split(/[\\/]/).pop()} → ${recs.length} rows with job data`)
    allRecords = allRecords.concat(recs)
  }
  console.log(`\n📊  Total with job data: ${allRecords.length}`)

  // Pre-load valid IDs from the job taxonomy tables to avoid FK violations
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

  // Pre-load ALL user mappings to avoid sequential DB lookups
  console.log('🔍  Caching all database users in memory…')
  let users = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('users')
      .select('id, phone_number, email')
      .range(from, from + PAGE - 1)
    if (error) { console.error('Failed to load users:', error.message); break }
    if (!data || data.length === 0) break
    users = users.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }

  // Maps for O(1) matching
  const phoneMap = new Map()
  const emailMap = new Map()
  for (const u of users) {
    if (u.phone_number) phoneMap.set(u.phone_number, u.id)
    if (u.email) emailMap.set(u.email.toLowerCase(), u.id)
  }
  console.log(`  ✅  Cached ${users.length} users in memory.`)

  let updated = 0
  let notFound = 0
  let errors = 0

  // Build task pool
  const tasks = []
  for (const rec of allRecords) {
    let userId = null
    if (rec.phone) userId = phoneMap.get(rec.phone)
    if (!userId && rec.email) userId = emailMap.get(rec.email.toLowerCase())

    if (!userId) {
      notFound++
      continue
    }

    const patch = {}
    if (rec.job_industry_id && validIndustry.has(rec.job_industry_id))
      patch.job_industry_id = rec.job_industry_id
    if (rec.job_sub_category_id && validSubCat.has(rec.job_sub_category_id))
      patch.job_sub_category_id = rec.job_sub_category_id
    if (rec.job_role_id && validRole.has(rec.job_role_id))
      patch.job_role_id = rec.job_role_id
    if (rec.job_custom_title) patch.job_custom_title = rec.job_custom_title

    // If nothing to patch (e.g. all IDs were invalid), skip
    if (Object.keys(patch).length === 0) {
      notFound++
      continue
    }

    tasks.push({ userId, patch, rec })
  }

  console.log(`\n⏳  Running ${tasks.length} updates...`)

  // Process updates concurrently in limited pool sizes
  for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT)
    await Promise.all(chunk.map(async ({ userId, patch, rec }) => {
      const { error } = await supabase.from('users').update(patch).eq('id', userId)
      if (error) {
        console.error(`  ❌  Update failed for ${rec.phone || rec.email}:`, error.message)
        errors++
      } else {
        updated++
      }
    }))
    const progress = Math.min(i + CONCURRENCY_LIMIT, tasks.length)
    process.stdout.write(`\r  ⏳  Progress: ${progress}/${tasks.length}`)
  }

  console.log(`\n\n🎉  Done!`)
  console.log(`   Updated   : ${updated}`)
  console.log(`   Not found : ${notFound}`)
  console.log(`   Errors    : ${errors}`)
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1) })
