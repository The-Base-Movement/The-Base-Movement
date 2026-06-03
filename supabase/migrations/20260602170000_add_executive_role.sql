-- Add EXECUTIVE role to admins table constraint.
-- Executives are the movement's decision makers with full admin access.
ALTER TABLE public.admins
  DROP CONSTRAINT IF EXISTS admins_role_check,
  ADD CONSTRAINT admins_role_check CHECK (role IN (
    'SuperAdmin', 'RegionalAdmin', 'FinanceOfficer',
    'ADMIN', 'SUPER_ADMIN', 'FINANCE_OFFICER', 'EXECUTIVE',
    'FOUNDER', 'ORGANIZER', 'REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD',
    'VERIFIER', 'CHIEF_EDITOR', 'SENIOR_EDITOR', 'EDITOR', 'JUNIOR_EDITOR',
    'REGIONAL_CORRESPONDENT'
  ));
