-- New and updated member profiles must use a normalized, syntactically valid
-- email address when an email is provided. Phone-only membership remains valid.
-- NOT VALID preserves historical imports until they can be reviewed separately.
ALTER TABLE public.users
  ADD CONSTRAINT users_email_syntax_check
  CHECK (
    email IS NULL
    OR (
      email = btrim(email)
      AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
    )
  ) NOT VALID;
