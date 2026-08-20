import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vhlyekyxutwbxlvktnzd.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Run with: node --env-file=.env scripts/verify_legacy_db.mjs')
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function check() {
  console.log('Checking public.legacy_passwords table in Supabase...')

  const { data, error } = await supabase.from('legacy_passwords').select('id').limit(1)

  if (error) {
    console.error('Table check error:', error.message)
  } else {
    console.log('Table public.legacy_passwords exists and is active. Sample row count returned:', data.length)
  }
}

check()
