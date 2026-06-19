-- Performance: consolidate remaining multiple_permissive_policies overlaps.
-- Each affected table is normalized to one permissive policy per action, with
-- the original quals OR'd together (permissive policies are OR'd by
-- definition, so this is an identity transform). Policies that previously
-- applied only TO authenticated/anon are wrapped with
-- ((select auth.role()) = '<role>') to preserve their exact role scoping
-- inside a broader policy.
--
-- Generated from pg_policies and hand-reviewed. One generator fix applied:
-- store_orders_select / store_order_items_select must be TO public (they
-- carry an anon guest-checkout branch).
--
-- Batch 1 (hot tables + ALL-policy splits) was
-- 20260611000900_perf_consolidate_permissive_policies_batch1.

-- authors
DROP POLICY IF EXISTS "Admin full access" ON public.authors;
DROP POLICY IF EXISTS "Public read access" ON public.authors;
CREATE POLICY authors_delete ON public.authors FOR DELETE TO public USING ((is_admin()));
CREATE POLICY authors_insert ON public.authors FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY authors_select ON public.authors FOR SELECT TO public USING ((is_admin()) OR ((deleted_at IS NULL)));
CREATE POLICY authors_update ON public.authors FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- canvassing_campaigns
DROP POLICY IF EXISTS "Admin manage campaigns" ON public.canvassing_campaigns;
DROP POLICY IF EXISTS "Public view active campaigns" ON public.canvassing_campaigns;
CREATE POLICY canvassing_campaigns_delete ON public.canvassing_campaigns FOR DELETE TO public USING ((is_admin()));
CREATE POLICY canvassing_campaigns_insert ON public.canvassing_campaigns FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY canvassing_campaigns_select ON public.canvassing_campaigns FOR SELECT TO public USING ((is_admin()) OR (((status)::text = 'ACTIVE'::text)));
CREATE POLICY canvassing_campaigns_update ON public.canvassing_campaigns FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- chapters
DROP POLICY IF EXISTS "Admins can delete chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can insert chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Allow public read access to chapters" ON public.chapters;
DROP POLICY IF EXISTS "Chapter Leaders can update their own chapters" ON public.chapters;
CREATE POLICY chapters_delete ON public.chapters FOR DELETE TO public USING ((is_admin()));
CREATE POLICY chapters_insert ON public.chapters FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY chapters_select ON public.chapters FOR SELECT TO public USING ((true));
CREATE POLICY chapters_update ON public.chapters FOR UPDATE TO public USING ((is_admin()) OR (((select auth.role()) = 'authenticated') AND ((leader_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((is_admin()) OR (((select auth.role()) = 'authenticated') AND ((leader_id = ( SELECT auth.uid() AS uid)))));

-- comments
DROP POLICY IF EXISTS "Admins can manage comments (delete)" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage comments (insert)" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage comments (update)" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Everyone can view comments" ON public.comments;
CREATE POLICY comments_delete ON public.comments FOR DELETE TO public USING ((is_admin()));
CREATE POLICY comments_insert ON public.comments FOR INSERT TO public WITH CHECK ((is_admin()) OR ((( SELECT auth.role() AS role) = 'authenticated'::text)));
CREATE POLICY comments_select ON public.comments FOR SELECT TO public USING ((true));
CREATE POLICY comments_update ON public.comments FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- donation_campaigns
DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.donation_campaigns;
DROP POLICY IF EXISTS "Admins can insert campaigns" ON public.donation_campaigns;
DROP POLICY IF EXISTS "Admins can read all campaigns" ON public.donation_campaigns;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.donation_campaigns;
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON public.donation_campaigns;
CREATE POLICY donation_campaigns_delete ON public.donation_campaigns FOR DELETE TO authenticated USING ((((select auth.role()) = 'authenticated') AND (is_admin())));
CREATE POLICY donation_campaigns_insert ON public.donation_campaigns FOR INSERT TO authenticated WITH CHECK ((((select auth.role()) = 'authenticated') AND (is_admin())));
CREATE POLICY donation_campaigns_select ON public.donation_campaigns FOR SELECT TO public USING ((((select auth.role()) = 'authenticated') AND (is_admin())) OR (((status)::text = 'Active'::text)));
CREATE POLICY donation_campaigns_update ON public.donation_campaigns FOR UPDATE TO authenticated USING ((((select auth.role()) = 'authenticated') AND (is_admin()))) WITH CHECK ((((select auth.role()) = 'authenticated') AND (is_admin())));

-- donations
DROP POLICY IF EXISTS "Admins can manage donations" ON public.donations;
DROP POLICY IF EXISTS "Members can view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Public can submit donations" ON public.donations;
CREATE POLICY donations_delete ON public.donations FOR DELETE TO public USING ((is_admin()));
CREATE POLICY donations_insert ON public.donations FOR INSERT TO public WITH CHECK ((is_admin()) OR (((amount > (0)::numeric) AND (length(TRIM(BOTH FROM full_name)) > 0) AND (length(TRIM(BOTH FROM phone)) > 0))));
CREATE POLICY donations_select ON public.donations FOR SELECT TO public USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = member_id)));
CREATE POLICY donations_update ON public.donations FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- field_action_attendance
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.field_action_attendance;
DROP POLICY IF EXISTS "Users can check in" ON public.field_action_attendance;
DROP POLICY IF EXISTS "Users can see their own attendance" ON public.field_action_attendance;
CREATE POLICY field_action_attendance_insert ON public.field_action_attendance FOR INSERT TO authenticated WITH CHECK ((((select auth.role()) = 'authenticated') AND ((user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY field_action_attendance_select ON public.field_action_attendance FOR SELECT TO public USING ((is_admin()) OR (((select auth.role()) = 'authenticated') AND ((user_id = ( SELECT auth.uid() AS uid)))));

-- field_actions
DROP POLICY IF EXISTS "Admins can manage actions" ON public.field_actions;
DROP POLICY IF EXISTS "Anyone can view active actions" ON public.field_actions;
CREATE POLICY field_actions_delete ON public.field_actions FOR DELETE TO public USING ((is_admin()));
CREATE POLICY field_actions_insert ON public.field_actions FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY field_actions_select ON public.field_actions FOR SELECT TO public USING ((is_admin()) OR (((status)::text <> 'Cancelled'::text)));
CREATE POLICY field_actions_update ON public.field_actions FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- field_agent_assignments
DROP POLICY IF EXISTS "Admins can manage field agent assignments" ON public.field_agent_assignments;
DROP POLICY IF EXISTS "Members can read their own field agent assignment" ON public.field_agent_assignments;
CREATE POLICY field_agent_assignments_delete ON public.field_agent_assignments FOR DELETE TO public USING ((is_admin()));
CREATE POLICY field_agent_assignments_insert ON public.field_agent_assignments FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY field_agent_assignments_select ON public.field_agent_assignments FOR SELECT TO public USING ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY field_agent_assignments_update ON public.field_agent_assignments FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- field_directives
DROP POLICY IF EXISTS "Admins have global access to directives" ON public.field_directives;
DROP POLICY IF EXISTS "Users can view directives targeting them" ON public.field_directives;
CREATE POLICY field_directives_delete ON public.field_directives FOR DELETE TO public USING ((is_admin()));
CREATE POLICY field_directives_insert ON public.field_directives FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY field_directives_select ON public.field_directives FOR SELECT TO public USING ((is_admin()) OR (((target_type = 'Global'::text) OR ((target_type = 'Regional'::text) AND (target_id = (( SELECT users.region
   FROM users
  WHERE (users.id = ( SELECT auth.uid() AS uid))))::text)) OR ((target_type = 'Chapter'::text) AND (target_id = (( SELECT users.chapter
   FROM users
  WHERE (users.id = ( SELECT auth.uid() AS uid))))::text)) OR ((target_type = 'Individual'::text) AND (target_id = (( SELECT auth.uid() AS uid))::text)))));
CREATE POLICY field_directives_update ON public.field_directives FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- field_reports
DROP POLICY IF EXISTS "Admins have global access to reports" ON public.field_reports;
DROP POLICY IF EXISTS "Users can manage their own field reports" ON public.field_reports;
CREATE POLICY field_reports_delete ON public.field_reports FOR DELETE TO public USING ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY field_reports_insert ON public.field_reports FOR INSERT TO public WITH CHECK ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY field_reports_select ON public.field_reports FOR SELECT TO public USING ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY field_reports_update ON public.field_reports FOR UPDATE TO public USING ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid))));

-- finance_requests
DROP POLICY IF EXISTS "Finance staff can update requests" ON public.finance_requests;
DROP POLICY IF EXISTS "Finance staff can view all requests" ON public.finance_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.finance_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.finance_requests;
CREATE POLICY finance_requests_insert ON public.finance_requests FOR INSERT TO public WITH CHECK (((requester_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY finance_requests_select ON public.finance_requests FOR SELECT TO public USING ((((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SuperAdmin'::character varying)::text, ('FinanceOfficer'::character varying)::text, ('SUPER_ADMIN'::character varying)::text, ('FINANCE_OFFICER'::character varying)::text, ('EXECUTIVE'::character varying)::text, ('ORGANIZER'::character varying)::text, ('ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text]))) OR ((requester_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY finance_requests_update ON public.finance_requests FOR UPDATE TO public USING ((((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SuperAdmin'::character varying)::text, ('FinanceOfficer'::character varying)::text, ('SUPER_ADMIN'::character varying)::text, ('FINANCE_OFFICER'::character varying)::text, ('EXECUTIVE'::character varying)::text, ('ORGANIZER'::character varying)::text, ('ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))) WITH CHECK ((((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SuperAdmin'::character varying)::text, ('FinanceOfficer'::character varying)::text, ('SUPER_ADMIN'::character varying)::text, ('FINANCE_OFFICER'::character varying)::text, ('EXECUTIVE'::character varying)::text, ('ORGANIZER'::character varying)::text, ('ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text]))));

-- gotv_transport_requests
DROP POLICY IF EXISTS "Admins and Drivers can view transport requests" ON public.gotv_transport_requests;
DROP POLICY IF EXISTS "Users can manage their own transport requests" ON public.gotv_transport_requests;
CREATE POLICY gotv_transport_requests_delete ON public.gotv_transport_requests FOR DELETE TO authenticated USING ((((select auth.role()) = 'authenticated') AND ((( SELECT auth.uid() AS uid) = requester_id))));
CREATE POLICY gotv_transport_requests_insert ON public.gotv_transport_requests FOR INSERT TO authenticated WITH CHECK ((((select auth.role()) = 'authenticated') AND ((( SELECT auth.uid() AS uid) = requester_id))));
CREATE POLICY gotv_transport_requests_select ON public.gotv_transport_requests FOR SELECT TO public USING (((is_admin() OR (( SELECT auth.uid() AS uid) = assigned_driver_id))) OR (((select auth.role()) = 'authenticated') AND ((( SELECT auth.uid() AS uid) = requester_id))));
CREATE POLICY gotv_transport_requests_update ON public.gotv_transport_requests FOR UPDATE TO authenticated USING ((((select auth.role()) = 'authenticated') AND ((( SELECT auth.uid() AS uid) = requester_id)))) WITH CHECK ((((select auth.role()) = 'authenticated') AND ((( SELECT auth.uid() AS uid) = requester_id))));

-- it_ticket_comments
DROP POLICY IF EXISTS it_comments_staff_all ON public.it_ticket_comments;
DROP POLICY IF EXISTS it_comments_submitter_insert ON public.it_ticket_comments;
DROP POLICY IF EXISTS it_comments_submitter_select ON public.it_ticket_comments;
CREATE POLICY it_ticket_comments_delete ON public.it_ticket_comments FOR DELETE TO authenticated USING ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))));
CREATE POLICY it_ticket_comments_insert ON public.it_ticket_comments FOR INSERT TO authenticated WITH CHECK ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))) OR (((select auth.role()) = 'authenticated') AND (((author_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM it_tickets t
  WHERE ((t.id = it_ticket_comments.ticket_id) AND (t.submitted_by = ( SELECT auth.uid() AS uid)))))))));
CREATE POLICY it_ticket_comments_select ON public.it_ticket_comments FOR SELECT TO authenticated USING ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))) OR (((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM it_tickets t
  WHERE ((t.id = it_ticket_comments.ticket_id) AND (t.submitted_by = ( SELECT auth.uid() AS uid))))))));
CREATE POLICY it_ticket_comments_update ON public.it_ticket_comments FOR UPDATE TO authenticated USING ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text]))))) WITH CHECK ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))));

-- it_tickets
DROP POLICY IF EXISTS it_tickets_staff_all ON public.it_tickets;
DROP POLICY IF EXISTS it_tickets_submitter_insert ON public.it_tickets;
DROP POLICY IF EXISTS it_tickets_submitter_select ON public.it_tickets;
CREATE POLICY it_tickets_delete ON public.it_tickets FOR DELETE TO authenticated USING ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))));
CREATE POLICY it_tickets_insert ON public.it_tickets FOR INSERT TO authenticated WITH CHECK ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))) OR (((select auth.role()) = 'authenticated') AND ((submitted_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY it_tickets_select ON public.it_tickets FOR SELECT TO authenticated USING ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))) OR (((select auth.role()) = 'authenticated') AND ((submitted_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY it_tickets_update ON public.it_tickets FOR UPDATE TO authenticated USING ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text]))))) WITH CHECK ((((select auth.role()) = 'authenticated') AND (((( SELECT admins.role
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('FOUNDER'::character varying)::text])))));

-- job_applications
DROP POLICY IF EXISTS "Admins can manage all job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Members can apply" ON public.job_applications;
DROP POLICY IF EXISTS "Members read own applications" ON public.job_applications;
CREATE POLICY job_applications_delete ON public.job_applications FOR DELETE TO public USING ((is_admin()));
CREATE POLICY job_applications_insert ON public.job_applications FOR INSERT TO public WITH CHECK ((is_admin()) OR ((( SELECT auth.uid() AS uid) = member_id)));
CREATE POLICY job_applications_select ON public.job_applications FOR SELECT TO public USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = member_id)));
CREATE POLICY job_applications_update ON public.job_applications FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- jobs
DROP POLICY IF EXISTS "Authenticated users manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public read published jobs" ON public.jobs;
CREATE POLICY jobs_delete ON public.jobs FOR DELETE TO public USING (((( SELECT auth.uid() AS uid) IS NOT NULL)));
CREATE POLICY jobs_insert ON public.jobs FOR INSERT TO public WITH CHECK (((( SELECT auth.uid() AS uid) IS NOT NULL)));
CREATE POLICY jobs_select ON public.jobs FOR SELECT TO public USING (((( SELECT auth.uid() AS uid) IS NOT NULL)) OR ((status = 'published'::text)));
CREATE POLICY jobs_update ON public.jobs FOR UPDATE TO public USING (((( SELECT auth.uid() AS uid) IS NOT NULL))) WITH CHECK (((( SELECT auth.uid() AS uid) IS NOT NULL)));

-- media_kit
DROP POLICY IF EXISTS "Allow admins to manage media_kit" ON public.media_kit;
DROP POLICY IF EXISTS "Allow public read access to media_kit" ON public.media_kit;
CREATE POLICY media_kit_delete ON public.media_kit FOR DELETE TO public USING ((is_admin()));
CREATE POLICY media_kit_insert ON public.media_kit FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY media_kit_select ON public.media_kit FOR SELECT TO public USING ((is_admin()) OR ((is_active = true)));
CREATE POLICY media_kit_update ON public.media_kit FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- notifications
DROP POLICY IF EXISTS "Admins can insert notifications for any user" ON public.notifications;
DROP POLICY IF EXISTS "Members update read status" ON public.notifications;
DROP POLICY IF EXISTS "Members view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE TO public USING (((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO public WITH CHECK ((((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid)))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO public USING (((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO public USING (((user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid))));

-- poll_votes
DROP POLICY IF EXISTS "Admins can view all poll votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON public.poll_votes;
CREATE POLICY poll_votes_insert ON public.poll_votes FOR INSERT TO public WITH CHECK (((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY poll_votes_select ON public.poll_votes FOR SELECT TO public USING ((is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));

-- polling_station_agents
DROP POLICY IF EXISTS "Admins can manage polling station agents" ON public.polling_station_agents;
DROP POLICY IF EXISTS "Members can read their own polling station agent assignment" ON public.polling_station_agents;
CREATE POLICY polling_station_agents_delete ON public.polling_station_agents FOR DELETE TO public USING ((is_admin()));
CREATE POLICY polling_station_agents_insert ON public.polling_station_agents FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY polling_station_agents_select ON public.polling_station_agents FOR SELECT TO public USING ((is_admin()) OR ((member_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY polling_station_agents_update ON public.polling_station_agents FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- press_releases
DROP POLICY IF EXISTS "Allow admins to manage press_releases" ON public.press_releases;
DROP POLICY IF EXISTS "Allow public read access to press_releases" ON public.press_releases;
CREATE POLICY press_releases_delete ON public.press_releases FOR DELETE TO public USING ((is_admin()));
CREATE POLICY press_releases_insert ON public.press_releases FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY press_releases_select ON public.press_releases FOR SELECT TO public USING ((is_admin()) OR ((deleted_at IS NULL)));
CREATE POLICY press_releases_update ON public.press_releases FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- rapid_response_directives
DROP POLICY IF EXISTS "Admins manage rapid response" ON public.rapid_response_directives;
DROP POLICY IF EXISTS "Public can view active rapid response directives" ON public.rapid_response_directives;
CREATE POLICY rapid_response_directives_delete ON public.rapid_response_directives FOR DELETE TO public USING ((is_admin()));
CREATE POLICY rapid_response_directives_insert ON public.rapid_response_directives FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY rapid_response_directives_select ON public.rapid_response_directives FOR SELECT TO public USING ((is_admin()) OR (((status)::text = 'ACTIVE'::text)));
CREATE POLICY rapid_response_directives_update ON public.rapid_response_directives FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- resource_request_items
DROP POLICY IF EXISTS "Admins have full access to resource_request_items" ON public.resource_request_items;
DROP POLICY IF EXISTS "Regional Leaders can view their own request items" ON public.resource_request_items;
CREATE POLICY resource_request_items_delete ON public.resource_request_items FOR DELETE TO public USING ((is_admin()));
CREATE POLICY resource_request_items_insert ON public.resource_request_items FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY resource_request_items_select ON public.resource_request_items FOR SELECT TO public USING ((is_admin()) OR ((EXISTS ( SELECT 1
   FROM resource_requests
  WHERE ((resource_requests.id = resource_request_items.request_id) AND (resource_requests.requester_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY resource_request_items_update ON public.resource_request_items FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- resource_requests
DROP POLICY IF EXISTS "Admins have full access to resource_requests" ON public.resource_requests;
DROP POLICY IF EXISTS "Regional Leaders can insert resource_requests" ON public.resource_requests;
DROP POLICY IF EXISTS "Regional Leaders can view their own resource_requests" ON public.resource_requests;
CREATE POLICY resource_requests_delete ON public.resource_requests FOR DELETE TO public USING ((is_admin()));
CREATE POLICY resource_requests_insert ON public.resource_requests FOR INSERT TO public WITH CHECK ((is_admin()) OR ((requester_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY resource_requests_select ON public.resource_requests FOR SELECT TO public USING ((is_admin()) OR ((requester_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY resource_requests_update ON public.resource_requests FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- reviews
DROP POLICY IF EXISTS "Admins can manage reviews (delete)" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews (insert)" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews (update)" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Everyone can view reviews" ON public.reviews;
CREATE POLICY reviews_delete ON public.reviews FOR DELETE TO public USING ((is_admin()));
CREATE POLICY reviews_insert ON public.reviews FOR INSERT TO public WITH CHECK ((is_admin()) OR ((( SELECT auth.role() AS role) = 'authenticated'::text)));
CREATE POLICY reviews_select ON public.reviews FOR SELECT TO public USING ((true));
CREATE POLICY reviews_update ON public.reviews FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- store_order_items (SELECT must be TO public: carries an anon guest branch)
DROP POLICY IF EXISTS "Admins can view all order items" ON public.store_order_items;
DROP POLICY IF EXISTS "Allow public insert to store_order_items" ON public.store_order_items;
DROP POLICY IF EXISTS "Guests can view guest checkout order items" ON public.store_order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.store_order_items;
CREATE POLICY store_order_items_insert ON public.store_order_items FOR INSERT TO public WITH CHECK (((EXISTS ( SELECT 1
   FROM store_orders
  WHERE ((store_orders.id = store_order_items.order_id) AND ((store_orders.customer_id IS NULL) OR (store_orders.customer_id = ( SELECT auth.uid() AS uid))))))));
CREATE POLICY store_order_items_select ON public.store_order_items FOR SELECT TO public USING ((((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid)))))) OR (((select auth.role()) = 'anon') AND ((EXISTS ( SELECT 1
   FROM store_orders
  WHERE ((store_orders.id = store_order_items.order_id) AND (store_orders.customer_id IS NULL)))))) OR (((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM store_orders
  WHERE ((store_orders.id = store_order_items.order_id) AND (store_orders.customer_id = ( SELECT auth.uid() AS uid))))))));

-- store_orders (SELECT must be TO public: carries an anon guest branch)
DROP POLICY IF EXISTS "Admins can update order status" ON public.store_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.store_orders;
DROP POLICY IF EXISTS "Allow public insert to store_orders" ON public.store_orders;
DROP POLICY IF EXISTS "Guests can view guest checkout orders" ON public.store_orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.store_orders;
CREATE POLICY store_orders_insert ON public.store_orders FOR INSERT TO public WITH CHECK ((((customer_id IS NULL) OR (customer_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY store_orders_select ON public.store_orders FOR SELECT TO public USING ((((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid)))))) OR (((select auth.role()) = 'anon') AND ((customer_id IS NULL))) OR (((select auth.role()) = 'authenticated') AND ((customer_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY store_orders_update ON public.store_orders FOR UPDATE TO authenticated USING ((((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid)))))));

-- user_activity_logs
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS members_insert_own_activity ON public.user_activity_logs;
DROP POLICY IF EXISTS members_read_own_activity ON public.user_activity_logs;
CREATE POLICY user_activity_logs_insert ON public.user_activity_logs FOR INSERT TO public WITH CHECK ((((select auth.role()) = 'authenticated') AND ((EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.id = ( SELECT auth.uid() AS uid)))))) OR ((( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY user_activity_logs_select ON public.user_activity_logs FOR SELECT TO public USING (((( SELECT auth.uid() AS uid) = user_id)));

-- user_badges
DROP POLICY IF EXISTS "Admins can manage user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY user_badges_delete ON public.user_badges FOR DELETE TO public USING ((is_admin()));
CREATE POLICY user_badges_insert ON public.user_badges FOR INSERT TO public WITH CHECK ((is_admin()));
CREATE POLICY user_badges_select ON public.user_badges FOR SELECT TO public USING ((is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY user_badges_update ON public.user_badges FOR UPDATE TO public USING ((is_admin())) WITH CHECK ((is_admin()));

-- voter_registrations
DROP POLICY IF EXISTS "Admins can manage all voter registrations" ON public.voter_registrations;
DROP POLICY IF EXISTS "Users can insert their own voter registration" ON public.voter_registrations;
DROP POLICY IF EXISTS "Users can update their own voter registration" ON public.voter_registrations;
DROP POLICY IF EXISTS "Users can view their own voter registration" ON public.voter_registrations;
CREATE POLICY voter_registrations_delete ON public.voter_registrations FOR DELETE TO public USING ((is_admin()));
CREATE POLICY voter_registrations_insert ON public.voter_registrations FOR INSERT TO public WITH CHECK ((is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY voter_registrations_select ON public.voter_registrations FOR SELECT TO public USING ((is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY voter_registrations_update ON public.voter_registrations FOR UPDATE TO public USING ((is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));
