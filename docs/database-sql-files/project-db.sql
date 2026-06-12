-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  icon character varying NOT NULL,
  description text NOT NULL,
  points_awarded integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  category text CHECK (category = ANY (ARRAY['Mobilization'::text, 'Recruitment'::text, 'Consistency'::text, 'Events'::text, 'Leadership'::text])),
  points_required integer DEFAULT 0,
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admins (
  id uuid NOT NULL,
  role character varying DEFAULT 'Editor'::character varying,
  permissions jsonb DEFAULT '{}'::jsonb,
  assigned_region character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  action character varying NOT NULL,
  resource character varying NOT NULL,
  status character varying NOT NULL,
  admin_id uuid,
  metadata jsonb,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_admin_id FOREIGN KEY (admin_id) REFERENCES public.admins(id),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);
CREATE TABLE public.authors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  role text,
  bio text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT authors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  icon character varying NOT NULL,
  description text NOT NULL,
  points_required integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  excerpt text,
  content text,
  author_id uuid,
  category character varying,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tags ARRAY,
  is_featured boolean DEFAULT false,
  read_time character varying,
  seo_title character varying,
  meta_description text,
  deleted_at timestamp with time zone,
  status character varying DEFAULT 'Draft'::character varying,
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id)
);
CREATE TABLE public.broadcasts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  target_type text NOT NULL,
  target_value text,
  priority text DEFAULT 'Normal'::text,
  status text DEFAULT 'Sent'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT broadcasts_pkey PRIMARY KEY (id),
  CONSTRAINT broadcasts_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.canvasser_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid,
  canvasser_id uuid,
  location_lat numeric,
  location_lng numeric,
  address_notes text,
  contact_name character varying,
  interaction_result character varying NOT NULL,
  key_issues ARRAY,
  needs_follow_up boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT canvasser_logs_pkey PRIMARY KEY (id),
  CONSTRAINT canvasser_logs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.canvassing_campaigns(id),
  CONSTRAINT canvasser_logs_canvasser_id_fkey FOREIGN KEY (canvasser_id) REFERENCES auth.users(id)
);
CREATE TABLE public.canvassing_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text NOT NULL,
  target_constituency character varying NOT NULL,
  target_wards ARRAY,
  start_date date NOT NULL,
  end_date date NOT NULL,
  goal_contacts integer DEFAULT 100,
  status character varying DEFAULT 'DRAFT'::character varying,
  commander_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT canvassing_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT canvassing_campaigns_commander_id_fkey FOREIGN KEY (commander_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chapter_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'Event'::text,
  activity_date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chapter_activities_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_activities_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.chapter_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  applicant_id uuid,
  proposed_chapter_name character varying NOT NULL,
  region character varying NOT NULL,
  constituency character varying NOT NULL,
  experience_summary text,
  vision_statement text,
  status character varying DEFAULT 'Pending'::character varying,
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chapter_applications_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id),
  CONSTRAINT chapter_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admins(id)
);
CREATE TABLE public.chapter_leaders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid,
  name text NOT NULL,
  role text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chapter_leaders_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_leaders_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.chapter_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region text NOT NULL,
  chapter text NOT NULL,
  total_patriots integer NOT NULL DEFAULT 0,
  aggregate_chapter_points integer NOT NULL DEFAULT 0,
  total_chapter_achievements integer NOT NULL DEFAULT 0,
  regional_chapter_rank integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chapter_performance_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  city_or_region character varying,
  country character varying DEFAULT 'Ghana'::character varying,
  leader_name character varying,
  member_count integer DEFAULT 0,
  description text,
  details_url text,
  status character varying DEFAULT 'Active'::character varying,
  leader_id uuid,
  region character varying,
  constituency character varying,
  meeting_schedule text,
  local_focus text,
  email text,
  phone_number text,
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  author_name character varying NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id)
);
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'New'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  dialing_code character varying,
  is_diaspora boolean DEFAULT true,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.crisis_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  incident_type character varying NOT NULL,
  severity character varying DEFAULT 'MODERATE'::character varying,
  region character varying NOT NULL,
  description text NOT NULL,
  status character varying DEFAULT 'INVESTIGATING'::character varying,
  assigned_commander uuid,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT crisis_incidents_pkey PRIMARY KEY (id),
  CONSTRAINT crisis_incidents_assigned_commander_fkey FOREIGN KEY (assigned_commander) REFERENCES auth.users(id)
);
CREATE TABLE public.donation_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  target_amount numeric NOT NULL,
  raised_amount numeric DEFAULT 0,
  end_date timestamp with time zone,
  status character varying DEFAULT 'Active'::character varying,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT donation_campaigns_pkey PRIMARY KEY (id)
);
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid,
  campaign_id uuid,
  full_name character varying NOT NULL,
  phone character varying NOT NULL,
  amount numeric NOT NULL,
  country character varying,
  payment_method character varying,
  receipt_url text,
  status character varying DEFAULT 'Pending'::character varying,
  show_on_dashboard boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  verified_by uuid,
  verification_notes text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  reference text,
  cleared boolean DEFAULT false,
  description text,
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id),
  CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.donation_campaigns(id),
  CONSTRAINT donations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.admins(id)
);
CREATE TABLE public.field_action_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_id uuid,
  user_id uuid,
  check_in_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  check_out_time timestamp with time zone,
  check_in_lat numeric,
  check_in_lng numeric,
  is_verified boolean DEFAULT false,
  points_awarded integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT field_action_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT field_action_attendance_action_id_fkey FOREIGN KEY (action_id) REFERENCES public.field_actions(id),
  CONSTRAINT field_action_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.field_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  type character varying DEFAULT 'Rally'::character varying,
  status character varying DEFAULT 'Upcoming'::character varying,
  location_name character varying NOT NULL,
  location_lat numeric,
  location_lng numeric,
  geofence_radius_meters integer DEFAULT 500,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  target_attendance integer DEFAULT 1000,
  organizer_id uuid,
  region character varying,
  constituency character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT field_actions_pkey PRIMARY KEY (id),
  CONSTRAINT field_actions_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.field_directives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['Global'::text, 'Regional'::text, 'Chapter'::text, 'Individual'::text])),
  target_id text,
  priority text NOT NULL DEFAULT 'Normal'::text CHECK (priority = ANY (ARRAY['Low'::text, 'Normal'::text, 'High'::text, 'Urgent'::text])),
  deadline timestamp with time zone,
  points_awarded integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  status text DEFAULT 'Active'::text CHECK (status = ANY (ARRAY['Active'::text, 'Suspended'::text, 'Completed'::text, 'Expired'::text])),
  CONSTRAINT field_directives_pkey PRIMARY KEY (id),
  CONSTRAINT field_directives_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.field_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamp with time zone NOT NULL,
  location text NOT NULL,
  chapter text NOT NULL,
  status text NOT NULL DEFAULT 'Planned'::text CHECK (status = ANY (ARRAY['Planned'::text, 'In Progress'::text, 'Completed'::text, 'Cancelled'::text])),
  type text NOT NULL DEFAULT 'Rally'::text CHECK (type = ANY (ARRAY['Rally'::text, 'Town Hall'::text, 'Recruitment'::text, 'Training'::text])),
  attendees_expected integer DEFAULT 0,
  attendees_actual integer DEFAULT 0,
  budget_allocated numeric DEFAULT 0.00,
  budget_spent numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT field_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.field_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  directive_id uuid,
  member_id uuid,
  report_text text,
  media_url text,
  location_lat numeric,
  location_lng numeric,
  status text DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'Verified'::text, 'Rejected'::text])),
  points_applied boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT field_reports_pkey PRIMARY KEY (id),
  CONSTRAINT field_reports_directive_id_fkey FOREIGN KEY (directive_id) REFERENCES public.field_directives(id),
  CONSTRAINT field_reports_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);
CREATE TABLE public.ghana_constituencies (
  id integer NOT NULL DEFAULT nextval('ghana_constituencies_id_seq'::regclass),
  region_id integer,
  name character varying NOT NULL,
  CONSTRAINT ghana_constituencies_pkey PRIMARY KEY (id),
  CONSTRAINT ghana_constituencies_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.ghana_regions(id)
);
CREATE TABLE public.ghana_regions (
  id integer NOT NULL DEFAULT nextval('ghana_regions_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT ghana_regions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gotv_transport_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_id uuid,
  pickup_address text NOT NULL,
  polling_station_id character varying NOT NULL,
  requested_time timestamp with time zone NOT NULL,
  passengers integer DEFAULT 1,
  status character varying DEFAULT 'PENDING'::character varying,
  assigned_driver_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gotv_transport_requests_pkey PRIMARY KEY (id),
  CONSTRAINT gotv_transport_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id),
  CONSTRAINT gotv_transport_requests_assigned_driver_id_fkey FOREIGN KEY (assigned_driver_id) REFERENCES auth.users(id)
);
CREATE TABLE public.leaderboard_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rank_position integer NOT NULL,
  reward_name character varying NOT NULL,
  store_credit_ghs numeric DEFAULT 0,
  achievement_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT leaderboard_rewards_pkey PRIMARY KEY (id),
  CONSTRAINT leaderboard_rewards_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.logistics_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid,
  product_id uuid,
  action character varying NOT NULL,
  quantity_change integer NOT NULL,
  source_location character varying DEFAULT 'National Vault'::character varying,
  destination_location character varying,
  performed_by uuid,
  notes text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT logistics_audit_pkey PRIMARY KEY (id),
  CONSTRAINT logistics_audit_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.resource_requests(id),
  CONSTRAINT logistics_audit_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id),
  CONSTRAINT logistics_audit_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.logistics_velocity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region text NOT NULL,
  total_orders integer NOT NULL DEFAULT 0,
  avg_dispatch_hours numeric NOT NULL DEFAULT 0,
  avg_delivery_hours numeric NOT NULL DEFAULT 0,
  fulfillment_rate numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT logistics_velocity_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_counter_narratives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crisis_id uuid,
  target_platform character varying,
  approved_messaging text NOT NULL,
  hashtags text,
  dispatch_status character varying DEFAULT 'PENDING'::character varying,
  deployment_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT media_counter_narratives_pkey PRIMARY KEY (id),
  CONSTRAINT media_counter_narratives_crisis_id_fkey FOREIGN KEY (crisis_id) REFERENCES public.crisis_incidents(id)
);
CREATE TABLE public.media_kit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT media_kit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL UNIQUE,
  folder text NOT NULL,
  size_bytes bigint,
  mime_type text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT media_library_pkey PRIMARY KEY (id)
);
CREATE TABLE public.member_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  achievement_id uuid,
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT member_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT member_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT member_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.member_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  content text NOT NULL,
  sentiment_score double precision DEFAULT 0.0,
  is_reviewed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT member_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT member_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.member_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid,
  author_name text,
  author_role text,
  content text,
  is_system boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT member_notes_pkey PRIMARY KEY (id),
  CONSTRAINT member_notes_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);
CREATE TABLE public.member_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  points integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT member_points_pkey PRIMARY KEY (id),
  CONSTRAINT member_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.member_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid,
  device_name text,
  location text,
  ip_address text,
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT member_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT member_sessions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);
CREATE TABLE public.mobilization_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['Allocation'::text, 'Expenditure'::text])),
  amount numeric NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['Logistics'::text, 'Media'::text, 'Venues'::text, 'Transport'::text, 'Other'::text])),
  timestamp timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT mobilization_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT mobilization_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.movement_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text NOT NULL,
  target_date timestamp with time zone,
  status character varying DEFAULT 'Upcoming'::character varying,
  category character varying,
  importance_level character varying DEFAULT 'Normal'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  target_members integer,
  CONSTRAINT movement_milestones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.national_sentiment_intelligence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region character varying NOT NULL UNIQUE,
  avg_sentiment numeric DEFAULT 0,
  positive_count integer DEFAULT 0,
  negative_count integer DEFAULT 0,
  neutral_count integer DEFAULT 0,
  total_responses integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT national_sentiment_intelligence_pkey PRIMARY KEY (id)
);
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  broadcast_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'Info'::text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_broadcast_id_fkey FOREIGN KEY (broadcast_id) REFERENCES public.broadcasts(id)
);
CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid,
  label character varying NOT NULL,
  votes integer DEFAULT 0,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id)
);
CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid,
  option_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id),
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  status character varying DEFAULT 'Active'::character varying,
  total_votes integer DEFAULT 0,
  region character varying DEFAULT 'National'::character varying,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  category text DEFAULT 'General'::text,
  title text,
  poll_number integer,
  CONSTRAINT polls_pkey PRIMARY KEY (id)
);
CREATE TABLE public.predictive_impact_projections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region character varying NOT NULL UNIQUE,
  current_reach integer DEFAULT 0,
  projected_reach_30d integer DEFAULT 0,
  confidence_score numeric DEFAULT 0.85,
  mobilization_velocity numeric DEFAULT 0,
  potential_election_impact numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT predictive_impact_projections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.press_releases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  excerpt text,
  content text NOT NULL,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  author_id uuid,
  image_url text,
  is_official boolean DEFAULT true,
  CONSTRAINT press_releases_pkey PRIMARY KEY (id),
  CONSTRAINT press_releases_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id)
);
CREATE TABLE public.rapid_response_directives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text NOT NULL,
  priority character varying DEFAULT 'HIGH'::character varying,
  target_region character varying,
  action_type character varying,
  status character varying DEFAULT 'ACTIVE'::character varying,
  created_by uuid,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rapid_response_directives_pkey PRIMARY KEY (id),
  CONSTRAINT rapid_response_directives_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.resource_request_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid,
  product_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT resource_request_items_pkey PRIMARY KEY (id),
  CONSTRAINT resource_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.resource_requests(id),
  CONSTRAINT resource_request_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.resource_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_id uuid,
  region character varying NOT NULL,
  constituency character varying,
  status character varying DEFAULT 'Pending'::character varying,
  priority character varying DEFAULT 'Normal'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT resource_requests_pkey PRIMARY KEY (id),
  CONSTRAINT resource_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  author_name character varying NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.store_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  category character varying,
  price_ghs numeric NOT NULL,
  stock_quantity integer DEFAULT 0,
  status character varying DEFAULT 'Available'::character varying,
  image_emoji text,
  brand_color character varying,
  slug character varying UNIQUE,
  image_url text,
  description text,
  rating numeric DEFAULT 5.0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  low_stock_threshold integer DEFAULT 10,
  alert_sent boolean DEFAULT false,
  deleted_at timestamp with time zone,
  long_description text,
  CONSTRAINT store_inventory_pkey PRIMARY KEY (id)
);
CREATE TABLE public.store_inventory_regional (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  region text NOT NULL,
  stock_quantity integer DEFAULT 0,
  is_restricted boolean DEFAULT false,
  restriction_reason text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_inventory_regional_pkey PRIMARY KEY (id),
  CONSTRAINT store_inventory_regional_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.store_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT store_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT store_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.store_orders(id),
  CONSTRAINT store_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);
CREATE TABLE public.store_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid,
  full_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  shipping_address text NOT NULL,
  city character varying,
  country character varying NOT NULL,
  region_or_state character varying,
  payment_method character varying NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric NOT NULL,
  total_amount numeric NOT NULL,
  status character varying DEFAULT 'Pending'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  processing_at timestamp with time zone,
  dispatched_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  points_redeemed integer DEFAULT 0,
  points_value_ghs numeric DEFAULT 0,
  CONSTRAINT store_orders_pkey PRIMARY KEY (id),
  CONSTRAINT store_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  badge_id uuid,
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT auth.uid(),
  full_name character varying NOT NULL,
  email character varying UNIQUE,
  registration_number character varying NOT NULL UNIQUE,
  platform character varying NOT NULL,
  country character varying NOT NULL,
  phone_number character varying,
  gender character varying,
  region character varying,
  constituency character varying,
  chapter character varying,
  profession character varying,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status character varying DEFAULT 'Active'::character varying,
  avatar_url text,
  age_range character varying,
  education_level character varying,
  emergency_name character varying,
  emergency_relationship character varying,
  emergency_phone character varying,
  verification_status character varying DEFAULT 'In Review'::character varying,
  points bigint DEFAULT 0,
  verification_notes text,
  national_id text,
  children_count integer DEFAULT 0,
  residential_address text,
  city text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.voter_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  registration_status character varying DEFAULT 'UNVERIFIED'::character varying,
  polling_station_id character varying,
  verification_document_url text,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT voter_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT voter_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT voter_registrations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id)
);
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
);