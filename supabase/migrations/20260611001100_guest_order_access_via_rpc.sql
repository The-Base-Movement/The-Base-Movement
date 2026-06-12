-- SECURITY: anon could SELECT every guest-checkout order (customer_id IS NULL)
-- on store_orders / store_order_items — names, phones and delivery addresses
-- of all guest customers were listable by any visitor.
--
-- Guest order confirmation only ever fetches a single order by its UUID (an
-- unguessable bearer token handed out at checkout), so listing is never
-- needed. Replace the anon SELECT branch with a SECURITY DEFINER RPC that
-- returns exactly one guest order by id; table SELECT becomes
-- authenticated-only (admins, or the order's owner).

-- 1. Single-order lookup for guest checkout confirmation.
CREATE OR REPLACE FUNCTION public.get_guest_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT to_jsonb(o) || jsonb_build_object(
    'items',
    coalesce((
      SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('product_name', inv.name))
      FROM store_order_items i
      LEFT JOIN store_inventory inv ON inv.id = i.product_id
      WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  FROM store_orders o
  WHERE o.id = p_order_id AND o.customer_id IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_guest_order(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_guest_order(uuid) TO anon, authenticated;

-- 2. Remove the anon guest branch from table SELECT policies.
DROP POLICY IF EXISTS store_orders_select ON public.store_orders;
CREATE POLICY store_orders_select ON public.store_orders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.id = (select auth.uid()))
    OR customer_id = (select auth.uid())
  );

DROP POLICY IF EXISTS store_order_items_select ON public.store_order_items;
CREATE POLICY store_order_items_select ON public.store_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.id = (select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM store_orders
      WHERE store_orders.id = store_order_items.order_id
        AND store_orders.customer_id = (select auth.uid())
    )
  );
