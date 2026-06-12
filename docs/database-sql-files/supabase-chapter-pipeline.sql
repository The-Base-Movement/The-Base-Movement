-- CHAPTER LEADERSHIP PIPELINE MIGRATION
-- This script enables the workflow for applying for, approving, and managing chapters.

-- 1. Create Chapter Applications Table
CREATE TABLE IF NOT EXISTS chapter_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    proposed_chapter_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    constituency VARCHAR(100) NOT NULL,
    experience_summary TEXT,
    vision_statement TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    reviewed_by UUID REFERENCES admins(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enhance Chapters Table
-- Link the chapter directly to a leader and their assigned admin profile.
ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS constituency VARCHAR(100);

-- 3. Scoped Security Policies for Chapter Leaders
-- This ensures Chapter Leaders can ONLY see members in their own chapter/constituency.

-- Enable RLS on chapters if not already enabled
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Policy: Chapter Leaders can manage their own chapter details
CREATE POLICY "Chapter Leaders can update their own chapters" 
ON chapters FOR UPDATE 
USING (leader_id = auth.uid());

-- Policy: Chapter Leaders can view members in their specific constituency
-- We apply this to the 'users' table
CREATE POLICY "Chapter Leaders can view their constituency members" 
ON users FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM chapters 
        WHERE leader_id = auth.uid() 
        AND chapters.constituency = users.constituency
    )
);

-- 4. Logic for "Approving" an Application (PostgreSQL Function)
-- This function automates the promotion of a user to Chapter Leader.
CREATE OR REPLACE FUNCTION approve_chapter_application(
    app_id UUID, 
    admin_uid UUID,
    notes TEXT
) RETURNS VOID AS $$
DECLARE
    v_applicant_id UUID;
    v_chapter_name TEXT;
    v_region TEXT;
    v_constituency TEXT;
BEGIN
    -- 1. Get application details
    SELECT applicant_id, proposed_chapter_name, region, constituency 
    INTO v_applicant_id, v_chapter_name, v_region, v_constituency
    FROM chapter_applications WHERE id = app_id;

    -- 2. Update Application Status
    UPDATE chapter_applications 
    SET status = 'Approved', reviewed_by = admin_uid, review_notes = notes, updated_at = now()
    WHERE id = app_id;

    -- 3. Create/Update the Admin record for the applicant
    INSERT INTO admins (id, role, assigned_region)
    VALUES (v_applicant_id, 'ChapterLeader', v_region)
    ON CONFLICT (id) DO UPDATE SET role = 'ChapterLeader', assigned_region = v_region;

    -- 4. Create/Update the Chapter record
    INSERT INTO chapters (name, region, constituency, leader_id, status)
    VALUES (v_chapter_name, v_region, v_constituency, v_applicant_id, 'Active')
    ON CONFLICT (name) DO UPDATE SET leader_id = v_applicant_id, status = 'Active';

    -- 5. Log the action
    INSERT INTO audit_logs (action, resource, status, admin_id, metadata)
    VALUES ('Approve Chapter', 'chapter_applications', 'Success', admin_uid, jsonb_build_object('applicant_id', v_applicant_id, 'chapter', v_chapter_name));
END;
$$ LANGUAGE plpgsql;
