-- 🏆 THE BASE: PHASE 8 - GAMIFICATION & REGIONAL POWER
-- This schema establishes the infrastructure for mobilization rewards and achievement recognition.

-- 1. ACHIEVEMENTS CATALOG
-- Defines the types of badges and milestones available.
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('Mobilization', 'Recruitment', 'Consistency', 'Events', 'Leadership'));

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    description TEXT NOT NULL,
    icon character varying NOT NULL, -- Lucide icon name
    category TEXT CHECK (category IN ('Mobilization', 'Recruitment', 'Consistency', 'Events', 'Leadership')),
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MEMBER ACHIEVEMENTS (Earned Badges)
CREATE TABLE IF NOT EXISTS public.member_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- 3. MOBILIZATION POINTS LEDGER
-- Detailed tracking of how points were earned (direct action, recruitment, etc.)
CREATE TABLE IF NOT EXISTS public.member_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID, -- Link to field_report.id, user.id (for recruitment), etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. REGIONAL LEADERBOARD VIEW
-- Aggregated performance by chapter and region.
CREATE OR REPLACE VIEW public.regional_performance_leaderboard AS
SELECT 
    u.region,
    u.chapter,
    COUNT(u.id) as total_patriots,
    COALESCE(SUM(mp.points), 0) as total_mobilization_points,
    COUNT(DISTINCT ma.id) as achievements_unlocked,
    RANK() OVER (PARTITION BY u.region ORDER BY SUM(mp.points) DESC) as regional_rank
FROM public.users u
LEFT JOIN public.member_points mp ON u.id = mp.user_id
LEFT JOIN public.member_achievements ma ON u.id = ma.user_id
GROUP BY u.region, u.chapter;

-- 5. ENABLE RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
CREATE POLICY "Achievements are public read" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users view own achievements" ON public.member_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users view own points" ON public.member_points FOR SELECT USING (user_id = auth.uid());

-- Admins: Full management
CREATE POLICY "Admins manage achievements" ON public.achievements 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 7. SEED INITIAL ACHIEVEMENTS
INSERT INTO public.achievements (name, description, icon, category, points_awarded) VALUES
('First Direct Action', 'Completed your first tactical field directive.', 'Target', 'Mobilization', 10),
('Recruitment Sergeant', 'Recruited 10 new patriots to the movement.', 'Users', 'Recruitment', 100),
('Event Veteran', 'Attended 5 regional field events.', 'Calendar', 'Events', 50),
('Chapter Leader', 'Appointed as a chapter lead for mobilization.', 'Shield', 'Leadership', 500)
ON CONFLICT DO NOTHING;
