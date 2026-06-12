-- MOVEMENT COMMUNICATION ENGINE
-- This migration establishes the high-fidelity broadcast and notification infrastructure.

-- 1. Broadcasts Table
-- Stores HQ-to-Field directives and mobilization alerts.
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_type VARCHAR(50) NOT NULL DEFAULT 'ALL', -- ALL, REGION, CONSTITUENCY
    target_value VARCHAR(100), -- Region name or Constituency name
    priority VARCHAR(50) DEFAULT 'Normal', -- Normal, High, Urgent
    status VARCHAR(50) DEFAULT 'Sent', -- Draft, Sent, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Notifications Table
-- Individualized message delivery for every movement member.
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Info', -- Info, Alert, Action
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_broadcasts_target ON broadcasts(target_type, target_value);

-- 4. RLS Policies
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage broadcasts
CREATE POLICY "Admins manage broadcasts" ON broadcasts 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Members can view notifications sent to them
CREATE POLICY "Members view own notifications" ON notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Members can update their own notification read status
CREATE POLICY "Members update read status" ON notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
