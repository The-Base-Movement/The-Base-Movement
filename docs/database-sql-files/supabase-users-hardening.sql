-- ==============================================
-- THE BASE MOVEMENT: USER SCHEMA HARDENING
-- ==============================================

-- Add missing verification and demographic fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS age_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS education_level VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'In Review';

-- Update existing users to have a default verification status if null
UPDATE public.users SET verification_status = 'Approved' WHERE verification_status IS NULL;

-- Ensure RLS allows admins to see all users
-- (Assuming an 'admins' table or role exists as per previous context)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
);
