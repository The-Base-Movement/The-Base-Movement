-- Final state of the Cron Monitor RPCs (supersedes the 1003/1004 iterations).
--
-- pg_cron's job_run_details.status reports only that the command was dispatched,
-- not what the edge function returned. Two jobs sat at 'succeeded' while
-- returning 401 on every run, so the field is named dispatch_status and the
-- misconfiguration that caused both failures — an http_post with no
-- Authorization header — is surfaced as its own column.
DROP FUNCTION IF EXISTS public.get_cron_job_status();

CREATE FUNCTION public.get_cron_job_status()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  target_fn text,
  -- NULL for jobs that call SQL directly rather than an edge function.
  sends_auth boolean,
  last_run_start timestamptz,
  last_run_end timestamptz,
  dispatch_status text,
  last_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    substring(j.command from 'functions/v1/([a-z0-9-]+)') AS target_fn,
    CASE
      WHEN j.command NOT ILIKE '%functions/v1/%' THEN NULL
      ELSE (j.command ILIKE '%authorization%')
    END AS sends_auth,
    r.start_time,
    r.end_time,
    r.status::text,
    r.return_message::text
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT d.start_time, d.end_time, d.status, d.return_message
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC
    LIMIT 1
  ) r ON true
  WHERE j.jobname IS NOT NULL
  ORDER BY j.jobname;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cron_job_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_job_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_job_status() TO service_role;

-- Real HTTP outcomes. pg_net keeps only a short retention window and does not
-- retain the URL once a request leaves the queue, so these cannot be attributed
-- to a specific job — they are shown as a fleet-wide failure signal.
CREATE OR REPLACE FUNCTION public.get_cron_http_failures()
RETURNS TABLE (
  status_code integer,
  timed_out boolean,
  detail text,
  occurrences bigint,
  most_recent timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.status_code,
    coalesce(r.timed_out, false),
    left(coalesce(r.error_msg, r.content, ''), 200),
    count(*),
    max(r.created)
  FROM net._http_response r
  WHERE r.created > now() - interval '24 hours'
    AND (r.status_code IS NULL OR r.status_code >= 300)
  GROUP BY r.status_code, coalesce(r.timed_out, false), left(coalesce(r.error_msg, r.content, ''), 200)
  ORDER BY max(r.created) DESC
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cron_http_failures() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_http_failures() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_http_failures() TO service_role;
