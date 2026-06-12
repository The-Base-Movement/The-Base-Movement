-- 🚩 THE BASE: LOGISTICS LATENCY TRACKING
-- This script adds timestamp tracking for order lifecycle events to enable real-time delivery latency analytics.

-- 1. Add timestamp columns to store_orders
ALTER TABLE public.store_orders 
ADD COLUMN IF NOT EXISTS processing_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dispatched_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- 2. Create a function to automatically set these timestamps on status change
CREATE OR REPLACE FUNCTION public.track_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Processing' AND OLD.status = 'Pending' THEN
        NEW.processing_at = now();
    ELSIF NEW.status = 'Dispatched' AND OLD.status = 'Processing' THEN
        NEW.dispatched_at = now();
    ELSIF NEW.status = 'Delivered' AND OLD.status = 'Dispatched' THEN
        NEW.delivered_at = now();
    ELSIF NEW.status = 'Cancelled' THEN
        NEW.cancelled_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_order_status_change ON public.store_orders;
CREATE TRIGGER on_order_status_change
    BEFORE UPDATE OF status ON public.store_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.track_order_status_timestamps();

-- 4. Create a view for logistics intelligence
CREATE OR REPLACE VIEW public.logistics_intelligence AS
SELECT 
    region_or_state as region,
    COUNT(*) as total_deliveries,
    AVG(EXTRACT(EPOCH FROM (delivered_at - dispatched_at)) / 86400) as avg_delivery_days,
    AVG(EXTRACT(EPOCH FROM (dispatched_at - processing_at)) / 86400) as avg_processing_days
FROM public.store_orders
WHERE status = 'Delivered' AND dispatched_at IS NOT NULL AND delivered_at IS NOT NULL
GROUP BY region_or_state;
