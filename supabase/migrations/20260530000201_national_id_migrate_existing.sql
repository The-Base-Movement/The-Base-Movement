-- supabase/migrations/20260530000201_national_id_migrate_existing.sql
-- One-time encryption of all existing plaintext national_id values.
-- Rows where national_id is NULL, empty, or already prefixed with ENC: are skipped.

UPDATE public.users
SET national_id = public.encrypt_national_id(national_id)
WHERE national_id IS NOT NULL
  AND national_id <> ''
  AND NOT starts_with(national_id, 'ENC:');
