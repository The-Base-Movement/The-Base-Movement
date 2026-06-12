-- Designated lead per helpdesk department (appointed by SUPER_ADMIN/FOUNDER via existing write policy)
ALTER TABLE public.helpdesk_departments
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
