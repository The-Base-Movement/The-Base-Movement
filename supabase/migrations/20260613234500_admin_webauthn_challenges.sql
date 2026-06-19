-- supabase/migrations/20260613234500_admin_webauthn_challenges.sql
--
-- Short-lived WebAuthn ceremony challenges. Written/read only by the webauthn
-- edge function (service role); no client access. One in-flight challenge per
-- admin per purpose (registration | authentication).

CREATE TABLE IF NOT EXISTS public.admin_webauthn_challenges (
  admin_id   UUID        NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  purpose    TEXT        NOT NULL CHECK (purpose IN ('registration','authentication')),
  challenge  TEXT        NOT NULL,
  device_id  UUID        REFERENCES public.admin_devices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_id, purpose)
);

ALTER TABLE public.admin_webauthn_challenges ENABLE ROW LEVEL SECURITY;
-- No policies: only the service-role edge function touches this table.
