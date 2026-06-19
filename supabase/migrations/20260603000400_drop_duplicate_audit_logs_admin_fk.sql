-- Drop the duplicate FK on audit_logs.admin_id that lacked ON DELETE SET NULL.
-- fk_audit_logs_admin (ON DELETE SET NULL) already exists and handles this correctly.
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS fk_admin_id;
