-- Phase 12: National Sentiment Analysis & Predictive Polling
-- AI-driven engagement analytics and impact modeling

-- 1. Member Feedback & Sentiment Feed
CREATE TABLE IF NOT EXISTS public.member_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    category VARCHAR DEFAULT 'General', -- Policy, Logistics, Leadership, Local
    sentiment_score NUMERIC(3, 2), -- -1.0 to 1.0
    sentiment_label VARCHAR, -- Positive, Negative, Neutral
    region VARCHAR,
    constituency VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. National Sentiment Telemetry (Aggregated for Charts)
CREATE TABLE IF NOT EXISTS public.national_sentiment_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR NOT NULL,
    avg_sentiment NUMERIC(3, 2) DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(region)
);

-- 3. Predictive Polling Metrics (Impact Projection)
CREATE TABLE IF NOT EXISTS public.predictive_impact_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR NOT NULL,
    current_reach INTEGER DEFAULT 0,
    projected_reach_30d INTEGER DEFAULT 0,
    confidence_score NUMERIC(3, 2) DEFAULT 0.85,
    mobilization_velocity NUMERIC(5, 2) DEFAULT 0, -- members per day
    potential_election_impact NUMERIC(3, 2) DEFAULT 0, -- 0.0 to 1.0 (swing factor)
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(region)
);

-- 4. RLS Policies
ALTER TABLE public.member_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_sentiment_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_impact_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own feedback" 
ON public.member_feedback FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback and analytics" 
ON public.member_feedback FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Anyone can view national sentiment" 
ON public.national_sentiment_telemetry FOR SELECT 
USING (TRUE);

CREATE POLICY "Admins can manage projections" 
ON public.predictive_impact_projections FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 5. Automated Sentiment Aggregation Trigger
CREATE OR REPLACE FUNCTION public.update_national_sentiment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.national_sentiment_telemetry (region, avg_sentiment, total_responses, last_updated)
    VALUES (
        NEW.region, 
        NEW.sentiment_score, 
        1, 
        NOW()
    )
    ON CONFLICT (region) DO UPDATE 
    SET total_responses = public.national_sentiment_telemetry.total_responses + 1,
        avg_sentiment = (public.national_sentiment_telemetry.avg_sentiment * public.national_sentiment_telemetry.total_responses + NEW.sentiment_score) / (public.national_sentiment_telemetry.total_responses + 1),
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_feedback_submitted
    AFTER INSERT ON public.member_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_national_sentiment();
