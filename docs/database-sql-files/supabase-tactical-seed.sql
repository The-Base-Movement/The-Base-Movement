-- Phase 13 & 14 Tactical Seed Data (Synchronized with Auth)
-- Designed to bring the War Room and Ground Game modules to life with high-fidelity telemetry

-- 1. Crisis Incidents
INSERT INTO public.crisis_incidents (id, incident_type, severity, region, description, status, assigned_commander) VALUES
(
    'c0010000-0000-0000-0000-000000000001',
    'LOGISTICAL_FAILURE',
    'SEVERE',
    'Greater Accra',
    'Registration portal latency reported in Ayawaso West. Members unable to upload digital ID photos during peak hours.',
    'INVESTIGATING',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
),
(
    'c0010000-0000-0000-0000-000000000002',
    'PR_ATTACK',
    'MODERATE',
    'Ashanti',
    'Coordinated misinformation campaign on local radio regarding chapter dues. Allegations of misappropriation being spread by opposition proxies.',
    'CONTAINED',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
),
(
    'c0010000-0000-0000-0000-000000000003',
    'PROTEST',
    'LOW',
    'Volta',
    'Small gathering at Ho central market demanding faster rollout of regional leadership training.',
    'RESOLVED',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
) ON CONFLICT (id) DO NOTHING;

-- 2. Rapid Response Directives
INSERT INTO public.rapid_response_directives (id, title, description, priority, target_region, action_type, status, created_by) VALUES
(
    'd0010000-0000-0000-0000-000000000001',
    'Digital Sovereignty Strike',
    'Deploy counter-narrative on Twitter and Facebook to debunk radio misinformation in Ashanti.',
    'HIGH',
    'Ashanti',
    'DIGITAL_STRIKE',
    'ACTIVE',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
),
(
    'd0010000-0000-0000-0000-000000000002',
    'Emergency Logistics Re-route',
    'Redirect 500 membership cards from Eastern region to Greater Accra to handle surge in Ayawaso West.',
    'CRITICAL',
    'Greater Accra',
    'SUPPLY_RUN',
    'ACTIVE',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
) ON CONFLICT (id) DO NOTHING;

-- 3. Media Counter-Narratives
INSERT INTO public.media_counter_narratives (crisis_id, target_platform, approved_messaging, hashtags, dispatch_status) VALUES
(
    'c0010000-0000-0000-0000-000000000002',
    'TWITTER',
    'The Base Movement remains committed to total transparency. All dues are reinvested directly into regional development. #TheBaseTransparency #AccountableLeadership',
    '#TheBase, #Accountability',
    'DEPLOYED'
),
(
    'c0010000-0000-0000-0000-000000000002',
    'FACEBOOK',
    'Beware of misinformation. Official financial audits are available to all verified members in the Leadership Hub.',
    '#TheBaseMovement',
    'PENDING'
);

-- 4. Canvassing Campaigns
INSERT INTO public.canvassing_campaigns (id, title, description, target_constituency, start_date, end_date, goal_contacts, status, commander_id) VALUES
(
    'ca000000-0000-0000-0000-000000000001',
    'Operation First-Time Voter',
    'Coordinated outreach to university campuses to assist students with voter registration verification.',
    'Ayawaso West',
    '2024-05-01',
    '2024-06-01',
    5000,
    'ACTIVE',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
),
(
    'ca000000-0000-0000-0000-000000000002',
    'Rural Heartbeat Outreach',
    'Door-to-door engagement in farming communities to identify key local issues.',
    'Asunafo South',
    '2024-06-15',
    '2024-07-15',
    2000,
    'DRAFT',
    '5b7dd2c1-1307-41bb-845c-92b193220f79'
) ON CONFLICT (id) DO NOTHING;

-- 5. Canvasser Logs (Simulation for active campaign)
INSERT INTO public.canvasser_logs (campaign_id, canvasser_id, contact_name, interaction_result, key_issues, needs_follow_up) VALUES
(
    'ca000000-0000-0000-0000-000000000001',
    '5b7dd2c1-1307-41bb-845c-92b193220f79',
    'Kojo Mensah',
    'STRONG_SUPPORT',
    ARRAY['Economy', 'Digital Infrastructure'],
    false
),
(
    'ca000000-0000-0000-0000-000000000001',
    '5b7dd2c1-1307-41bb-845c-92b193220f79',
    'Ama Serwaa',
    'UNDECIDED',
    ARRAY['Education', 'Roads'],
    true
);

-- 6. Voter Registrations (Initial High-Fidelity Data)
INSERT INTO public.voter_registrations (user_id, registration_status, polling_station_id) VALUES
(
    '5b7dd2c1-1307-41bb-845c-92b193220f79',
    'VERIFIED_VOTER',
    'C061201'
) ON CONFLICT (user_id) DO NOTHING;
