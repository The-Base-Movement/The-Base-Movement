-- MOVEMENT ROADMAP SCHEMA
-- This migration adds support for the Interactive Movement Roadmap.

CREATE TABLE IF NOT EXISTS movement_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Upcoming', -- Upcoming, In Progress, Completed
    category VARCHAR(100), -- Mobilization, Logistics, Legal, Infrastructure
    importance_level VARCHAR(50) DEFAULT 'Normal', -- Normal, High, Critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed Initial Milestones
INSERT INTO movement_milestones (title, description, target_date, status, category, importance_level) VALUES
('Phase 1: National Registration Launch', 'Initialization of the member database and official portal rollout.', '2026-04-30', 'Completed', 'Infrastructure', 'Critical'),
('Regional HQ Establishment', 'Setting up physical mobilization offices across the 16 regions of Ghana.', '2026-06-15', 'In Progress', 'Mobilization', 'High'),
('Movement Merchandise Drop', 'Release of official brand apparel and field mobilization materials.', '2026-05-20', 'Upcoming', 'Logistics', 'Normal'),
('National Policy Summit', 'Convening movement leadership to finalize the Job Creation Charter.', '2026-08-10', 'Upcoming', 'Legal', 'High'),
('1 Million Members Milestone', 'Strategic mobilization target to achieve 1 million verified members.', '2026-12-31', 'Upcoming', 'Mobilization', 'Critical')
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE movement_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to milestones" ON movement_milestones FOR SELECT USING (true);
