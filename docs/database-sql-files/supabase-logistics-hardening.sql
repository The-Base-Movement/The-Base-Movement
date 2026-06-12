-- Phase 10: Logistics & Supply Chain Hardening
-- Automated Inventory Intelligence & Alerting

-- 1. Extend store_inventory with alert thresholds
ALTER TABLE public.store_inventory 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;

-- 2. Create high-fidelity logistics audit view
CREATE OR REPLACE VIEW public.logistics_velocity_telemetry AS
SELECT 
    region_or_state as region,
    COUNT(id) as total_orders,
    AVG(EXTRACT(EPOCH FROM (dispatched_at - created_at)) / 3600)::NUMERIC(10,2) as avg_dispatch_hours,
    AVG(EXTRACT(EPOCH FROM (delivered_at - dispatched_at)) / 3600)::NUMERIC(10,2) as avg_delivery_hours,
    COUNT(CASE WHEN status = 'Delivered' THEN 1 END) * 100.0 / NULLIF(COUNT(id), 0) as fulfillment_rate
FROM public.store_orders
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY region_or_state;

-- 3. Inventory Alert Trigger Function
CREATE OR REPLACE FUNCTION public.handle_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity <= NEW.low_stock_threshold AND (OLD.stock_quantity > NEW.low_stock_threshold OR OLD.alert_sent = FALSE) THEN
        -- Insert into audit logs for traceability
        INSERT INTO public.audit_logs (action, resource, status, metadata)
        VALUES (
            'LOW_STOCK_ALERT',
            'store_inventory',
            'Urgent',
            jsonb_build_object(
                'product_id', NEW.id,
                'product_name', NEW.name,
                'current_stock', NEW.stock_quantity,
                'threshold', NEW.low_stock_threshold
            )
        );
        
        -- Create a system notification for the National Logistics Lead
        -- Assuming a broad target for now, can be refined to specific roles
        INSERT INTO public.notifications (user_id, title, message, type)
        SELECT id, 'LOW STOCK ALERT: ' || NEW.name, 
               'Inventory for ' || NEW.name || ' has fallen below the safety threshold (' || NEW.low_stock_threshold || '). Current stock: ' || NEW.stock_quantity,
               'Warning'
        FROM public.admins
        WHERE role = 'National Logistics Lead' OR role = 'Editor'; -- Fallback to Editor for testing
        
        NEW.alert_sent := TRUE;
    ELSIF NEW.stock_quantity > NEW.low_stock_threshold THEN
        NEW.alert_sent := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to inventory updates
DROP TRIGGER IF EXISTS on_inventory_update_alert ON public.store_inventory;
CREATE TRIGGER on_inventory_update_alert
    BEFORE UPDATE ON public.store_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_low_stock_alert();

-- 5. Seed some thresholds for high-fidelity testing
UPDATE public.store_inventory SET low_stock_threshold = 20 WHERE category = 'Apparel';
UPDATE public.store_inventory SET low_stock_threshold = 50 WHERE category = 'Media';
