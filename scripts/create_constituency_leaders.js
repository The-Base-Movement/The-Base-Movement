/**
 * One-time script: creates the constituency_leaders table and its policies.
 * Run with: node scripts/create_constituency_leaders.js
 */
const fs = require('fs')
const path = require('path')

// Load and parse environment variables from local .env file
const envPath = path.resolve(__dirname, '../.env')
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || null
let supabaseUrl = process.env.SUPABASE_URL || null
let projectRef = process.env.SUPABASE_PROJECT_REF || null

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)
    if (m && !serviceKey) serviceKey = m[1].trim()
    const m2 = line.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)/)
    if (m2 && !serviceKey) serviceKey = m2[1].trim()
    const m3 = line.match(/^SUPABASE_URL=(.+)/)
    if (m3 && !supabaseUrl) supabaseUrl = m3[1].trim()
    const m4 = line.match(/^SUPABASE_PROJECT_REF=(.+)/)
    if (m4 && !projectRef) projectRef = m4[1].trim()
  }
}

if (!supabaseUrl) {
  console.error('Error: SUPABASE_URL must be specified in env/.env.')
  process.exit(1)
}

if (!projectRef) {
  const m = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.(co|net)/)
  if (m) {
    projectRef = m[1]
  }
}

const PROJECT_REF = projectRef
if (!PROJECT_REF) {
  console.error('Error: Could not determine SUPABASE_PROJECT_REF from SUPABASE_URL.')
  process.exit(1)
}

const SUPABASE_URL = supabaseUrl

if (!serviceKey) {
  console.error('Could not find SUPABASE_SERVICE_ROLE_KEY in .env')
  console.log('Available env keys:')
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  lines.forEach(l => { if (l.includes('SUPABASE') || l.includes('KEY')) console.log(' ', l.split('=')[0]) })
  process.exit(1)
}

const sql = `
-- Create the constituency_leaders table
CREATE TABLE IF NOT EXISTS constituency_leaders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  constituency_id INTEGER NOT NULL REFERENCES ghana_constituencies(id) ON DELETE CASCADE,
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Secretary', 'Deputy Secretary', 'Treasurer')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE constituency_leaders ENABLE ROW LEVEL SECURITY;

-- Policy: anyone authenticated can read
CREATE POLICY "constituency_leaders_select" ON constituency_leaders
  FOR SELECT USING (true);

-- Policy: only admins/service_role can insert/update/delete (enforced at database layer)
CREATE POLICY "constituency_leaders_insert" ON constituency_leaders
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.admins));

CREATE POLICY "constituency_leaders_delete" ON constituency_leaders
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.admins));

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS constituency_leaders_constituency_id_idx ON constituency_leaders(constituency_id);
`

// Executes the DDL SQL to create tables and policies on Supabase
async function run() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ sql }),
  })
  
  if (!response.ok) {
    const text = await response.text()
    console.error('RPC exec_sql failed:', text)
    
    // Try using the Postgres direct endpoint
    console.log('\nTrying direct query approach...')
    // Supabase REST doesn't support DDL directly — we need to use the management API
    const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })
    const mgmtText = await mgmtResponse.text()
    console.log('Management API response:', mgmtText)
    return
  }
  
  const data = await response.json()
  console.log('Success:', JSON.stringify(data, null, 2))
}

run().catch(console.error)
