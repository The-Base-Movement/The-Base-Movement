-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
  registration_source text DEFAULT 'digital'::text,
  referred_by text,
  deleted_at timestamp with time zone,
  temp_password_sent_at timestamp with time zone,
  must_change_password boolean DEFAULT false,
  newsletter_opt_out boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
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
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  author_name character varying NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id)
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
  latitude numeric,
  longitude numeric,
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id),
  CONSTRAINT chapters_country_fkey FOREIGN KEY (country) REFERENCES public.countries(name)
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
  closing_notified boolean NOT NULL DEFAULT false,
  CONSTRAINT polls_pkey PRIMARY KEY (id)
);
CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid,
  label character varying NOT NULL,
  votes integer DEFAULT 0,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id)
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
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  dialing_code character varying,
  is_diaspora boolean DEFAULT true,
  flag_url text,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ghana_regions (
  id integer NOT NULL DEFAULT nextval('ghana_regions_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT ghana_regions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ghana_constituencies (
  id integer NOT NULL DEFAULT nextval('ghana_constituencies_id_seq'::regclass),
  region_id integer,
  name character varying NOT NULL,
  leader_id uuid,
  leader_name character varying,
  description text,
  status character varying DEFAULT 'Active'::character varying,
  meeting_schedule text,
  local_focus text,
  email character varying,
  phone_number character varying,
  CONSTRAINT ghana_constituencies_pkey PRIMARY KEY (id),
  CONSTRAINT ghana_constituencies_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.ghana_regions(id),
  CONSTRAINT ghana_constituencies_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id)
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
  full_name character varying NOT NULL CHECK (length(TRIM(BOTH FROM full_name)) > 0),
  phone character varying NOT NULL CHECK (length(TRIM(BOTH FROM phone)) > 0),
  amount numeric NOT NULL CHECK (amount > 0::numeric),
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
  chapter text,
  paystack_reference text,
  constituency text,
  hubtel_reference text,
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id),
  CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.donation_campaigns(id),
  CONSTRAINT donations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.admins(id)
);
CREATE TABLE public.admins (
  id uuid NOT NULL,
  role character varying DEFAULT 'Editor'::character varying CHECK (role::text = ANY (ARRAY['SuperAdmin'::character varying, 'RegionalAdmin'::character varying, 'FinanceOfficer'::character varying, 'ADMIN'::character varying, 'SUPER_ADMIN'::character varying, 'FINANCE_OFFICER'::character varying, 'EXECUTIVE'::character varying, 'FOUNDER'::character varying, 'ORGANIZER'::character varying, 'REGIONAL_DIRECTOR'::character varying, 'CONSTITUENCY_LEAD'::character varying, 'VERIFIER'::character varying, 'CHIEF_EDITOR'::character varying, 'SENIOR_EDITOR'::character varying, 'EDITOR'::character varying, 'JUNIOR_EDITOR'::character varying, 'REGIONAL_CORRESPONDENT'::character varying, 'IT_MANAGER'::character varying, 'CHAPTER_LEAD'::character varying, 'CHAPTER_SECRETARY'::character varying, 'FIELD_AGENT'::character varying, 'COMMUNICATIONS_OFFICER'::character varying, 'INTELLIGENCE_ANALYST'::character varying, 'STORE_MANAGER'::character varying, 'YOUTH_LEADER'::character varying, 'MOVEMENT_LEADER'::character varying]::text[])),
  permissions jsonb DEFAULT '{}'::jsonb,
  assigned_region character varying,
  created_at timestamp with time zone DEFAULT now(),
  preferences jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
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
  paystack_reference text,
  payment_status text NOT NULL DEFAULT 'Unpaid'::text CHECK (payment_status = ANY (ARRAY['Unpaid'::text, 'Paid'::text, 'Failed'::text, 'Refunded'::text])),
  hubtel_reference text,
  CONSTRAINT store_orders_pkey PRIMARY KEY (id),
  CONSTRAINT store_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
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
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  icon character varying NOT NULL,
  description text NOT NULL,
  points_required integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
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
CREATE TABLE public.member_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  achievement_id uuid,
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT member_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT member_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT member_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.member_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  points integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT member_points_pkey PRIMARY KEY (id),
  CONSTRAINT member_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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
CREATE TABLE public.mobilization_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['Allocation'::text, 'Expenditure'::text])),
  amount numeric NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT mobilization_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT mobilization_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
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
CREATE TABLE public.authors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  role text,
  bio text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  member_id uuid,
  CONSTRAINT authors_pkey PRIMARY KEY (id),
  CONSTRAINT authors_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id)
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
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_inventory(id)
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
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text),
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
  email text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text),
  subject text,
  message text NOT NULL CHECK (length(TRIM(BOTH FROM message)) > 0),
  status text DEFAULT 'New'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
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
CREATE TABLE public.chapter_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  title text NOT NULL,
  meeting_date date NOT NULL,
  meeting_time text,
  recurrence text NOT NULL DEFAULT 'once'::text,
  expiry_date date,
  never_expires boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chapter_meetings_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_meetings_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.chapter_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  content text NOT NULL,
  author_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chapter_announcements_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_announcements_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.chapter_polls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  ends_at timestamp with time zone NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  banner_url text,
  CONSTRAINT chapter_polls_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_polls_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT chapter_polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.chapter_poll_candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  name text NOT NULL,
  position text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  avatar_url text,
  CONSTRAINT chapter_poll_candidates_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_poll_candidates_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.chapter_polls(id)
);
CREATE TABLE public.chapter_poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chapter_poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.chapter_polls(id),
  CONSTRAINT chapter_poll_votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.chapter_poll_candidates(id),
  CONSTRAINT chapter_poll_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES auth.users(id)
);
CREATE TABLE public.author_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT author_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chapter_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  chapter_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chapter_requests_pkey PRIMARY KEY (id),
  CONSTRAINT chapter_requests_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id),
  CONSTRAINT chapter_requests_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.field_agent_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  constituency text NOT NULL,
  region text,
  campaign_id uuid,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  assigned_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT field_agent_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT field_agent_assignments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id),
  CONSTRAINT field_agent_assignments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.canvassing_campaigns(id),
  CONSTRAINT field_agent_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.polling_station_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  polling_station_id text NOT NULL,
  constituency text,
  region text,
  election_date date,
  status text NOT NULL DEFAULT 'assigned'::text CHECK (status = ANY (ARRAY['assigned'::text, 'confirmed'::text, 'deployed'::text, 'stood_down'::text])),
  assigned_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT polling_station_agents_pkey PRIMARY KEY (id),
  CONSTRAINT polling_station_agents_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id),
  CONSTRAINT polling_station_agents_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.polling_stations (
  code text NOT NULL,
  name text NOT NULL,
  community text,
  constituency text NOT NULL,
  region text NOT NULL,
  CONSTRAINT polling_stations_pkey PRIMARY KEY (code)
);
CREATE TABLE public.party_officials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  role character varying NOT NULL,
  tier character varying NOT NULL,
  region character varying,
  bio text,
  avatar_url text,
  twitter_url character varying,
  linkedin_url character varying,
  email character varying,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  facebook_url text,
  instagram_url text,
  CONSTRAINT party_officials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.party_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT party_tiers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT media_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.plan_pillars (
  id text NOT NULL,
  pillar_number text NOT NULL,
  title text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  summary text NOT NULL,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT plan_pillars_pkey PRIMARY KEY (id)
);
CREATE TABLE public.spending_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spending_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  CONSTRAINT admin_role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id)
);
CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organization text NOT NULL,
  description text NOT NULL,
  requirements text,
  location text,
  job_type text NOT NULL DEFAULT 'full-time'::text,
  category text NOT NULL DEFAULT 'General'::text,
  salary_range text,
  platform_filter text NOT NULL DEFAULT 'ALL'::text,
  deadline date,
  status text NOT NULL DEFAULT 'draft'::text,
  posted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  banner_url text,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES auth.users(id)
);
CREATE TABLE public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  member_id uuid NOT NULL,
  cover_letter text NOT NULL,
  resume_url text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_applications_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id)
);
CREATE TABLE public.blog_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  member_id uuid NOT NULL,
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  parent_id uuid,
  reply_to_name text,
  flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT blog_comments_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id),
  CONSTRAINT blog_comments_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id),
  CONSTRAINT blog_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_comments(id)
);
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.blog_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT blog_post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT blog_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id)
);
CREATE TABLE public.referral_awards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_member_id uuid NOT NULL,
  award_type text NOT NULL CHECK (award_type = ANY (ARRAY['registration'::text, 'verification'::text])),
  points integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT referral_awards_pkey PRIMARY KEY (id),
  CONSTRAINT referral_awards_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id),
  CONSTRAINT referral_awards_referred_member_id_fkey FOREIGN KEY (referred_member_id) REFERENCES public.users(id)
);
CREATE TABLE public.constituency_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  constituency_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  type character varying,
  activity_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT constituency_activities_pkey PRIMARY KEY (id),
  CONSTRAINT constituency_activities_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.ghana_constituencies(id)
);
CREATE TABLE public.constituency_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  constituency_id integer NOT NULL,
  content text NOT NULL,
  author_name character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT constituency_announcements_pkey PRIMARY KEY (id),
  CONSTRAINT constituency_announcements_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.ghana_constituencies(id)
);
CREATE TABLE public.constituency_leaders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  constituency_id integer NOT NULL,
  member_id uuid,
  name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['Secretary'::text, 'Deputy Secretary'::text, 'Treasurer'::text])),
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT constituency_leaders_pkey PRIMARY KEY (id),
  CONSTRAINT constituency_leaders_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.ghana_constituencies(id),
  CONSTRAINT constituency_leaders_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id)
);
CREATE TABLE public.password_reset_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT password_reset_otps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.newsletters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body_html text NOT NULL,
  audience_type text NOT NULL CHECK (audience_type = ANY (ARRAY['all'::text, 'region'::text, 'constituency'::text, 'chapter'::text, 'role'::text, 'multi'::text])),
  audience_value text,
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text])),
  error_message text,
  sent_by uuid,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  audience_filters jsonb,
  delivered_count integer NOT NULL DEFAULT 0,
  bounce_count integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamp with time zone,
  CONSTRAINT newsletters_pkey PRIMARY KEY (id),
  CONSTRAINT newsletters_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.users(id)
);
CREATE TABLE public.newsletter_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  newsletter_id uuid,
  email text NOT NULL,
  event text NOT NULL,
  sg_event_id text,
  reason text,
  occurred_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_events_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_events_newsletter_id_fkey FOREIGN KEY (newsletter_id) REFERENCES public.newsletters(id)
);
CREATE TABLE public.finance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type = ANY (ARRAY['BudgetAllocation'::text, 'ExpenseReimbursement'::text, 'InventoryReplenishment'::text])),
  chapter text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text])),
  officer_comment text,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  approval_tier integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'Other'::text,
  CONSTRAINT finance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT finance_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id),
  CONSTRAINT finance_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.it_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'ongoing'::it_project_status,
  description text,
  start_date date,
  end_date date,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT it_projects_pkey PRIMARY KEY (id),
  CONSTRAINT it_projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.it_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  content text NOT NULL,
  color_theme USER-DEFINED NOT NULL DEFAULT 'yellow'::it_note_color,
  author_id uuid NOT NULL,
  project_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT it_notes_pkey PRIMARY KEY (id),
  CONSTRAINT it_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT it_notes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.it_projects(id)
);
CREATE TABLE public.it_note_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT it_note_comments_pkey PRIMARY KEY (id),
  CONSTRAINT it_note_comments_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.it_notes(id),
  CONSTRAINT it_note_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.it_todos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'todo'::it_todo_status,
  assignee_id uuid,
  project_id uuid,
  due_date date,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT it_todos_pkey PRIMARY KEY (id),
  CONSTRAINT it_todos_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES auth.users(id),
  CONSTRAINT it_todos_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.it_projects(id),
  CONSTRAINT it_todos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.it_security_protocols (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  markdown_content text,
  file_url text,
  version text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT it_security_protocols_pkey PRIMARY KEY (id),
  CONSTRAINT it_security_protocols_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.it_hierarchy (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  reports_to uuid,
  role_title text NOT NULL,
  department text NOT NULL DEFAULT 'IT'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT it_hierarchy_pkey PRIMARY KEY (id),
  CONSTRAINT it_hierarchy_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT it_hierarchy_reports_to_fkey FOREIGN KEY (reports_to) REFERENCES public.users(id)
);
CREATE TABLE public.it_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in-progress'::text, 'resolved'::text])),
  submitted_by uuid NOT NULL,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT it_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT it_tickets_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id),
  CONSTRAINT it_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);