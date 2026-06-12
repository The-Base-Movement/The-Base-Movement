-- ==============================================
-- THE BASE MOVEMENT: RESOURCE LOGISTICS SCHEMA
-- ==============================================

-- 1. Create Resource Requests Table (HQ <-> Regions)
CREATE TABLE IF NOT EXISTS public.resource_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id), -- Regional/Constituency Leader
    region VARCHAR(100) NOT NULL,
    constituency VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Dispatched, Delivered, Rejected
    priority VARCHAR(50) DEFAULT 'Normal', -- Normal, High, Urgent
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Request Items (Line items for the request)
CREATE TABLE IF NOT EXISTS public.resource_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.resource_requests(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.store_inventory(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Logistics Audit (Movement History)
CREATE TABLE IF NOT EXISTS public.logistics_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.resource_requests(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.store_inventory(id),
    action VARCHAR(100) NOT NULL, -- DISPATCHED, RETURNED, REPLENISHED, ADJUSTED
    quantity_change INTEGER NOT NULL,
    source_location VARCHAR(255) DEFAULT 'National Vault',
    destination_location VARCHAR(255),
    performed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable RLS
ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_audit ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Admins can manage everything
CREATE POLICY "Admins have full access to resource_requests" 
ON public.resource_requests FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins have full access to resource_request_items" 
ON public.resource_request_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins have full access to logistics_audit" 
ON public.logistics_audit FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- Regional Leaders can create requests and view their own
CREATE POLICY "Regional Leaders can insert resource_requests" 
ON public.resource_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Regional Leaders can view their own resource_requests" 
ON public.resource_requests FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Regional Leaders can view their own request items" 
ON public.resource_request_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.resource_requests 
        WHERE resource_requests.id = resource_request_items.request_id 
        AND resource_requests.requester_id = auth.uid()
    )
);
