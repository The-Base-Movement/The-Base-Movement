-- Phase 13: The Movement War Room (Real-time Crisis & Rapid Response)
-- Infrastructure for flash mobilization, crisis management, and media counter-narratives

-- 1. Rapid Response Directives (Flash Rallies / Urgent Missions)
CREATE TABLE IF NOT EXISTS public.rapid_response_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR DEFAULT 'HIGH', -- CRITICAL, HIGH, ELEVATED
    target_region VARCHAR, -- Can be specific region or 'NATIONAL'
    action_type VARCHAR, -- FLASH_RALLY, DIGITAL_STRIKE, SUPPLY_RUN
    status VARCHAR DEFAULT 'ACTIVE', -- ACTIVE, STANDBY, RESOLVED
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Crisis Incidents (Localized Resistance / Negative PR)
CREATE TABLE IF NOT EXISTS public.crisis_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR NOT NULL, -- PR_ATTACK, LOGISTICAL_FAILURE, PROTEST
    severity VARCHAR DEFAULT 'MODERATE', -- LOW, MODERATE, SEVERE, DEFCON1
    region VARCHAR NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR DEFAULT 'INVESTIGATING', -- INVESTIGATING, CONTAINED, RESOLVED
    assigned_commander UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Media Counter-Narratives (Coordinated Social Media Responses)
CREATE TABLE IF NOT EXISTS public.media_counter_narratives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_id UUID REFERENCES public.crisis_incidents(id) ON DELETE CASCADE,
    target_platform VARCHAR, -- TWITTER, FACEBOOK, RADIO, TV
    approved_messaging TEXT NOT NULL,
    hashtags TEXT, -- Comma-separated
    dispatch_status VARCHAR DEFAULT 'PENDING', -- PENDING, DEPLOYED
    deployment_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. RLS Policies
ALTER TABLE public.rapid_response_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_counter_narratives ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rapid response directives
CREATE POLICY "Public can view active rapid response directives" 
ON public.rapid_response_directives FOR SELECT 
USING (status = 'ACTIVE');

-- Only admins can create/manage war room assets
CREATE POLICY "Admins manage rapid response" 
ON public.rapid_response_directives FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins manage crisis incidents" 
ON public.crisis_incidents FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins manage counter-narratives" 
ON public.media_counter_narratives FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Add trigger for updated_at on crisis incidents
CREATE OR REPLACE FUNCTION public.handle_crisis_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_crisis_update
    BEFORE UPDATE ON public.crisis_incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crisis_update();
