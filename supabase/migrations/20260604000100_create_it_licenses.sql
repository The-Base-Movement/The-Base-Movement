-- supabase/migrations/20260604000100_create_it_licenses.sql

CREATE TABLE IF NOT EXISTS public.it_licenses (
  id            UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  software_name TEXT           NOT NULL,
  vendor        TEXT           NOT NULL,
  category      TEXT           NOT NULL CHECK (category IN ('Domain','Hosting','SaaS','API')),
  cost          NUMERIC(10,2)  NOT NULL,
  billing_cycle TEXT           NOT NULL CHECK (billing_cycle IN ('Monthly','Yearly')),
  renewal_date  DATE           NOT NULL,
  auto_renew    BOOLEAN        NOT NULL DEFAULT false,
  status        TEXT           NOT NULL DEFAULT 'Active'
                               CHECK (status IN ('Active','Inactive','Cancelled')),
  url           TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ    DEFAULT now()
);

ALTER TABLE public.it_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "it_licenses_staff_all" ON public.it_licenses;
CREATE POLICY "it_licenses_staff_all"
  ON public.it_licenses FOR ALL TO authenticated
  USING      ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'))
  WITH CHECK ((SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SUPER_ADMIN','FOUNDER'));
