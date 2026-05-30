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

const PROJECT_REF = 'vhlyekyxutwbxlvktnzd'

// Read token from env or .env file
let token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  const envPath = path.resolve(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const m = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)/)
      if (m) { token = m[1].trim(); break }
    }
  }
}

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
