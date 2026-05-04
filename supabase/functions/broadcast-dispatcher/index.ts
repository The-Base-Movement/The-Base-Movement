// 🚩 THE BASE: MULTI-CHANNEL BROADCAST DISPATCHER
// This Edge Function handles external dispatch (SMS/Push) for Urgent broadcasts.

// @ts-expect-error: Deno supports URL imports, but the local IDE might not recognize them
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// @ts-expect-error: Deno is a global in the Edge Function environment
Deno.serve(async (req: Request) => {
  try {
    const { broadcastId, priority, targetType, targetValue } = await req.json()
    
    if (priority !== 'Urgent') {
      return new Response(JSON.stringify({ success: true, message: "Non-urgent broadcast, skipping external dispatch." }), {
        headers: { "Content-Type": "application/json" }
      })
    }

    // 1. Initialize Supabase Client
    const supabaseAdmin = createClient(
      // @ts-expect-error: Deno is a global in the Edge Function environment
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-expect-error: Deno is a global in the Edge Function environment
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Target Users
    let userQuery = supabaseAdmin.from('users').select('full_name, phone_number')
    
    if (targetType === 'REGION') {
      userQuery = userQuery.eq('region', targetValue)
    } else if (targetType === 'CONSTITUENCY') {
      userQuery = userQuery.eq('constituency', targetValue)
    }

    const { data: users, error: userError } = await userQuery
    if (userError) throw userError

    interface Patriot {
      full_name: string;
      phone_number: string | null;
    }

    const recipients = (users as Patriot[])?.filter((u: Patriot) => u.phone_number) || []
    
    // 3. Simulate SMS Dispatch (e.g. Twilio)
    console.log(`[URGENT DISPATCH] Initiating SMS blast for ${broadcastId} to ${recipients.length} patriots.`);
    
    // TODO: Integrate with real SMS provider
    // await sendSmsBlast(recipients, "URGENT MOVEMENT ALERT: " + broadcastId);

    return new Response(JSON.stringify({ 
      success: true, 
      recipientCount: recipients.length 
    }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[DISPATCH-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), { 
      headers: { "Content-Type": "application/json" },
      status: 400 
    })
  }
})
