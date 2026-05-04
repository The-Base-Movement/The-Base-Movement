-- 🚩 THE BASE: SENTIMENT INTELLIGENCE PIPELINE
-- This script establishes the infrastructure for tracking and analyzing movement sentiment.

-- 1. Ensure Polls has Category
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';

-- 2. Create Poll Votes Table (if not exists)
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

-- 3. Create Member Feedback Table
CREATE TABLE IF NOT EXISTS public.member_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    category text NOT NULL, -- e.g., 'Policy', 'Chapter', 'Leadership', 'Other'
    content text NOT NULL,
    sentiment_score float DEFAULT 0.0, -- -1.0 (Negative) to 1.0 (Positive)
    is_reviewed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Members can only see/insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.member_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.member_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid()
        )
    );

-- 4. Create Sentiment Intelligence View
-- This view correlates poll engagement with feedback sentiment
CREATE OR REPLACE VIEW public.sentiment_intelligence AS
SELECT 
    f.category,
    COUNT(f.id) as feedback_count,
    AVG(f.sentiment_score) as avg_sentiment,
    (
        SELECT COUNT(*) 
        FROM public.poll_votes pv
        JOIN public.polls p ON pv.poll_id = p.id
        WHERE p.category = f.category
    ) as poll_engagement_count
FROM public.member_feedback f
GROUP BY f.category;

-- 5. Mock Data for initialization
INSERT INTO public.member_feedback (category, content, sentiment_score)
VALUES 
('Policy', 'I love the focus on industrialization in the Western region!', 0.8),
('Leadership', 'We need more frequent updates from the National Steering Committee.', -0.2),
('Chapter', 'Our Kumasi chapter is growing fast, but we need a larger meeting space.', 0.4)
ON CONFLICT DO NOTHING;
