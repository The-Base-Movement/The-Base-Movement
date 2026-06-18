// THE BASE: POLL CLOSING NOTIFICATION EMAIL
// Called manually or via a scheduled job when a poll is 24h from closing.
// Set SENDGRID_API_KEY in Supabase secrets to activate sending.
// Invoke with: { pollId, targetRegion? }

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { pollClosingEmail } from '../_shared/email-templates.ts'
import { json, requireServiceRoleCall } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { pollId, targetRegion } = await req.json()
    if (!pollId) throw new Error('pollId is required')

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch poll data
    const { data: poll, error: pollErr } = await supabaseAdmin
      .from('polls')
      .select('id, title, options, end_date, region, response_count, target_count')
      .eq('id', pollId)
      .single()

    if (pollErr || !poll) throw new Error(`Poll not found: ${pollErr?.message}`)

    interface PollRow {
      id: string
      title: string
      options: Array<{ label: string; votes: number }>
      end_date: string
      region: string | null
      response_count: number
      target_count: number | null
    }
    const row = poll as unknown as PollRow

    const totalVotes =
      row.options?.reduce((s: number, o) => s + (o.votes ?? 0), 0) ?? row.response_count
    const pollOptions = (row.options ?? []).map((o, i: number) => ({
      label: o.label,
      percent: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
      leading: i === 0,
    }))

    const endDate = new Date(row.end_date)
    const hoursRemaining = Math.max(1, Math.round((endDate.getTime() - Date.now()) / 3_600_000))
    const region = targetRegion ?? row.region ?? 'All regions'

    // Fetch members in the target region who haven't voted
    let memberQuery = supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('status', 'Active')
    if (row.region) memberQuery = memberQuery.eq('region', row.region)

    const { data: members } = await memberQuery
    interface Member {
      id: string
      full_name: string
      email: string | null
    }
    const recipients = ((members ?? []) as Member[]).filter((m) => m.email)

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    let sentCount = 0
    const BATCH = 100

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH)

      if (sgKey) {
        const personalizations = batch
          .filter((m) => m.email)
          .map((member) => {
            const firstName = (member.full_name ?? '').split(' ')[0] || 'Patriot'
            const html = pollClosingEmail({
              name: firstName,
              pollTitle: row.title,
              preheader: `The ${region} poll closes in ${hoursRemaining} hours. ${row.response_count.toLocaleString()} members have voted. You haven't yet.`,
              region,
              voteCount: row.response_count,
              voteTarget: row.target_count ?? 5000,
              hoursRemaining,
              options: pollOptions,
              voteUrl: `https://thebasemovement.creativeutil.com/dashboard/polls/${row.id}`,
            })
            return {
              to: [{ email: member.email as string }],
              dynamic_template_data: {},
              substitutions: { html },
            }
          })

        for (const p of personalizations) {
          await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
            body: JSON.stringify({
              personalizations: [{ to: p.to }],
              from: {
                email: 'noreply@thebasemovement.creativeutil.com',
                name: 'The Base Movement',
              },
              subject: `This poll closes in ${hoursRemaining} hours. Your vote counts.`,
              content: [{ type: 'text/html', value: p.substitutions.html }],
            }),
          })
          sentCount++
        }
      }
    }

    if (!sgKey) {
      console.warn(
        `[POLL-NOTIFY] SENDGRID_API_KEY not set — would send to ${recipients.length} members`
      )
    }

    // Push notifications for all matching members — fire and forget
    const memberIds = ((members ?? []) as Member[]).map((m) => m.id)
    if (memberIds.length > 0) {
      // @ts-expect-error: Deno global
      const supabaseUrl: string = Deno.env.get('SUPABASE_URL') ?? ''
      // @ts-expect-error: Deno global
      const serviceKey: string = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userIds: memberIds,
          title: `Poll closing in ${hoursRemaining}h — vote now`,
          body: row.title.slice(0, 100),
          url: '/dashboard/polls',
        }),
      }).catch((err: unknown) => console.error('[PUSH]', err))
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: recipients.length }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[POLL-NOTIFY-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
