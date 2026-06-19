-- The "Global deployment feed" / dashboard activity feed read donations
-- directly, but donations RLS is admin-or-own-rows, so regular members only
-- ever saw their own contributions. Serve the public feed through a
-- SECURITY DEFINER RPC that masks names server-side ("Kwame M.") instead of
-- shipping full names to the browser, and hides avatar/name entirely for
-- donors who opted out of the public ledger (show_on_dashboard = false).
CREATE OR REPLACE FUNCTION public.get_public_donation_feed(p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  display_name text,
  amount numeric,
  campaign_title text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    d.id,
    CASE
      WHEN d.show_on_dashboard
        OR EXISTS (SELECT 1 FROM admins a WHERE a.id = d.member_id)
      THEN CASE
        WHEN array_length(n.parts, 1) >= 2
          THEN n.parts[1] || ' ' || left(n.parts[array_length(n.parts, 1)], 1) || '.'
        ELSE coalesce(n.parts[1], 'Anonymous Patriot')
      END
      ELSE 'Anonymous Patriot'
    END AS display_name,
    d.amount,
    c.title AS campaign_title,
    CASE
      WHEN d.show_on_dashboard
        OR EXISTS (SELECT 1 FROM admins a WHERE a.id = d.member_id)
      THEN u.avatar_url
      ELSE NULL
    END AS avatar_url,
    d.created_at
  FROM donations d
  LEFT JOIN donation_campaigns c ON c.id = d.campaign_id
  LEFT JOIN users u ON u.id = d.member_id
  CROSS JOIN LATERAL (
    SELECT regexp_split_to_array(trim(coalesce(d.full_name, '')), '\s+') AS parts
  ) n
  WHERE d.status = 'Verified'
  ORDER BY d.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 10), 100));
$$;

REVOKE ALL ON FUNCTION public.get_public_donation_feed(int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_donation_feed(int) TO anon, authenticated;
