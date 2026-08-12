-- Outbound nudge ledger.
--
-- scripts/nudge-unlogged-members.mjs sent SMS via mNotify and email via the
-- edge function and recorded nothing anywhere, so there is no way to answer
-- "who did we already contact?" from the database -- sms_delivery_logs is
-- empty and mNotify's API exposes no sent-history endpoint. Re-running the
-- script therefore re-texts everyone, at real cost to real people.
--
-- One row per (member, channel, campaign), enforced by a unique index: a
-- member cannot be nudged twice for the same campaign on the same channel,
-- even if the script is run again or two runs overlap.
CREATE TABLE IF NOT EXISTS public.member_nudges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel           text NOT NULL CHECK (channel IN ('sms', 'email')),
  campaign          text NOT NULL,
  recipient         text,
  status            text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'suppressed')),
  provider_response text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- The guard against double-sending. 'suppressed' rows count too, which is how
-- a prior send exported from the mNotify dashboard is back-filled to exclude
-- someone who was already contacted before this ledger existed.
CREATE UNIQUE INDEX IF NOT EXISTS member_nudges_once
  ON public.member_nudges (user_id, channel, campaign);

CREATE INDEX IF NOT EXISTS member_nudges_campaign_idx
  ON public.member_nudges (campaign, created_at DESC);

-- No policies: service_role bypasses RLS, everyone else is denied. This table
-- is written by the dispatch script only.
ALTER TABLE public.member_nudges ENABLE ROW LEVEL SECURITY;

-- Who still needs contacting on a given campaign/channel.
--
-- "Never logged in" is auth.users.last_sign_in_at IS NULL -- the members the
-- nudge is for. Currently 68 of 12,901 accounts have ever signed in.
CREATE OR REPLACE FUNCTION public.get_nudge_audience(p_campaign text, p_channel text)
 RETURNS TABLE (
   user_id             uuid,
   full_name           text,
   registration_number text,
   phone_number        text,
   email               text,
   chapter             text,
   platform            text
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.id, u.full_name, u.registration_number, u.phone_number, u.email, u.chapter, u.platform
  FROM public.users u
  JOIN auth.users a ON a.id = u.id
  WHERE u.deleted_at IS NULL
    AND a.last_sign_in_at IS NULL
    AND (
      (p_channel = 'sms'   AND coalesce(TRIM(u.phone_number), '') <> '')
      OR
      (p_channel = 'email' AND coalesce(TRIM(u.email), '') <> '')
    )
    -- Opt-outs are matched on the last 9 digits so 0244..., 233244... and
    -- +233 244 ... all resolve to the same subscriber.
    AND NOT EXISTS (
      SELECT 1 FROM public.sms_opt_outs o
      WHERE p_channel = 'sms'
        AND right(regexp_replace(o.phone, '\D', '', 'g'), 9)
          = right(regexp_replace(u.phone_number, '\D', '', 'g'), 9)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.member_nudges n
      WHERE n.user_id = u.id
        AND n.campaign = p_campaign
        AND n.channel = p_channel
    )
  ORDER BY u.joined_at;
$function$;

-- Dispatch-only: the script runs as service_role. Members and the anon key
-- have no business enumerating who has never logged in.
REVOKE ALL ON FUNCTION public.get_nudge_audience(text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_nudge_audience(text, text) TO service_role;
