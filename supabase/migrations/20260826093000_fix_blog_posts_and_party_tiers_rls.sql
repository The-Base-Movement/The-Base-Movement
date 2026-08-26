-- Fix broken access control found via direct REST API testing (Burp Suite):
-- 1. blog_posts SELECT policy allowed ANY row to be read by anon/public,
--    relying only on client-side query filters (status=eq.Published&deleted_at=is.null)
--    that a direct API call can simply omit. 20 of 21 posts are currently Draft
--    and were fully readable without authentication.
-- 2. party_tiers UPDATE/DELETE policies checked auth.role() = 'authenticated'
--    instead of is_admin(), letting any logged-in member modify/delete tiers.

DROP POLICY IF EXISTS "Allow public read access to blog_posts" ON public.blog_posts;

CREATE POLICY "Public can read published blog_posts, admins read all"
ON public.blog_posts
FOR SELECT
TO public
USING (
  (status = 'Published' AND deleted_at IS NULL)
  OR is_admin()
);

DROP POLICY IF EXISTS "Enable update for authenticated admins" ON public.party_tiers;
DROP POLICY IF EXISTS "Enable delete for authenticated admins" ON public.party_tiers;

CREATE POLICY "Enable update for authenticated admins"
ON public.party_tiers
FOR UPDATE
TO public
USING (is_admin());

CREATE POLICY "Enable delete for authenticated admins"
ON public.party_tiers
FOR DELETE
TO public
USING (is_admin());
