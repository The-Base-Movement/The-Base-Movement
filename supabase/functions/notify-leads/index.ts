// 🚩 THE BASE: MOBILIZATION NOTIFICATION EDGE FUNCTION
// Deployed to Supabase Edge Functions to handle external notifications (Email/SMS)

// @ts-expect-error: Deno supports URL imports, but the local IDE might not recognize them
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// @ts-expect-error: Deno is a global in the Edge Function environment
Deno.serve(async (req: Request) => {
  try {
    const { record } = await req.json()
    
    // 1. Initialize Supabase Client with Service Role Key
    const supabaseAdmin = createClient(
      // @ts-expect-error: Deno is a global in the Edge Function environment
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-expect-error: Deno is a global in the Edge Function environment
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Lead Data
    let leadEmail = '';
    let leadPhone = '';

    if (record.chapter) {
      const { data: chapterData } = await supabaseAdmin
        .from('chapters')
        .select('leader_id, users(email, phone_number)')
        .eq('name', record.chapter)
        .single()
      
      if (chapterData?.users) {
        interface ChapterLead {
          email: string;
          phone_number: string;
        }
        const lead = chapterData.users as unknown as ChapterLead;
        leadEmail = lead.email;
        leadPhone = lead.phone_number;
      }
    }

    // 3. Logic for External Dispatch (SMS via Twilio, Email via Resend/SendGrid)
    console.log(`[DISPATCH] Notifying Lead for Patriot: ${record.full_name} (${record.registration_number})`);
    
    if (leadEmail) {
      // await sendEmail(leadEmail, "New Registration", `Patriot ${record.full_name} has joined.`);
      console.log(`[EMAIL] Queued for ${leadEmail}`);
    }

    if (leadPhone) {
      // await sendSMS(leadPhone, `Movement Alert: New registration in your chapter - ${record.full_name}`);
      console.log(`[SMS] Queued for ${leadPhone}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[NOTIFY-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), { 
      headers: { "Content-Type": "application/json" },
      status: 400 
    })
  }
})
