-- Consolidate operational departments to the approved leadership hierarchy.
-- Canonical department URLs use these IDs directly; old slugs are not aliases.

INSERT INTO public.helpdesk_departments
  (id, name, handler_roles, restricted_submitter_roles, icon, sort_order, active)
VALUES
  (
    'board-governance',
    'Board / Governance',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','BOARD_CHAIR','BOARD_SECRETARY','EXECUTIVE',
      'MOVEMENT_LEADER','AUDIT_COMPLIANCE_OFFICER','LEGAL_OFFICER',
      'BOARD_MEMBER','BOARD_TREASURER','BOARD_ADVISOR'
    ],
    NULL,
    'corporate_fare',
    1,
    true
  ),
  (
    'national-ict',
    'National ICT',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','ICT_DIRECTOR','ADMIN','ADMIN_L2','IT_MANAGER',
      'SYSTEM_ADMINISTRATOR','CYBERSECURITY_OFFICER','TECHNICAL_SUPPORT_OFFICER',
      'DATABASE_MANAGER','WEB_APP_MANAGER','DATA_PROTECTION_OFFICER'
    ],
    NULL,
    'computer',
    2,
    true
  ),
  (
    'security-intel',
    'Security / Intel',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','SECURITY_DIRECTOR','DEPUTY_SECURITY_DIRECTOR',
      'INTELLIGENCE_ANALYST','FIELD_INTELLIGENCE_OFFICER','INVESTIGATION_OFFICER',
      'RISK_THREAT_ANALYST','REGIONAL_SECURITY_OFFICER',
      'CONSTITUENCY_SECURITY_OFFICER'
    ],
    NULL,
    'shield',
    3,
    true
  ),
  (
    'operations-organising',
    'Operations & Organising',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','NATIONAL_COORDINATOR','ORGANIZER',
      'NATIONAL_SECRETARY','NATIONAL_LOGISTICS_OFFICER','YOUTH_LEADER',
      'STORE_MANAGER','REGIONAL_DIRECTOR','REGIONAL_SECRETARY',
      'REGIONAL_ORGANISER','REGIONAL_LOGISTICS_OFFICER',
      'REGIONAL_YOUTH_ORGANISER','CONSTITUENCY_LEAD',
      'CONSTITUENCY_SECRETARY','CONSTITUENCY_ORGANISER',
      'CONSTITUENCY_LOGISTICS_OFFICER','CONSTITUENCY_DEPUTY','CHAPTER_LEAD',
      'CHAPTER_SECRETARY','FIELD_AGENT','POLLING_STATION_COORDINATOR',
      'POLLING_STATION_AGENT','MEMBERSHIP_OFFICER'
    ],
    NULL,
    'hub',
    4,
    true
  ),
  (
    'media-communications',
    'Media & Communications',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','COMMUNICATIONS_OFFICER','CHIEF_EDITOR',
      'SENIOR_EDITOR','EDITOR','JUNIOR_EDITOR','REGIONAL_MEDIA_OFFICER',
      'REGIONAL_CORRESPONDENT','REGIONAL_ICT_OFFICER',
      'CONSTITUENCY_MEDIA_OFFICER'
    ],
    NULL,
    'campaign',
    5,
    true
  ),
  (
    'finance-fundraising',
    'Finance & Fundraising',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','FINANCE_OFFICER','NATIONAL_FUNDRAISING_OFFICER',
      'REGIONAL_FINANCE_OFFICER','CONSTITUENCY_FINANCE_OFFICER',
      'CONSTITUENCY_TREASURER','CHAPTER_TREASURER'
    ],
    NULL,
    'account_balance',
    6,
    true
  ),
  (
    'research-policy',
    'Research & Policy',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','NATIONAL_RESEARCH_POLICY_DIRECTOR',
      'REGIONAL_RESEARCH_POLICY_OFFICER','CONSTITUENCY_RESEARCH_POLICY_OFFICER'
    ],
    NULL,
    'query_stats',
    7,
    true
  ),
  (
    'appointment-welfare',
    'Appointment, Discipline & Welfare',
    ARRAY[
      'SUPER_ADMIN','FOUNDER','NATIONAL_WELFARE_OFFICER',
      'NATIONAL_DISCIPLINARY_OFFICER','NATIONAL_APPOINTMENT_OFFICER',
      'REGIONAL_WELFARE_OFFICER','REGIONAL_DISCIPLINARY_OFFICER',
      'REGIONAL_APPOINTMENT_OFFICER','CONSTITUENCY_WELFARE_OFFICER',
      'CONSTITUENCY_DISCIPLINARY_OFFICER','CONSTITUENCY_APPOINTMENT_OFFICER'
    ],
    NULL,
    'groups_2',
    8,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  handler_roles = EXCLUDED.handler_roles,
  restricted_submitter_roles = EXCLUDED.restricted_submitter_roles,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = true;

CREATE TEMP TABLE department_consolidation_map (
  old_id text PRIMARY KEY,
  new_id text NOT NULL
) ON COMMIT DROP;

INSERT INTO department_consolidation_map (old_id, new_id)
VALUES
  ('it', 'national-ict'),
  ('intelligence', 'security-intel'),
  ('media', 'media-communications'),
  ('finance', 'finance-fundraising'),
  ('store', 'operations-organising'),
  ('membership', 'operations-organising'),
  ('field', 'operations-organising'),
  ('chapter', 'operations-organising'),
  ('constituency', 'operations-organising'),
  ('youth', 'operations-organising'),
  ('organizer', 'operations-organising'),
  ('executive', 'board-governance'),
  ('founder', 'board-governance'),
  ('movement_leader', 'board-governance')
ON CONFLICT (old_id) DO UPDATE SET new_id = EXCLUDED.new_id;

DO $$
BEGIN
  IF to_regclass('public.helpdesk_tickets') IS NOT NULL THEN
    UPDATE public.helpdesk_tickets AS ticket
    SET department_id = map.new_id
    FROM department_consolidation_map AS map
    WHERE ticket.department_id = map.old_id;
  END IF;

  IF to_regclass('public.conversations') IS NOT NULL THEN
    UPDATE public.conversations AS conversation
    SET department_id = map.new_id
    FROM department_consolidation_map AS map
    WHERE conversation.department_id = map.old_id;
  END IF;

  IF to_regclass('public.assets') IS NOT NULL THEN
    UPDATE public.assets AS asset
    SET department_id = map.new_id
    FROM department_consolidation_map AS map
    WHERE asset.department_id = map.old_id;
  END IF;

  IF to_regclass('public.asset_categories') IS NOT NULL THEN
    UPDATE public.asset_categories AS category
    SET department_id = map.new_id
    FROM department_consolidation_map AS map
    WHERE category.department_id = map.old_id;
  END IF;

  IF to_regclass('public.asset_requests') IS NOT NULL THEN
    UPDATE public.asset_requests AS request
    SET department_id = map.new_id
    FROM department_consolidation_map AS map
    WHERE request.department_id = map.old_id;
  END IF;
END $$;

UPDATE public.helpdesk_departments AS department
SET active = false
FROM department_consolidation_map AS map
WHERE department.id = map.old_id;
