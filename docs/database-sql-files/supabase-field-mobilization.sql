-- Phase 11: National Field Mobilization & Rally Intelligence
-- Rally Tracking Engine & Geo-Fenced Check-ins

-- 1. Field Actions (Rallies, Town Halls, etc.)
CREATE TABLE IF NOT EXISTS public.field_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR DEFAULT 'Rally', -- Rally, Town Hall, March, Training
    status VARCHAR DEFAULT 'Upcoming', -- Upcoming, Live, Completed, Cancelled
    location_name VARCHAR NOT NULL,
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8),
    geofence_radius_meters INTEGER DEFAULT 500,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    target_attendance INTEGER DEFAULT 1000,
    organizer_id UUID REFERENCES auth.users(id),
    region VARCHAR,
    constituency VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Field Action Attendance (Verified Check-ins)
CREATE TABLE IF NOT EXISTS public.field_action_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES public.field_actions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_lat NUMERIC(10, 8),
    check_in_lng NUMERIC(11, 8),
    is_verified BOOLEAN DEFAULT FALSE,
    points_awarded INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::JSONB,
    UNIQUE(action_id, user_id)
);

-- 3. RLS Policies for Field Actions
ALTER TABLE public.field_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active actions" 
ON public.field_actions FOR SELECT 
USING (status != 'Cancelled');

CREATE POLICY "Admins can manage actions" 
ON public.field_actions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 4. RLS Policies for Attendance
ALTER TABLE public.field_action_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own attendance" 
ON public.field_action_attendance FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can check in" 
ON public.field_action_attendance FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all attendance" 
ON public.field_action_attendance FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 5. Automated Points for Verified Attendance
CREATE OR REPLACE FUNCTION public.handle_rally_attendance_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Award points only once upon verification
    IF NEW.is_verified = TRUE AND (OLD.is_verified = FALSE OR OLD.is_verified IS NULL) THEN
        -- Add points to member_points
        INSERT INTO public.member_points (user_id, points)
        VALUES (NEW.user_id, 50) -- Standard 50 points for rally attendance
        ON CONFLICT (user_id) DO UPDATE 
        SET points = public.member_points.points + 50,
            last_updated = NOW();
            
        -- Log achievement potential
        INSERT INTO public.audit_logs (action, resource, status, metadata)
        VALUES (
            'RALLY_ATTENDANCE_VERIFIED',
            'field_actions',
            'Success',
            jsonb_build_object(
                'user_id', NEW.user_id,
                'action_id', NEW.action_id,
                'points', 50
            )
        );
        
        NEW.points_awarded := 50;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rally_attendance_verified
    BEFORE UPDATE ON public.field_action_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_rally_attendance_points();
