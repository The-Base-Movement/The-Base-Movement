-- Phase 14: Operation "Ground Game" (Voter Registration & Turnout)
-- Infrastructure for canvassing, voter registration pipelines, and Election Day logistics

-- 1. Voter Registration Tracking (Linked to Member Profiles)
CREATE TABLE IF NOT EXISTS public.voter_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_status VARCHAR DEFAULT 'UNVERIFIED', -- UNVERIFIED, IN_PROGRESS, VERIFIED_VOTER
    polling_station_id VARCHAR, -- Official EC Polling Station Code
    verification_document_url TEXT, -- E.g., photo of voter ID (securely stored)
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- 2. Canvassing Campaigns (Door-to-Door Outreaches)
CREATE TABLE IF NOT EXISTS public.canvassing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    target_constituency VARCHAR NOT NULL,
    target_wards TEXT[], -- Array of specific wards or electoral areas
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal_contacts INTEGER DEFAULT 100,
    status VARCHAR DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED
    commander_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Canvasser Interaction Logs (Digital Clipboard)
CREATE TABLE IF NOT EXISTS public.canvasser_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.canvassing_campaigns(id) ON DELETE CASCADE,
    canvasser_id UUID REFERENCES auth.users(id),
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8),
    address_notes TEXT,
    contact_name VARCHAR,
    interaction_result VARCHAR NOT NULL, -- STRONG_SUPPORT, LEANING, UNDECIDED, HOSTILE, NOT_HOME
    key_issues TEXT[], -- E.g., ["Economy", "Roads", "Education"]
    needs_follow_up BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Election Day Logistics (GOTV - Get Out The Vote)
CREATE TABLE IF NOT EXISTS public.gotv_transport_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id),
    pickup_address TEXT NOT NULL,
    polling_station_id VARCHAR NOT NULL,
    requested_time TIMESTAMP WITH TIME ZONE NOT NULL,
    passengers INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'PENDING', -- PENDING, DISPATCHED, COMPLETED, CANCELLED
    assigned_driver_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.voter_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvassing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvasser_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gotv_transport_requests ENABLE ROW LEVEL SECURITY;

-- Voter Registration Policies
CREATE POLICY "Users can view their own voter registration" 
ON public.voter_registrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voter registration" 
ON public.voter_registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voter registration" 
ON public.voter_registrations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all voter registrations" 
ON public.voter_registrations FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Canvassing Policies
CREATE POLICY "Public can view active canvassing campaigns" 
ON public.canvassing_campaigns FOR SELECT 
USING (status = 'ACTIVE');

CREATE POLICY "Admins manage canvassing campaigns" 
ON public.canvassing_campaigns FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Canvasser Logs
CREATE POLICY "Canvassers can insert their own logs" 
ON public.canvasser_logs FOR INSERT 
WITH CHECK (auth.uid() = canvasser_id);

CREATE POLICY "Admins can view all canvasser logs" 
ON public.canvasser_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- GOTV Transport Policies
CREATE POLICY "Users can manage their own transport requests" 
ON public.gotv_transport_requests FOR ALL 
USING (auth.uid() = requester_id);

CREATE POLICY "Admins and Drivers can view transport requests" 
ON public.gotv_transport_requests FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) 
    OR 
    auth.uid() = assigned_driver_id
);
