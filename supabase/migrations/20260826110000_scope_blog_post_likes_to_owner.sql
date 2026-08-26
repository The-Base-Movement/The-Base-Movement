-- blog_post_likes INSERT/DELETE were open to `public` (unauthenticated)
-- with no ownership check at all: qual/with_check = true. The app itself
-- only ever inserts/deletes with user_id = the current authenticated
-- user's own id (contentService.likePost/unlikePost), so anyone could
-- forge likes attributed to arbitrary user_ids or delete other members'
-- likes via a direct REST call. Found during a manual RLS audit.

DROP POLICY IF EXISTS "Allow public insert access to blog_post_likes" ON public.blog_post_likes;
DROP POLICY IF EXISTS "Allow public delete access to blog_post_likes" ON public.blog_post_likes;

CREATE POLICY "Members can like posts as themselves"
ON public.blog_post_likes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can remove their own like, admins any"
ON public.blog_post_likes
FOR DELETE
TO public
USING (user_id = auth.uid() OR is_admin());
