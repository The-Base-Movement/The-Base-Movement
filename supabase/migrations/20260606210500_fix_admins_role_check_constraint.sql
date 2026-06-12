-- Drop the existing admins role check constraint
ALTER TABLE public.admins
  DROP CONSTRAINT IF EXISTS admins_role_check;

-- Recreate the check constraint to include ALL valid administrative roles
ALTER TABLE public.admins
  ADD CONSTRAINT admins_role_check CHECK (role IN (
    'SuperAdmin', 'RegionalAdmin', 'FinanceOfficer',
    'ADMIN', 'SUPER_ADMIN', 'FINANCE_OFFICER', 'EXECUTIVE',
    'FOUNDER', 'ORGANIZER', 'REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD',
    'VERIFIER', 'CHIEF_EDITOR', 'SENIOR_EDITOR', 'EDITOR', 'JUNIOR_EDITOR',
    'REGIONAL_CORRESPONDENT', 'IT_MANAGER', 'CHAPTER_LEAD', 'CHAPTER_SECRETARY',
    'FIELD_AGENT', 'COMMUNICATIONS_OFFICER', 'INTELLIGENCE_ANALYST',
    'STORE_MANAGER', 'YOUTH_LEADER', 'MOVEMENT_LEADER'
  ));
