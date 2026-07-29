// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { json, requireServiceRoleCall } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CronJob {
  jobname: string
  schedule: string
  timezone: string
  active: boolean
  last_run_start: string | null
  last_run_end: string | null
  last_message: string | null
}

// Sample cron jobs for MVP (fallback if cron tables are not accessible)
const FALLBACK_CRON_JOBS: CronJob[] = [
  {
    jobname: 'security-digest-weekly',
    schedule: '0 9 * * 1',
    timezone: 'UTC',
    active: true,
    last_run_start: null,
    last_run_end: null,
    last_message: null,
  },
  {
    jobname: 'activity-digest-weekly',
    schedule: '0 8 * * 1',
    timezone: 'UTC',
    active: true,
    last_run_start: null,
    last_run_end: null,
    last_message: null,
  },
  {
    jobname: 'purge-expired-trash',
    schedule: '0 2 * * *',
    timezone: 'UTC',
    active: true,
    last_run_start: null,
    last_run_end: null,
    last_message: null,
  },
]

// @ts-ignore: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // @ts-ignore: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ponytail: For MVP, return fallback cron jobs. In production, query cron.job
    // table via RPC after creating the schema grants and RPC function.
    // The pg_cron tables (cron.job, cron.job_run_details) require special access
    // configuration in Supabase to be readable by the service role.
    console.log(`[GET-CRON-JOBS] Returning ${FALLBACK_CRON_JOBS.length} jobs`)

    return json(FALLBACK_CRON_JOBS, 200, corsHeaders)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[GET-CRON-JOBS-CATCH] ${message}`)
    return json({ error: `Server error: ${message}` }, 500, corsHeaders)
  }
})
