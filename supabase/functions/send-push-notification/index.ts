// THE BASE: WEB PUSH SENDER
// Sends Web Push notifications to a list of users (or all opted-in subscribers).
// Invoke with: { userIds: string[] | "all", title: string, body: string, url?: string }
// Requires Supabase secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
// @ts-expect-error: npm import in Deno
import webpush from 'npm:web-push'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const { userIds, title, body, url } = await req.json()

    if (!title || !body) throw new Error('title and body are required')

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      // @ts-expect-error: Deno global
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-expect-error: Deno global
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    webpush.setVapidDetails(
      // @ts-expect-error: Deno global
      Deno.env.get('VAPID_SUBJECT') ?? '',
      // @ts-expect-error: Deno global
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      // @ts-expect-error: Deno global
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    // Fetch subscriptions — either all opted-in users or a specific list
    let query = supabaseAdmin.from('push_subscriptions').select('id, user_id, subscription')
    if (userIds !== 'all') {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return new Response(JSON.stringify({ success: true, sent: 0, failed: 0 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
      query = query.in('user_id', userIds)
    }

    const { data: subs, error: fetchError } = await query
    if (fetchError) throw fetchError
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, failed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      url: url ?? '/',
    })

    let sent = 0
    let failed = 0
    const expiredIds: string[] = []

    for (const row of subs) {
      try {
        await webpush.sendNotification(row.subscription, payload)
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          // Subscription expired or revoked — clean up
          expiredIds.push(row.id)
        } else {
          failed++
          console.error('[PUSH] Send failed for user', row.user_id, err)
        }
      }
    }

    // Delete expired subscriptions
    if (expiredIds.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', expiredIds)
      console.warn(`[PUSH] Cleaned up ${expiredIds.length} expired subscriptions`)
    }

    return new Response(JSON.stringify({ success: true, sent, failed }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[PUSH-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
