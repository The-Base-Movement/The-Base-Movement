-- 🚩 THE BASE: URGENT BROADCAST AUTOMATION
-- Triggers the broadcast-dispatcher Edge Function for Urgent mobilization alerts.

-- Ensure the net extension is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to trigger the Dispatcher
CREATE OR REPLACE FUNCTION public.trigger_broadcast_dispatcher()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only trigger for Urgent priority broadcasts
  IF NEW.priority = 'Urgent' THEN
    SELECT extensions.net_http_post(
      url := 'https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/broadcast-dispatcher',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    ) INTO request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the Trigger
DROP TRIGGER IF EXISTS on_urgent_broadcast_created ON public.broadcasts;
CREATE TRIGGER on_urgent_broadcast_created
  AFTER INSERT ON public.broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_broadcast_dispatcher();
