-- MOVEMENT GAMIFICATION ENGINE
-- This migration establishes the high-fidelity achievement and leaderboard system.

-- 1. Achievements Definition Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL, -- Lucide icon name
    description TEXT NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Member Achievements (Junction Table)
CREATE TABLE IF NOT EXISTS member_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, achievement_id)
);

-- 3. Member Points Table
CREATE TABLE IF NOT EXISTS member_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Leaderboard View
-- Aggregates points and regional data for competitive visualization.
CREATE OR REPLACE VIEW movement_leaderboard AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.region,
    COALESCE(p.points, 0) as total_points,
    RANK() OVER (ORDER BY COALESCE(p.points, 0) DESC) as national_rank,
    RANK() OVER (PARTITION BY u.region ORDER BY COALESCE(p.points, 0) DESC) as regional_rank
FROM users u
LEFT JOIN member_points p ON u.id = p.user_id;

-- 5. Seed Initial Achievements
INSERT INTO achievements (name, icon, description, points_awarded) VALUES
('Pioneer', 'Zap', 'Joined during the initial movement expansion.', 500),
('Field Operative', 'MapPin', 'Completed first local mobilization event.', 1000),
('Mobilizer', 'Users', 'Successfully recruited 10 new members.', 2500),
('Strategic Lead', 'ShieldCheck', 'Verified 50 member registrations.', 5000)
ON CONFLICT DO NOTHING;

-- 6. RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public view of achievements" ON achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members view own points" ON member_points FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Members view own awarded achievements" ON member_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
