-- Migration: national_id encryption setup
-- Vault key, encrypt/decrypt helpers, and BEFORE INSERT/UPDATE trigger

-- 1. Create encryption key in Vault (generated at runtime, never hardcoded)
SELECT vault.create_secret(
  encode(gen_random_bytes(32), 'base64'),
  'national_id_enc_key',
  'AES passphrase for users.national_id column encryption'
);

-- 2. encrypt_national_id helper
CREATE OR REPLACE FUNCTION public.encrypt_national_id(p_plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_key text;
BEGIN
  IF p_plaintext IS NULL OR p_plaintext = '' THEN
    RETURN p_plaintext;
  END IF;

  SELECT decrypted_secret
    INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'national_id_enc_key'
   LIMIT 1;

  RETURN 'ENC:' || encode(pgp_sym_encrypt(p_plaintext, v_key), 'base64');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.encrypt_national_id(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_national_id(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_national_id(text) FROM authenticated;

-- 3. decrypt_national_id helper
CREATE OR REPLACE FUNCTION public.decrypt_national_id(p_ciphertext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_key text;
BEGIN
  IF p_ciphertext IS NULL OR p_ciphertext = '' THEN
    RETURN p_ciphertext;
  END IF;

  -- Legacy plaintext: return as-is
  IF NOT starts_with(p_ciphertext, 'ENC:') THEN
    RETURN p_ciphertext;
  END IF;

  SELECT decrypted_secret
    INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'national_id_enc_key'
   LIMIT 1;

  RETURN pgp_sym_decrypt(
    decode(substring(p_ciphertext FROM 5), 'base64'),
    v_key
  )::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrypt_national_id(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_national_id(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_national_id(text) FROM authenticated;

-- 4. Trigger function
CREATE OR REPLACE FUNCTION public.trigger_encrypt_national_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
BEGIN
  -- Skip if NULL or empty
  IF NEW.national_id IS NULL OR NEW.national_id = '' THEN
    RETURN NEW;
  END IF;

  -- Skip if already encrypted (idempotent)
  IF starts_with(NEW.national_id, 'ENC:') THEN
    RETURN NEW;
  END IF;

  NEW.national_id := public.encrypt_national_id(NEW.national_id);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_encrypt_national_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_encrypt_national_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_encrypt_national_id() FROM authenticated;

-- 5. Attach trigger to public.users
DROP TRIGGER IF EXISTS trg_encrypt_national_id ON public.users;

CREATE TRIGGER trg_encrypt_national_id
  BEFORE INSERT OR UPDATE OF national_id
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_encrypt_national_id();
