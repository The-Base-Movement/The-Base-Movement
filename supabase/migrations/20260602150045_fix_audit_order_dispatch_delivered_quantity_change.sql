-- Fix: audit_store_order_dispatch trigger was inserting a DELIVERED row into
-- logistics_audit without providing quantity_change, which violates the NOT NULL
-- constraint (code 23502) and rolled back the entire store_orders UPDATE.
-- The DELIVERED branch now supplies quantity_change = 0 (no stock movement occurs
-- at delivery; it already happened at dispatch).

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
            COALESCE(NEW.region_or_state, 'Unknown') || ' Hub',
            NULL,
            'Order #' || NEW.id || ' dispatched to ' || NEW.shipping_address
        FROM public.store_order_items oi
        WHERE oi.order_id = NEW.id;
    END IF;

    -- When an order is marked as 'Delivered'
    -- quantity_change = 0 because stock was already deducted at dispatch
    IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
        INSERT INTO public.logistics_audit (
            action,
            quantity_change,
            source_location,
            destination_location,
            notes
        )
        VALUES (
            'DELIVERED',
            0,
            COALESCE(NEW.region_or_state, 'Unknown') || ' Hub',
            'Member: ' || NEW.full_name,
            'Order #' || NEW.id || ' confirmed delivered.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
