-- Performance: auth_rls_initplan remediation (Supabase database linter).
--
-- RLS policies that call auth.uid()/auth.role()/auth.jwt() directly have the
-- function re-evaluated once PER ROW. Wrapping the call in a scalar subselect
-- — (select auth.uid()) — lets Postgres evaluate it once per query as an
-- initPlan. Semantics are identical; only the query plan changes.
--
-- Scope: the highest-traffic tables (messages, users, store_orders,
-- store_order_items, admins, chapter_requests, newsletters, finance_requests).
-- The long tail of lower-traffic tables (~80 remaining policies) is a
-- follow-up pass. Verified: no policies dropped, 0 unwrapped auth calls remain
-- on these tables, advisor auth_rls_initplan count 113 -> 80.

-- ── admins ──
DROP POLICY "Allow admins to update their own record" ON public.admins;
CREATE POLICY "Allow admins to update their own record" ON public.admins AS PERMISSIVE FOR UPDATE TO public
  USING ((id = (select auth.uid())))
  WITH CHECK ((id = (select auth.uid())));

DROP POLICY "Super admins can delete admins" ON public.admins;
CREATE POLICY "Super admins can delete admins" ON public.admins AS PERMISSIVE FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins admins_1
   WHERE ((admins_1.id = (select auth.uid())) AND ((admins_1.role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'FOUNDER'::character varying])::text[]))))));

DROP POLICY "Super admins can insert admins" ON public.admins;
CREATE POLICY "Super admins can insert admins" ON public.admins AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1 FROM admins admins_1
   WHERE ((admins_1.id = (select auth.uid())) AND ((admins_1.role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'FOUNDER'::character varying])::text[]))))));

DROP POLICY "Super admins can update any admin" ON public.admins;
CREATE POLICY "Super admins can update any admin" ON public.admins AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1 FROM admins a
   WHERE ((a.id = (select auth.uid())) AND ((a.role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'FOUNDER'::character varying])::text[]))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM admins a
   WHERE ((a.id = (select auth.uid())) AND ((a.role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'FOUNDER'::character varying])::text[]))))));

-- ── chapter_requests ──
DROP POLICY leaders_update_chapter_requests ON public.chapter_requests;
CREATE POLICY leaders_update_chapter_requests ON public.chapter_requests AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1 FROM chapters
   WHERE ((chapters.id = chapter_requests.chapter_id) AND (chapters.leader_id = (select auth.uid()))))));

DROP POLICY leaders_view_chapter_requests ON public.chapter_requests;
CREATE POLICY leaders_view_chapter_requests ON public.chapter_requests AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1 FROM chapters
   WHERE ((chapters.id = chapter_requests.chapter_id) AND (chapters.leader_id = (select auth.uid()))))));

DROP POLICY members_insert_own_requests ON public.chapter_requests;
CREATE POLICY members_insert_own_requests ON public.chapter_requests AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((select auth.uid()) = member_id));

DROP POLICY members_view_own_requests ON public.chapter_requests;
CREATE POLICY members_view_own_requests ON public.chapter_requests AS PERMISSIVE FOR SELECT TO public
  USING (((select auth.uid()) = member_id));

-- ── finance_requests ──
DROP POLICY "Finance staff can update requests" ON public.finance_requests;
CREATE POLICY "Finance staff can update requests" ON public.finance_requests AS PERMISSIVE FOR UPDATE TO public
  USING (((( SELECT admins.role FROM admins WHERE (admins.id = (select auth.uid()))))::text = ANY ((ARRAY['SuperAdmin'::character varying, 'FinanceOfficer'::character varying, 'SUPER_ADMIN'::character varying, 'FINANCE_OFFICER'::character varying, 'EXECUTIVE'::character varying, 'ORGANIZER'::character varying, 'ADMIN'::character varying, 'FOUNDER'::character varying])::text[])))
  WITH CHECK (((( SELECT admins.role FROM admins WHERE (admins.id = (select auth.uid()))))::text = ANY ((ARRAY['SuperAdmin'::character varying, 'FinanceOfficer'::character varying, 'SUPER_ADMIN'::character varying, 'FINANCE_OFFICER'::character varying, 'EXECUTIVE'::character varying, 'ORGANIZER'::character varying, 'ADMIN'::character varying, 'FOUNDER'::character varying])::text[])));

DROP POLICY "Finance staff can view all requests" ON public.finance_requests;
CREATE POLICY "Finance staff can view all requests" ON public.finance_requests AS PERMISSIVE FOR SELECT TO public
  USING (((( SELECT admins.role FROM admins WHERE (admins.id = (select auth.uid()))))::text = ANY ((ARRAY['SuperAdmin'::character varying, 'FinanceOfficer'::character varying, 'SUPER_ADMIN'::character varying, 'FINANCE_OFFICER'::character varying, 'EXECUTIVE'::character varying, 'ORGANIZER'::character varying, 'ADMIN'::character varying, 'FOUNDER'::character varying])::text[])));

DROP POLICY "Users can create requests" ON public.finance_requests;
CREATE POLICY "Users can create requests" ON public.finance_requests AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((requester_id = (select auth.uid())));

DROP POLICY "Users can view own requests" ON public.finance_requests;
CREATE POLICY "Users can view own requests" ON public.finance_requests AS PERMISSIVE FOR SELECT TO public
  USING ((requester_id = (select auth.uid())));

-- ── messages ──
DROP POLICY group_messages_delete ON public.messages;
CREATE POLICY group_messages_delete ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((sender_id = (select auth.uid())) OR (EXISTS ( SELECT 1 FROM group_conversation_members gcm
   WHERE ((gcm.conversation_id = gcm.conversation_id) AND (gcm.user_id = (select auth.uid())) AND (gcm.role = 'moderator'::text))))));

DROP POLICY group_messages_insert ON public.messages;
CREATE POLICY group_messages_insert ON public.messages AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((sender_id = (select auth.uid())) AND (EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND (c.status = 'open'::text)))) AND ((EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid())))))) OR (EXISTS ( SELECT 1 FROM group_conversation_members gcm
   WHERE ((gcm.conversation_id = gcm.conversation_id) AND (gcm.user_id = (select auth.uid()))))))));

DROP POLICY group_messages_select ON public.messages;
CREATE POLICY group_messages_select ON public.messages AS PERMISSIVE FOR SELECT TO authenticated
  USING (((EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid())))))) OR (EXISTS ( SELECT 1 FROM group_conversation_members gcm
   WHERE ((gcm.conversation_id = gcm.conversation_id) AND (gcm.user_id = (select auth.uid())))))));

DROP POLICY group_messages_update_read ON public.messages;
CREATE POLICY group_messages_update_read ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid())) OR (EXISTS ( SELECT 1 FROM group_conversation_members gcm
          WHERE ((gcm.conversation_id = gcm.conversation_id) AND (gcm.user_id = (select auth.uid()))))))))));

DROP POLICY messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((sender_id = (select auth.uid())) AND (EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid()))) AND (c.status = 'open'::text) AND (((c.member_id = (select auth.uid())) AND (messages.sender_type = 'member'::text)) OR ((c.leader_id = (select auth.uid())) AND (messages.sender_type = 'leader'::text))))))));

DROP POLICY messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid())))))));

DROP POLICY messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid())))))))
  WITH CHECK (((read_at IS NOT NULL) AND (EXISTS ( SELECT 1 FROM conversations c
   WHERE ((c.id = messages.conversation_id) AND ((c.member_id = (select auth.uid())) OR (c.leader_id = (select auth.uid()))))))));

-- ── newsletters ──
DROP POLICY "Admins can delete newsletters" ON public.newsletters;
CREATE POLICY "Admins can delete newsletters" ON public.newsletters AS PERMISSIVE FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

DROP POLICY "admins can insert newsletters" ON public.newsletters;
CREATE POLICY "admins can insert newsletters" ON public.newsletters AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

DROP POLICY "admins can select newsletters" ON public.newsletters;
CREATE POLICY "admins can select newsletters" ON public.newsletters AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

DROP POLICY "admins can update newsletters" ON public.newsletters;
CREATE POLICY "admins can update newsletters" ON public.newsletters AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

-- ── store_order_items ──
DROP POLICY "Admins can view all order items" ON public.store_order_items;
CREATE POLICY "Admins can view all order items" ON public.store_order_items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

DROP POLICY "Allow public insert to store_order_items" ON public.store_order_items;
CREATE POLICY "Allow public insert to store_order_items" ON public.store_order_items AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK ((EXISTS ( SELECT 1 FROM store_orders
   WHERE ((store_orders.id = store_order_items.order_id) AND ((store_orders.customer_id IS NULL) OR (store_orders.customer_id = (select auth.uid())))))));

DROP POLICY "Users can view their own order items" ON public.store_order_items;
CREATE POLICY "Users can view their own order items" ON public.store_order_items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM store_orders
   WHERE ((store_orders.id = store_order_items.order_id) AND (store_orders.customer_id = (select auth.uid()))))));

-- ── store_orders ──
DROP POLICY "Admins can update order status" ON public.store_orders;
CREATE POLICY "Admins can update order status" ON public.store_orders AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

DROP POLICY "Admins can view all orders" ON public.store_orders;
CREATE POLICY "Admins can view all orders" ON public.store_orders AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM admins WHERE (admins.id = (select auth.uid())))));

DROP POLICY "Allow public insert to store_orders" ON public.store_orders;
CREATE POLICY "Allow public insert to store_orders" ON public.store_orders AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (((customer_id IS NULL) OR (customer_id = (select auth.uid()))));

DROP POLICY "Users can view their own orders" ON public.store_orders;
CREATE POLICY "Users can view their own orders" ON public.store_orders AS PERMISSIVE FOR SELECT TO authenticated
  USING ((customer_id = (select auth.uid())));

-- ── users ──
DROP POLICY "Allow public registration to users" ON public.users;
CREATE POLICY "Allow public registration to users" ON public.users AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((select auth.uid()) = id));

DROP POLICY "Chapter Leaders can view their chapter members" ON public.users;
CREATE POLICY "Chapter Leaders can view their chapter members" ON public.users AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1 FROM chapters
   WHERE ((chapters.leader_id = (select auth.uid())) AND ((chapters.name)::text = (users.chapter)::text)))));

DROP POLICY "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((id = (select auth.uid())))
  WITH CHECK ((id = (select auth.uid())));

DROP POLICY "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users AS PERMISSIVE FOR SELECT TO public
  USING ((id = (select auth.uid())));
