-- 🚩 THE BASE: EDGE FUNCTION NOTIFICATION WEBHOOK
-- Automatically triggers the notify-leads Edge Function on user registration.

-- Ensure the net extension is available for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to trigger the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_new_registration_webhook()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Construct the payload with the new user record
  -- We use net.http_post to call the edge function asynchronously
  SELECT extensions.net_http_post(
    url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/notify-leads',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created_notify ON public.users;
CREATE TRIGGER on_auth_user_created_notify
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_registration_webhook();
