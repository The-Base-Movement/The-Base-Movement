-- ADMIN HIERARCHY & SECURITY MIGRATION
-- This script secures the Admin Command Center by establishing a dedicated administrative hierarchy.

-- 1. Create Admins Table
-- This table stores elevated permissions and roles for movement leadership.
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Editor', -- 'SuperAdmin', 'RegionalAdmin', 'Editor', 'StoreManager'
    permissions JSONB DEFAULT '{
        "can_manage_members": false,
        "can_manage_store": false,
        "can_manage_donations": false,
        "can_post_blog": true,
        "can_view_audit_logs": false
    }',
    assigned_region VARCHAR(100), -- For Regional Admins to scope their view
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Link Audit Logs to Admins
-- Ensures all administrative actions are traceable to a verified leader.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_logs_admin'
    ) THEN
        ALTER TABLE audit_logs 
        ADD CONSTRAINT fk_audit_logs_admin 
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Configure Row Level Security (RLS) for Admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only SuperAdmins can see the list of other admins
CREATE POLICY "SuperAdmins can view all admins" 
ON admins FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE id = auth.uid() AND role = 'SuperAdmin'
    )
);

-- All admins can view their own record
CREATE POLICY "Admins can view their own record" 
ON admins FOR SELECT 
USING (id = auth.uid());

-- 4. Initial Seed Data
-- Note: You must first have a user with this email in the 'users' table.
-- Replace the subquery with a specific ID if you want to hardcode the first SuperAdmin.
/*
INSERT INTO admins (id, role, permissions)
SELECT id, 'SuperAdmin', '{
    "can_manage_members": true,
    "can_manage_store": true,
    "can_manage_donations": true,
    "can_post_blog": true,
    "can_view_audit_logs": true
}'
FROM users 
WHERE email = 'admin@thebase.org' -- Replace with your actual admin email
ON CONFLICT (id) DO NOTHING;
*/
