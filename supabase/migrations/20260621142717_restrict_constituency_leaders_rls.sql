-- Drop the old permissive authenticated policies
DROP POLICY IF EXISTS "constituency_leaders_auth_insert" ON public.constituency_leaders;
DROP POLICY IF EXISTS "constituency_leaders_auth_delete" ON public.constituency_leaders;

-- Create the new admin-only write policies
CREATE POLICY "constituency_leaders_auth_insert" ON public.constituency_leaders
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.admins)
  );

CREATE POLICY "constituency_leaders_auth_delete" ON public.constituency_leaders
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.admins)
  );
