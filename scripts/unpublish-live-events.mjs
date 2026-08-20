import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8')
    const line = envFile.split('\n').find((l) => l.startsWith(`${name}=`))
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : undefined
  } catch {
    return undefined
  }
}

async function main() {
  const url = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL')
  const key = readEnv('VITE_SUPABASE_ANON_KEY') || readEnv('SUPABASE_ANON_KEY')
  if (!url || !key) {
    console.error('Supabase credentials missing in .env')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log('[EVENTS] Unpublishing all live field_events in Supabase...')
  const { data, error } = await supabase
    .from('field_events')
    .update({ status: 'Draft' })
    .neq('status', 'Draft')
    .select()

  if (error) {
    console.error('[EVENTS] Failed to unpublish events:', error.message)
  } else {
    console.log(`[EVENTS] Successfully set ${data?.length || 0} events to 'Draft'.`)
  }
}

main()
