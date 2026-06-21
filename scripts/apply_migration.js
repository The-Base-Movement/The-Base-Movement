/**
 * Applies a SQL migration to the Supabase project via the Management API.
 * Usage: node scripts/apply_migration.js <path-to-sql-file>
 * 
 * Requires: SUPABASE_ACCESS_TOKEN env var (personal access token from supabase.com/dashboard/account/tokens)
 *           or will try to read it from .env as SUPABASE_ACCESS_TOKEN
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fs = { readFileSync, existsSync }
const path = { resolve }

// Read token, url and ref from env or .env file
let token = process.env.SUPABASE_ACCESS_TOKEN
let projectRef = process.env.SUPABASE_PROJECT_REF
let supabaseUrl = process.env.SUPABASE_URL

const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const tokenMatch = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)/)
    if (tokenMatch && !token) token = tokenMatch[1].trim()

    const refMatch = line.match(/^SUPABASE_PROJECT_REF=(.+)/)
    if (refMatch && !projectRef) projectRef = refMatch[1].trim()

    const urlMatch = line.match(/^SUPABASE_URL=(.+)/)
    if (urlMatch && !supabaseUrl) supabaseUrl = urlMatch[1].trim()
  }
}

if (!projectRef && supabaseUrl) {
  const m = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.(co|net)/)
  if (m) {
    projectRef = m[1]
  }
}

const PROJECT_REF = projectRef || 'vhlyekyxutwbxlvktnzd'

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node apply_migration.js <path-to-sql-file>')
  process.exit(1)
}

const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8')

if (!token) {
  console.error('No SUPABASE_ACCESS_TOKEN found.')
  console.log('\nTo apply the migration manually, go to:')
  console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
  console.log('\nAnd run this SQL:\n')
  console.log(sql)
  process.exit(0)
}

async function run() {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await response.text()
  if (!response.ok) {
    console.error('Failed:', response.status, text)
    process.exit(1)
  }

  console.log('Migration applied successfully!')
  console.log(text)
}

run().catch(console.error)
