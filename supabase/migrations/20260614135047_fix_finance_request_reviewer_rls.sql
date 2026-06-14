CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.is_finance_request_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE admins.id = auth.uid()
      AND admins.role::text IN (
        'SuperAdmin',
        'FinanceOfficer',
        'SUPER_ADMIN',
        'FINANCE_OFFICER',
        'EXECUTIVE',
        'ORGANIZER',
        'ADMIN',
        'FOUNDER'
      )
  );
$$;

REVOKE ALL ON FUNCTION app_private.is_finance_request_reviewer() FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_finance_request_reviewer() TO anon, authenticated;

DROP POLICY IF EXISTS finance_requests_select ON public.finance_requests;
DROP POLICY IF EXISTS finance_requests_update ON public.finance_requests;

CREATE POLICY finance_requests_select
  ON public.finance_requests
  FOR SELECT
  TO public
  USING (
    app_private.is_finance_request_reviewer()
    OR requester_id = (SELECT auth.uid())
  );

CREATE POLICY finance_requests_update
  ON public.finance_requests
  FOR UPDATE
  TO authenticated
  USING (app_private.is_finance_request_reviewer())
  WITH CHECK (app_private.is_finance_request_reviewer());
