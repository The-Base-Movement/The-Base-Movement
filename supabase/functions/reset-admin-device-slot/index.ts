// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { json, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IT_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER'])

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const authz = await requireAuthorizedAdmin(
      req,
      supabaseAdmin,
      (admin) => admin.role !== null && IT_ROLES.has(admin.role)
    )
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { device_id: deviceId, disable_mfa: disableMfa = false } = await req.json()
    if (!deviceId || typeof deviceId !== 'string') {
      return json({ error: 'Device ID is required.' }, 400, corsHeaders)
    }

    const { data: device, error: deviceError } = await supabaseAdmin
      .from('admin_devices')
      .select('id, admin_id, device_type')
      .eq('id', deviceId)
      .maybeSingle()

    if (deviceError) {
      console.error('[RESET-DEVICE-SLOT] device lookup failed:', deviceError)
      return json({ error: 'Failed to look up device.' }, 500, corsHeaders)
    }

    if (!device) {
      return json({ error: 'Device not found.' }, 404, corsHeaders)
    }

    const { error: logError } = await supabaseAdmin.from('admin_device_activity').insert({
      admin_id: device.admin_id,
      device_id: device.id,
      device_type: device.device_type,
      action: 'slot_reset',
      metadata: { reset_by: authz.callerUserId, disable_mfa: disableMfa },
    })
    if (logError) {
      console.error('[RESET-DEVICE-SLOT] failed to log activity:', logError)
      return json({ error: 'Failed to log reset activity.' }, 500, corsHeaders)
    }

    const { error: deleteError } = await supabaseAdmin
      .from('admin_devices')
      .delete()
      .eq('id', deviceId)
    if (deleteError) {
      console.error('[RESET-DEVICE-SLOT] failed to delete device slot:', deleteError)
      return json({ error: 'Failed to reset device slot.' }, 500, corsHeaders)
    }

    if (disableMfa) {
      const { data: factorsData, error: listError } =
        await supabaseAdmin.auth.admin.mfa.listFactors({ userId: device.admin_id })
      if (listError) {
        console.error('[RESET-DEVICE-SLOT] failed to list MFA factors:', listError)
        return json({ error: 'Failed to inspect MFA factors.' }, 500, corsHeaders)
      }

      const factors = factorsData?.factors ?? []
      await Promise.all(
        factors.map(async (factor: { id: string }) => {
          await supabaseAdmin.auth.admin.mfa.deleteFactor({
            id: factor.id,
            userId: device.admin_id,
          })
        })
      )
    }

    return json({ ok: true, mfaDisabled: Boolean(disableMfa) }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[RESET-DEVICE-SLOT] unexpected error:', message)
    return json({ error: message }, 500, corsHeaders)
  }
})
