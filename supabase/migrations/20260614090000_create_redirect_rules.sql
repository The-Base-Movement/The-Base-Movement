-- Dynamic public redirect rules managed from the admin command center.

CREATE TABLE IF NOT EXISTS public.redirect_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL,
  destination_path text NOT NULL,
  status_code integer NOT NULL DEFAULT 301,
  is_active boolean NOT NULL DEFAULT true,
  preserve_query boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT redirect_rules_source_path_format CHECK (
    source_path ~ '^/[A-Za-z0-9._~!$&''()*+,;=:@%/-]*$'
  ),
  CONSTRAINT redirect_rules_destination_path_format CHECK (
    destination_path ~ '^/[A-Za-z0-9._~!$&''()*+,;=:@%/?#-]*$'
    OR destination_path ~ '^https?://'
  ),
  CONSTRAINT redirect_rules_status_code_check CHECK (status_code IN (301, 302, 307, 308)),
  CONSTRAINT redirect_rules_no_self_redirect CHECK (source_path <> destination_path)
);

CREATE UNIQUE INDEX IF NOT EXISTS redirect_rules_source_path_key
  ON public.redirect_rules (lower(source_path));

CREATE INDEX IF NOT EXISTS redirect_rules_active_source_idx
  ON public.redirect_rules (source_path)
  WHERE is_active = true;

ALTER TABLE public.redirect_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active redirect rules" ON public.redirect_rules;
CREATE POLICY "Public can read active redirect rules"
  ON public.redirect_rules
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage redirect rules" ON public.redirect_rules;
CREATE POLICY "Admins can manage redirect rules"
  ON public.redirect_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE a.id = (SELECT auth.uid())
        AND a.role::text IN ('SUPER_ADMIN', 'FOUNDER', 'ADMIN', 'IT_MANAGER', 'SuperAdmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE a.id = (SELECT auth.uid())
        AND a.role::text IN ('SUPER_ADMIN', 'FOUNDER', 'ADMIN', 'IT_MANAGER', 'SuperAdmin')
    )
  );

REVOKE ALL ON public.redirect_rules FROM anon, authenticated;
GRANT SELECT ON public.redirect_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.redirect_rules TO authenticated;
