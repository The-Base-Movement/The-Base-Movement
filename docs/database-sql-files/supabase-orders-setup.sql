-- ==============================================
-- THE BASE MOVEMENT: STORE ORDERS SCHEMA
-- ==============================================

-- 1. Create the store_orders table to track transactions
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    region_or_state VARCHAR(100),
    payment_method VARCHAR(50) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create the store_order_items table to track purchased line items
CREATE TABLE IF NOT EXISTS public.store_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.store_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.store_inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can insert their own orders (even guests if we allow anon inserts, but let's restrict to authenticated or public)
-- To allow guest checkouts, we will allow inserts from the 'anon' role as well.
CREATE POLICY "Allow public insert to store_orders" 
ON public.store_orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public insert to store_order_items" 
ON public.store_order_items FOR INSERT 
WITH CHECK (true);

-- Users can only read their OWN orders based on the customer_id
CREATE POLICY "Users can view their own orders" 
ON public.store_orders FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can view their own order items" 
ON public.store_order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.store_orders 
        WHERE store_orders.id = store_order_items.order_id 
        AND store_orders.customer_id = auth.uid()
    )
);

-- Admins can read everything
CREATE POLICY "Admins can view all orders" 
ON public.store_orders FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
);

CREATE POLICY "Admins can view all order items" 
ON public.store_order_items FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
);

-- 5. Admins can update order status (dispatch, deliver, cancel)
CREATE POLICY "Admins can update order status"
ON public.store_orders FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
);

-- 6. Performance indexes for dashboard pagination and telemetry
CREATE INDEX IF NOT EXISTS idx_store_orders_created_at 
ON public.store_orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_orders_status 
ON public.store_orders (status);

CREATE INDEX IF NOT EXISTS idx_store_orders_customer 
ON public.store_orders (customer_id);
