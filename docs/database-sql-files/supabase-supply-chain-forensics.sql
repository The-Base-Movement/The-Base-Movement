-- Phase 10: Logistics & Supply Chain Hardening
-- Supply Chain Forensic Triggers

-- 1. Trigger for Store Order Dispatch Audit
CREATE OR REPLACE FUNCTION public.audit_store_order_dispatch()
RETURNS TRIGGER AS $$
BEGIN
    -- When an order is marked as 'Dispatched'
    IF NEW.status = 'Dispatched' AND OLD.status != 'Dispatched' THEN
        INSERT INTO public.logistics_audit (
            product_id,
            action,
            quantity_change,
            source_location,
            destination_location,
            performed_by,
            notes
        )
        SELECT 
            oi.product_id,
            'DISPATCHED',
            -oi.quantity,
            'National Vault',
            NEW.region_or_state || ' Hub',
            NULL, -- Can be updated to use current user if possible, but triggers run in system context
            'Order #' || NEW.id || ' dispatched to ' || NEW.shipping_address
        FROM public.store_order_items oi
        WHERE oi.order_id = NEW.id;
    END IF;
    
    -- When an order is marked as 'Delivered'
    IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
        INSERT INTO public.logistics_audit (
            action,
            source_location,
            destination_location,
            notes
        )
        VALUES (
            'DELIVERED',
            NEW.region_or_state || ' Hub',
            'Member: ' || NEW.full_name,
            'Order #' || NEW.id || ' confirmed delivered.'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger to store_orders
DROP TRIGGER IF EXISTS on_order_dispatch_audit ON public.store_orders;
CREATE TRIGGER on_order_dispatch_audit
    AFTER UPDATE ON public.store_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_store_order_dispatch();

-- 3. Trigger for Resource Request Fulfillment Audit
CREATE OR REPLACE FUNCTION public.audit_resource_request_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    -- When a request is marked as 'Fulfilled' (assuming status exists)
    IF NEW.status = 'Fulfilled' AND OLD.status != 'Fulfilled' THEN
        INSERT INTO public.logistics_audit (
            product_id,
            request_id,
            action,
            quantity_change,
            source_location,
            destination_location,
            notes
        )
        SELECT 
            ri.product_id,
            NEW.id,
            'RESOURCE_FULFILLED',
            -ri.quantity,
            'National Vault',
            NEW.region || ' Hub',
            'Resource request fulfilled for ' || NEW.constituency
        FROM public.resource_request_items ri
        WHERE ri.request_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to resource_requests
DROP TRIGGER IF EXISTS on_resource_request_audit ON public.resource_requests;
CREATE TRIGGER on_resource_request_audit
    AFTER UPDATE ON public.resource_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_resource_request_fulfillment();
