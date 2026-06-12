-- MASTER DATA FOR THE BASE MOVEMENT
-- Execute this in your Supabase SQL Editor to populate reference tables.

-- 1. Ensure Regions exist and get their IDs
-- The IDs will be 1 to 16 based on the insert order if the table was fresh.
-- If not, we use the names to map.

INSERT INTO ghana_regions (name) VALUES
('Ahafo'), ('Ashanti'), ('Bono'), ('Bono East'), ('Central'), ('Eastern'), ('Greater Accra'),
('North East'), ('Northern'), ('Oti'), ('Savannah'), ('Upper East'), ('Upper West'), ('Volta'), ('Western'), ('Western North')
ON CONFLICT (name) DO NOTHING;

-- 2. Populate Constituencies (Mapped to Regions)
-- We use subqueries to get the region_id by name to be safe.

-- AHAFO (Region ID lookup)
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'])
FROM ghana_regions WHERE name = 'Ahafo'
ON CONFLICT DO NOTHING;

-- ASHANTI
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY[
    'Adansi-Asokwa', 'Fomena', 'New Edubease', 'Afigya Kwabre North', 'Afigya Kwabre South',
    'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Akrofuom', 'Odotobri',
    'Manso Nkwanta', 'Manso Edubia', 'Asante Akim Central', 'Asante Akim North', 'Asante Akim South',
    'Asawase', 'Asokwa', 'Atwima-Kwanwoma', 'Atwima Mponua', 'Atwima-Nwabiagya South', 'Atwima-Nwabiagya North',
    'Bekwai', 'Bosome-Freho', 'Bosomtwe', 'Ejisu', 'Ejura-Sekyedumase', 'Juaben', 'Bantama',
    'Manhyia North', 'Manhyia South', 'Nhyiaeso', 'Subin', 'Kwabre East', 'Kwadaso', 'Mampong',
    'Obuasi East', 'Obuasi West', 'Offinso South', 'Offinso North', 'Oforikrom', 'Old Tafo',
    'Sekyere Afram Plains', 'Nsuta-Kwamang-Beposo', 'Afigya Sekyere East', 'Kumawu', 'Effiduase-Asokore', 'Suame'
])
FROM ghana_regions WHERE name = 'Ashanti'
ON CONFLICT DO NOTHING;

-- GREATER ACCRA
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY[
    'Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Ablekuma South', 'Odododiodio', 'Okaikwei Central',
    'Okaikwei South', 'Ada', 'Sege', 'Adenta', 'Ashaiman', 'Ayawaso Central', 'Ayawaso East', 'Ayawaso North',
    'Ayawaso West', 'Anyaa-Sowutuom', 'Dome-Kwabenya', 'Trobu', 'Bortianor-Ngleshie-Amanfrom', 'Domeabra-Obom',
    'Amasaman', 'Korle Klottey', 'Kpone-Katamanso', 'Krowor', 'Dade Kotopon', 'Abokobi-Madina', 'Ledzokuku',
    'Ningo-Prampram', 'Okaikwei North', 'Shai-Osudoku', 'Tema Central', 'Tema East', 'Tema West', 'Weija'
])
FROM ghana_regions WHERE name = 'Greater Accra'
ON CONFLICT DO NOTHING;

-- BONO
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Banda Ahenkro', 'Berekum East', 'Berekum West', 'Dormaa Central', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Sunyani East', 'Sunyani West', 'Tain', 'Wenchi'])
FROM ghana_regions WHERE name = 'Bono'
ON CONFLICT DO NOTHING;

-- CENTRAL
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY[
    'Abura-Asebu-Kwamankese', 'Agona East', 'Agona West', 'Ajumako-Enyan-Essiam', 'Asikuma-Odoben-Brakwa',
    'Assin Central', 'Assin North', 'Assin South', 'Awutu-Senya East', 'Awutu-Senya West', 'Cape Coast North',
    'Cape Coast South', 'Effutu', 'Ekumfi', 'Gomoa East', 'Gomoa Central', 'Gomoa West', 'Komenda-Edina-Eguafo-Abirem',
    'Mfantseman', 'Twifo-Atii Morkwaa', 'Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West'
])
FROM ghana_regions WHERE name = 'Central'
ON CONFLICT DO NOTHING;

-- EASTERN
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY[
    'Abuakwa North', 'Abuakwa South', 'Achiase', 'Akropong', 'Akwapim South', 'Ofoase-Ayirebi', 'Asene Akroso Manso',
    'Asuogyaman', 'Atiwa East', 'Atiwa West', 'Ayensuano', 'Akim Oda', 'Abirem', 'Akim Swedru', 'Akwatia',
    'Fanteakwa North', 'Fanteakwa South', 'Kade', 'Afram Plains North', 'Afram Plains South', 'Abetifi',
    'Mpraeso', 'Nkawkaw', 'Lower Manya', 'New Juaben North', 'New Juaben South', 'Nsawam Adoagyiri',
    'Okere', 'Suhum', 'Upper Manya', 'Upper West Akim', 'Lower West Akim', 'Yilo Krobo'
])
FROM ghana_regions WHERE name = 'Eastern'
ON CONFLICT DO NOTHING;

-- VOLTA
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Ho Central', 'Ho West', 'Hohoe', 'Kpando', 'North Dayi', 'South Dayi', 'Afadzato South', 'Agotime-Ziope', 'Adaklu', 'North Tongu', 'South Tongu', 'Central Tongu', 'Akatsi South', 'Akatsi North', 'Ketu South', 'Ketu North', 'Keta', 'Anlo'])
FROM ghana_regions WHERE name = 'Volta'
ON CONFLICT DO NOTHING;

-- NORTHERN
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Gushegu', 'Karaga', 'Kpandai', 'Kumbungu', 'Mion', 'Nanton', 'Bimbilla', 'Wulensi', 'Saboba', 'Sagnarigu', 'Savelugu', 'Tamale Central', 'Tamale North', 'Tamale South', 'Yendi'])
FROM ghana_regions WHERE name = 'Northern'
ON CONFLICT DO NOTHING;

-- BONO EAST
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Atebubu-Amantin', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South', 'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman South', 'Techiman North'])
FROM ghana_regions WHERE name = 'Bono East'
ON CONFLICT DO NOTHING;

-- NORTH EAST
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'])
FROM ghana_regions WHERE name = 'North East'
ON CONFLICT DO NOTHING;

-- OTI
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Krachi East', 'Krachi West', 'Krachi Nchumuru', 'Nkwanta North', 'Nkwanta South', 'Biakoye', 'Jasikan', 'Kadjebi', 'Guan'])
FROM ghana_regions WHERE name = 'Oti'
ON CONFLICT DO NOTHING;

-- SAVANNAH
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Bole', 'Sawla-Tuna-Kalba', 'Damongo', 'Daboya-Mankarigu', 'Salaga North', 'Salaga South', 'Yapei-Kusawgu'])
FROM ghana_regions WHERE name = 'Savannah'
ON CONFLICT DO NOTHING;

-- UPPER EAST
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Bolgatanga Central', 'Bolgatanga East', 'Chiana-Paga', 'Navrongo Central', 'Builsa North', 'Builsa South', 'Bawku Central', 'Binduri', 'Pusiga', 'Zebilla', 'Garu', 'Tempane', 'Talensi', 'Nabdam', 'Bongo'])
FROM ghana_regions WHERE name = 'Upper East'
ON CONFLICT DO NOTHING;

-- UPPER WEST
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Wa Central', 'Wa West', 'Wa East', 'Nadowli-Kaleo', 'Jirapa', 'Lambussie', 'Lawra', 'Nandom', 'Daffiama-Bussie-Issa', 'Sissala West', 'Sissala East'])
FROM ghana_regions WHERE name = 'Upper West'
ON CONFLICT DO NOTHING;

-- WESTERN
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Takoradi', 'Sekondi', 'Essikado-Ketan', 'Kwesimintsim', 'Effia', 'Ahanta West', 'Mpohor', 'Shama', 'Wassa East', 'Tarkwa-Nsuaem', 'Prestea Huni-Valley', 'Evalue-Ajomoro-Gwira', 'Ellembelle', 'Jomoro'])
FROM ghana_regions WHERE name = 'Western'
ON CONFLICT DO NOTHING;

-- WESTERN NORTH
INSERT INTO ghana_constituencies (region_id, name)
SELECT id, unnest(ARRAY['Sefwi-Wiawso', 'Sefwi Akontombra', 'Bodi', 'Juaboso', 'Bia West', 'Bia East', 'Bibiani-Anhwiaso-Bekwai', 'Aowin', 'Suaman'])
FROM ghana_regions WHERE name = 'Western North'
ON CONFLICT DO NOTHING;

-- 3. Populate Initial Inventory
INSERT INTO store_inventory (name, category, price_ghs, stock_quantity, status, image_emoji, brand_color) VALUES
('Official TBM Cap', 'Apparel', 45.00, 100, 'Stable', '🧢', '#2D5A27'),
('Movement Polo Shirt', 'Apparel', 85.00, 50, 'Stable', '👕', '#2D5A27'),
('Commemorative Badge', 'Accessories', 15.00, 200, 'Stable', '🏷️', '#B8860B'),
('The Base Water Bottle', 'Lifestyle', 35.00, 30, 'Low Stock', '🍶', '#2D5A27')
ON CONFLICT DO NOTHING;

-- 5. Populate Extended Countries
INSERT INTO countries (name, dialing_code, is_diaspora) VALUES
('Nigeria', '+234', true),
('Cote d''Ivoire', '+225', true),
('Togo', '+228', true),
('Liberia', '+231', true),
('Sierra Leone', '+232', true),
('Japan', '+81', true),
('China', '+86', true),
('Brazil', '+55', true)
ON CONFLICT DO NOTHING;

-- 6. Populate Initial Blog Posts
-- Note: author_id is omitted or set to NULL as it requires a valid user ID.
INSERT INTO blog_posts (title, slug, excerpt, content, category, is_featured, read_time, tags) VALUES
('The Future of Ghana: A Digital Movement', 'future-of-ghana-digital-movement', 'How we are leveraging technology to unite Ghanaians at home and abroad.', 'Technology is no longer just a tool; it is the platform upon which our new nation will be built...', 'Digital Strategy', true, '5 min', ARRAY['technology', 'ghana', 'future']),
('Regional Mobilization Success in Kumasi', 'regional-mobilization-kumasi', 'Highlights from our recent town hall meeting in the Ashanti region.', 'The turnout in Kumasi was unprecedented. Thousands of patriots gathered to discuss...', 'Events', false, '3 min', ARRAY['ashanti', 'kumasi', 'mobilization']),
('Building a Sustainable Diaspora Network', 'sustainable-diaspora-network', 'Connecting our global community for national development.', 'Our brothers and sisters abroad represent a significant portion of our intellectual capital...', 'Diaspora', false, '4 min', ARRAY['diaspora', 'global', 'network'])
ON CONFLICT (slug) DO NOTHING;

-- 7. Populate Initial Polls & Options
-- We use a CTE to ensure options are linked to the correct poll
WITH new_poll AS (
    INSERT INTO polls (question, status, region, end_date)
    VALUES ('What is the most critical issue for our digital strategy?', 'Active', 'National', now() + interval '30 days')
    RETURNING id
)
INSERT INTO poll_options (poll_id, label, votes)
SELECT id, unnest(ARRAY['Mobile App Access', 'Voter Registration System', 'Regional Connectivity', 'Digital Identity Cards']), 0
FROM new_poll;

WITH new_poll2 AS (
    INSERT INTO polls (question, status, region, end_date)
    VALUES ('Which region should host the next Youth Leadership Summit?', 'Active', 'National', now() + interval '14 days')
    RETURNING id
)
INSERT INTO poll_options (poll_id, label, votes)
SELECT id, unnest(ARRAY['Greater Accra', 'Ashanti', 'Northern', 'Western']), 0
FROM new_poll2;
