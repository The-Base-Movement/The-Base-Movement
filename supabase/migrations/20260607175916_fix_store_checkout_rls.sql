-- Store checkout must support both authenticated member orders and guest orders.
-- The checkout client inserts an order and immediately selects the generated id.

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON TABLE public.store_orders TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.store_order_items TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public insert to store_orders" ON public.store_orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.store_orders;
DROP POLICY IF EXISTS "Guests can view guest checkout orders" ON public.store_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.store_orders;
DROP POLICY IF EXISTS "Admins can update order status" ON public.store_orders;

CREATE POLICY "Allow public insert to store_orders"
ON public.store_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_id IS NULL OR customer_id = auth.uid()
);

CREATE POLICY "Users can view their own orders"
ON public.store_orders
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Guests can view guest checkout orders"
ON public.store_orders
FOR SELECT
TO anon
USING (customer_id IS NULL);

CREATE POLICY "Admins can view all orders"
ON public.store_orders
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins can update order status"
ON public.store_orders
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

DROP POLICY IF EXISTS "Allow public insert to store_order_items" ON public.store_order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.store_order_items;
DROP POLICY IF EXISTS "Guests can view guest checkout order items" ON public.store_order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.store_order_items;

CREATE POLICY "Allow public insert to store_order_items"
ON public.store_order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.store_orders
    WHERE store_orders.id = store_order_items.order_id
      AND (store_orders.customer_id IS NULL OR store_orders.customer_id = auth.uid())
  )
);

CREATE POLICY "Users can view their own order items"
ON public.store_order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.store_orders
    WHERE store_orders.id = store_order_items.order_id
      AND store_orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Guests can view guest checkout order items"
ON public.store_order_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.store_orders
    WHERE store_orders.id = store_order_items.order_id
      AND store_orders.customer_id IS NULL
  )
);

CREATE POLICY "Admins can view all order items"
ON public.store_order_items
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));
