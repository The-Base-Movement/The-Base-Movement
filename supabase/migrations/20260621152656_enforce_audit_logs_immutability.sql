-- Create trigger function to block UPDATE and DELETE operations
CREATE OR REPLACE FUNCTION public.block_update_delete_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.';
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS block_audit_logs_mutations ON public.system_audit_logs;

-- Bind trigger to system_audit_logs table
CREATE TRIGGER block_audit_logs_mutations
BEFORE UPDATE OR DELETE ON public.system_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.block_update_delete_audit_logs();
