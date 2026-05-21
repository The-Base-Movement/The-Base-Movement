-- Create plan_pillars table
create table if not exists public.plan_pillars (
  id text primary key,
  pillar_number text not null,
  title text not null,
  icon text not null,
  color text not null,
  summary text not null,
  objectives jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.plan_pillars enable row level security;

-- Create policies
drop policy if exists "Allow public read access to plan_pillars" on public.plan_pillars;
create policy "Allow public read access to plan_pillars"
  on public.plan_pillars for select
  using (true);

drop policy if exists "Allow full control to authenticated admins" on public.plan_pillars;
create policy "Allow full control to authenticated admins"
  on public.plan_pillars for all
  using (auth.role() = 'authenticated');

-- Seed initial static data from agendaData.ts
insert into public.plan_pillars (id, pillar_number, title, icon, color, summary, objectives, sort_order)
values
  (
    'education',
    '01',
    'Quality Education for Every Ghanaian',
    'school',
    'hsl(var(--primary))',
    'Ensure universal access to quality formal and informal education that produces informed, capable, and civically responsible Ghanaian citizens at every level of society.',
    '[
      {
        "title": "Universal Access",
        "items": [
          "Fully fund free quality education covering tuition, materials and meals for every child.",
          "Build or rehabilitate at least one equipped school in every community of 500+.",
          "Introduce credible scholarships for deserving students from low-income households."
        ]
      },
      {
        "title": "Curriculum & Civic Reform",
        "items": [
          "Integrate critical thinking, financial literacy, entrepreneurship and civic responsibility into the national curriculum at every level.",
          "Launch community learning centres and adult literacy programmes to reach those who missed formal schooling."
        ]
      },
      {
        "title": "Teacher Quality",
        "items": [
          "Improve teacher conditions of service, making the profession well-compensated and respected.",
          "Invest in continuous professional development, especially in science, mathematics and technical education."
        ]
      }
    ]'::jsonb,
    1
  ),
  (
    'government',
    '02',
    'Lean, Accountable Government',
    'account_balance',
    'hsl(var(--destructive))',
    'Build a right-sized, fiscally disciplined government where public office is a service to the nation, not a path to personal enrichment, and where every cedi of public money is accounted for.',
    '[
      {
        "title": "Right-Sizing Government",
        "items": [
          "Audit all ministries and agencies within 90 days of assuming office and publish findings publicly.",
          "Reduce ministers to the constitutional minimum.",
          "Merge overlapping agencies to eliminate duplication."
        ]
      },
      {
        "title": "Fiscal Discipline & Anti-Corruption",
        "items": [
          "Enforce transparent, performance-linked public sector pay.",
          "Strengthen anti-corruption institutions.",
          "Mandate publicly accessible asset declarations for all political appointees.",
          "Prosecute all documented corruption regardless of party."
        ]
      }
    ]'::jsonb,
    2
  ),
  (
    'industry',
    '03',
    'Industrialisation, Tourism & Agro-Processing',
    'factory',
    'hsl(var(--accent))',
    'Drive economic growth and mass employment through three powerful engines: building factories and industries across all 16 regions, developing Ghana into a world-class tourism destination, and transforming raw agricultural produce into high-value processed goods that keep wealth and jobs inside Ghana.',
    '[
      {
        "title": "Industrialisation Factories Across All 16 Regions",
        "items": [
          "Establish manufacturing plants and processing facilities in all 16 regions, beginning with five regions in the first phase.",
          "Develop industrial zones with fiscal incentives including tax holidays and import duty waivers on machinery.",
          "Prioritise regions with the highest youth unemployment.",
          "Build a pharmaceutical manufacturing hub in Gomoa Okyereko to produce medicines locally for Ghana and for export across Africa."
        ]
      },
      {
        "title": "Tourism Unlocking Ghana''s Economic Potential",
        "items": [
          "Transform Ghana''s beaches, national parks, including Mole National Park, and heritage sites into world-class tourism destinations through targeted infrastructure investment.",
          "Develop the Volta Region as a dedicated creative economy and eco-tourism hub.",
          "Establish a landmark national monument to position Ghana on the global tourism map.",
          "Use tourism receipts to strengthen the Cedi and reduce pressure on foreign exchange."
        ]
      },
      {
        "title": "Agro-Processing Keeping Value in Ghana",
        "items": [
          "Build agro-processing hubs in key agricultural zones to process cassava into ethanol and starch, plantain stems into textile fibre and paper, coconut into oil and activated carbon, and yam into pharmaceutical-grade flour.",
          "Eliminate the export of raw agricultural commodities at low prices.",
          "Ensure that every harvest creates not just farm income but factory jobs, packaging jobs, and export revenue that stays inside Ghana."
        ]
      }
    ]'::jsonb,
    3
  ),
  (
    'infrastructure',
    '04',
    'Quality Infrastructure From Cities to Villages',
    'construction',
    'hsl(var(--primary))',
    'Deliver world-class roads, energy, water, and digital infrastructure across Ghana, with deliberate priority given to rural and village communities that have been left behind.',
    '[
      {
        "title": "Rural Road Development",
        "items": [
          "Develop a National Rural Roads Master Plan to fund construction and rehabilitation of all critical feeder roads.",
          "Ensure every farming community has an all-season road within two terms.",
          "Create a dedicated Rural Roads Maintenance Fund."
        ]
      },
      {
        "title": "Urban & Housing",
        "items": [
          "Invest in urban road networks, drainage and public transport.",
          "Develop an affordable housing programme with accessible financing for working families."
        ]
      },
      {
        "title": "Energy & Digital",
        "items": [
          "Achieve 100% household electrification within two terms.",
          "Extend broadband internet access to all districts, enabling a digital economy beyond the major cities."
        ]
      }
    ]'::jsonb,
    4
  ),
  (
    'reform',
    '05',
    'Comprehensive Institutional Reform',
    'gavel',
    'hsl(var(--destructive))',
    'Restructure, streamline, and strengthen all public institutions so that government serves the people efficiently, transparently, and without unnecessary duplication or waste.',
    '[
      {
        "title": "Restructuring Institutions",
        "items": [
          "Conduct a full functional review of all state institutions in year one.",
          "Merge overlapping ministries guided by service delivery, not politics.",
          "Establish a permanent independent Public Sector Reform Commission."
        ]
      },
      {
        "title": "Judicial & Law Enforcement",
        "items": [
          "Strengthen judicial independence and speed.",
          "Reform the Ghana Police Service with better training, welfare and accountability.",
          "Create independent oversight for all law enforcement."
        ]
      },
      {
        "title": "Electoral & Democratic Reform",
        "items": [
          "Strengthen the Electoral Commission''s independence.",
          "Introduce campaign finance legislation to limit the influence of money in democratic processes."
        ]
      }
    ]'::jsonb,
    5
  ),
  (
    'agriculture',
    '06',
    'Expertise-Led Agriculture Sector',
    'eco',
    'hsl(var(--accent))',
    'Place qualified agricultural experts, scientists, and practitioners in charge of Ghana''s food and farming sector, driving evidence-based policy, agro-processing, and genuine food security.',
    '[
      {
        "title": "Expert Leadership",
        "items": [
          "Appoint Ministers and senior officials based on agricultural expertise, not political loyalty.",
          "Establish an independent Agricultural Advisory Council.",
          "Deploy trained extension officers to every district."
        ]
      },
      {
        "title": "Agro-Processing & Value Addition",
        "items": [
          "Build processing hubs in key agricultural zones to produce ethanol, starch, oils and derivatives locally.",
          "Develop a National Irrigation Programme for year-round productivity."
        ]
      },
      {
        "title": "Farmer Welfare & Food Security",
        "items": [
          "Introduce a Farmer Support Programme covering subsidised inputs, crop insurance, guaranteed minimum pricing and market access.",
          "Build strategic grain reserves and mechanise farming at scale in northern regions."
        ]
      }
    ]'::jsonb,
    6
  )
on conflict (id) do update set
  pillar_number = excluded.pillar_number,
  title = excluded.title,
  icon = excluded.icon,
  color = excluded.color,
  summary = excluded.summary,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  updated_at = now();
