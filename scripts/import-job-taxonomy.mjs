/**
 * import-job-taxonomy.mjs
 * Parses the INSERT statements for job taxonomy tables from docs/diaspora/database.sql
 * and inserts them into Supabase via the service role client.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=<service-role-key> node scripts/import-job-taxonomy.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SUPABASE_URL = 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) { console.error('❌  Set SUPABASE_SERVICE_KEY'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const SQL_FILE = join(ROOT, 'docs', 'diaspora', 'database.sql')

// Helper to parse SQL INSERT VALUES format safely
function parseSqlValues(line) {
  // Use non-greedy match to capture up to the first closing parenthesis that ends the values block
  const match = line.match(/VALUES\s*\((.*?)\)\s*ON CONFLICT/i)
  if (!match) return null
  const valuesStr = match[1]

  // Parse values separating by comma, respecting quotes
  const values = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i]
    if ((char === "'" || char === '"') && valuesStr[i - 1] !== '\\') {
      if (inQuotes && quoteChar === char) {
        inQuotes = false
      } else if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      }
    } else if (char === ',' && !inQuotes) {
      values.push(cleanValue(current))
      current = ''
    } else {
      current += char
    }
  }
  values.push(cleanValue(current))
  return values
}


function cleanValue(val) {
  val = val.trim()
  if (val.toLowerCase() === 'null') return null
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'") // Handle escaped single quotes in Postgres
  }
  const num = Number(val)
  return isNaN(num) ? val : num
}

async function main() {
  console.log(`📂  Reading SQL file: ${SQL_FILE}`)
  const sqlContent = readFileSync(SQL_FILE, 'utf8')
  const lines = sqlContent.split('\n')

  const industries = []
  const subCategories = []
  const roles = []

  for (const line of lines) {
    if (line.includes('INSERT INTO public.job_industries')) {
      const vals = parseSqlValues(line)
      if (vals) {
        industries.push({ id: vals[0], name: vals[1] })
      }
    } else if (line.includes('INSERT INTO public.job_sub_categories')) {
      const vals = parseSqlValues(line)
      if (vals) {
        subCategories.push({
          id: vals[0],
          industry_id: vals[1],
          name: vals[2],
          code: `${vals[1]}.${vals[0] % 10}`
        })
      }

    } else if (line.includes('INSERT INTO public.job_roles')) {
      const vals = parseSqlValues(line)
      if (vals) {
        roles.push({ id: vals[0], sub_category_id: vals[1], name: vals[2] })
      }
    }
  }

  console.log(`📊  Parsed from SQL:`)
  console.log(`    Industries: ${industries.length}`)
  console.log(`    Sub-categories: ${subCategories.length}`)
  console.log(`    Roles: ${roles.length}`)

  // 1. Insert Industries
  if (industries.length > 0) {
    console.log('\n🚀  Upserting job industries...')
    const { error } = await supabase.from('job_industries').upsert(industries)
    if (error) console.error('  ❌  Failed to upsert industries:', error.message)
    else console.log('  ✅  Industries upserted successfully.')
  }

  // 2. Insert Sub-categories
  if (subCategories.length > 0) {
    console.log('\n🚀  Upserting job sub-categories...')
    const { error } = await supabase.from('job_sub_categories').upsert(subCategories)
    if (error) console.error('  ❌  Failed to upsert sub-categories:', error.message)
    else console.log('  ✅  Sub-categories upserted successfully.')
  }

  // 3. Insert Roles
  if (roles.length > 0) {
    console.log('\n🚀  Upserting job roles in batches...')
    const BATCH = 50
    let inserted = 0
    for (let i = 0; i < roles.length; i += BATCH) {
      const chunk = roles.slice(i, i + BATCH)
      const { error } = await supabase.from('job_roles').upsert(chunk)
      if (error) {
        console.error(`  ❌  Failed to upsert roles batch ${i / BATCH + 1}:`, error.message)
      } else {
        inserted += chunk.length
      }
    }
    console.log(`  ✅  Upserted ${inserted}/${roles.length} roles successfully.`)
  }

  console.log('\n🎉  Job taxonomy import finished!')
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1) })
