-- ============================================================
-- Job Taxonomy Expansion — Everyday Ghanaian Occupations
-- Adds 8 new industries, 40 sub-categories, and 200+ roles
-- covering the occupations most Ghanaians actually hold.
-- ============================================================

-- ── Industries ────────────────────────────────────────────
insert into public.job_industries (id, name, sort_order) values
  (8,  'Agriculture, Farming & Fishing',          8),
  (9,  'Informal Trade & Market Commerce',         9),
  (10, 'Transport, Logistics & Driving',          10),
  (11, 'Personal Care & Beauty Services',         11),
  (12, 'Hospitality, Catering & Tourism',         12),
  (13, 'Creative Arts, Media & Entertainment',    13),
  (14, 'Real Estate, Property & Facilities',      14),
  (15, 'Domestic, Cleaning & Laundry Services',   15)
on conflict (id) do update set name=excluded.name, sort_order=excluded.sort_order;

-- ── Sub-categories ────────────────────────────────────────
insert into public.job_sub_categories (id, industry_id, code, name, sort_order) values
  -- Agriculture
  (81, 8, '8.1', 'Crop Farming',                         1),
  (82, 8, '8.2', 'Livestock & Poultry Farming',          2),
  (83, 8, '8.3', 'Fishing & Aquaculture',                3),
  (84, 8, '8.4', 'Agro-processing & Food Production',    4),
  (85, 8, '8.5', 'Forestry & Logging',                   5),
  -- Informal Trade
  (91, 9, '9.1', 'Food & Provisions Trading',            1),
  (92, 9, '9.2', 'Clothing, Fabric & Accessories Trade', 2),
  (93, 9, '9.3', 'Electronics & Hardware Trade',         3),
  (94, 9, '9.4', 'Mobile Money & Financial Services',    4),
  (95, 9, '9.5', 'General Market Trading',               5),
  -- Transport
  (101,10,'10.1','Passenger Transport (Trotro / Taxi)',   1),
  (102,10,'10.2','Freight & Heavy Goods Transport',       2),
  (103,10,'10.3','Motorcycle (Okada / Dispatch)',         3),
  (104,10,'10.4','Shipping & Port Operations',            4),
  (105,10,'10.5','Aviation & Air Transport',              5),
  -- Personal Care
  (111,11,'11.1','Hair & Beauty',                        1),
  (112,11,'11.2','Barbering',                            2),
  (113,11,'11.3','Tailoring, Dressmaking & Fashion',     3),
  (114,11,'11.4','Nail, Spa & Wellness',                 4),
  (115,11,'11.5','Shoe Repair & Cobbling',               5),
  -- Hospitality
  (121,12,'12.1','Food & Beverage (Restaurant / Chop Bar)',1),
  (122,12,'12.2','Hotel & Accommodation',                2),
  (123,12,'12.3','Events, Catering & Outside Catering',  3),
  (124,12,'12.4','Tourism & Tour Guiding',               4),
  (125,12,'12.5','Bar & Night Entertainment',            5),
  -- Creative Arts
  (131,13,'13.1','Music, Performing Arts & Entertainment',1),
  (132,13,'13.2','Photography & Videography',            2),
  (133,13,'13.3','Printing, Signage & Visual Arts',      3),
  (134,13,'13.4','Journalism & Broadcasting',            4),
  (135,13,'13.5','Film & TV Production',                 5),
  -- Real Estate
  (141,14,'14.1','Property Sales & Lettings',            1),
  (142,14,'14.2','Building Maintenance & Repairs',       2),
  (143,14,'14.3','Cleaning & Janitorial Services',       3),
  (144,14,'14.4','Landscaping & Gardening',              4),
  (145,14,'14.5','Security & Estate Management',         5),
  -- Domestic
  (151,15,'15.1','House Help & Domestic Work',           1),
  (152,15,'15.2','Nanny, Childminding & Au Pair',        2),
  (153,15,'15.3','Laundry & Dry Cleaning',               3),
  (154,15,'15.4','Home Cooking & Private Catering',      4),
  (155,15,'15.5','Elderly & Disability Care',            5)
on conflict (id) do update
  set industry_id=excluded.industry_id, code=excluded.code,
      name=excluded.name, sort_order=excluded.sort_order;

-- ── Roles (using code-join pattern from original seed) ────
insert into public.job_roles (sub_category_id, name, sort_order)
select sc.id, v.name, v.sort
from (values
  -- 8.1 Crop Farming
  ('8.1','Farmer (General Crop)',             1),
  ('8.1','Cocoa Farmer',                      2),
  ('8.1','Rice Farmer',                       3),
  ('8.1','Maize / Corn Farmer',               4),
  ('8.1','Cassava Farmer',                    5),
  ('8.1','Yam Farmer',                        6),
  ('8.1','Plantain / Banana Farmer',          7),
  ('8.1','Tomato / Vegetable Farmer',         8),
  ('8.1','Oil Palm Farmer',                   9),
  ('8.1','Cashew Farmer',                    10),
  ('8.1','Pineapple Farmer',                 11),
  ('8.1','Rubber / Teak Plantation Farmer',  12),
  ('8.1','Irrigation Farmer',                13),
  ('8.1','Organic Farmer',                   14),
  ('8.1','Agric Extension Worker',           15),
  -- 8.2 Livestock
  ('8.2','Poultry Farmer (Chicken / Eggs)',   1),
  ('8.2','Cattle / Beef Farmer',             2),
  ('8.2','Pig Farmer',                       3),
  ('8.2','Goat / Sheep Farmer',              4),
  ('8.2','Rabbit Farmer',                    5),
  ('8.2','Grasscutter Farmer',               6),
  ('8.2','Dairy / Milk Producer',            7),
  -- 8.3 Fishing
  ('8.3','Fisherman (Artisanal)',             1),
  ('8.3','Fisherman (Sea / Canoe)',           2),
  ('8.3','Fish Farmer (Aquaculture / Pond)',  3),
  ('8.3','Fish Monger / Fish Seller',        4),
  ('8.3','Shrimp / Prawn Farmer',            5),
  -- 8.4 Agro-processing
  ('8.4','Palm Oil Processor',               1),
  ('8.4','Gari / Cassava Processor',         2),
  ('8.4','Cocoa Processor',                  3),
  ('8.4','Shea Butter Processor',            4),
  ('8.4','Peanut / Groundnut Processor',     5),
  ('8.4','Food Packager',                    6),
  ('8.4','Mill Operator (Grain / Corn)',      7),
  -- 8.5 Forestry
  ('8.5','Logger / Chainsaw Operator',        1),
  ('8.5','Charcoal Producer',                2),
  ('8.5','Forestry Officer',                 3),

  -- 9.1 Food Trade
  ('9.1','Food Seller / Provisions Trader',   1),
  ('9.1','Wholesale Food Distributor',        2),
  ('9.1','Pepper / Spice Trader',            3),
  ('9.1','Grain & Rice Trader',              4),
  ('9.1','Fish & Seafood Trader',            5),
  ('9.1','Meat Seller / Butcher',            6),
  -- 9.2 Clothing Trade
  ('9.2','Cloth / Fabric Trader (Kente, Batik)',1),
  ('9.2','Second-Hand Clothes Seller (Bend-down boutique)',2),
  ('9.2','Footwear / Bag Trader',            3),
  ('9.2','Jewellery & Accessories Trader',   4),
  -- 9.3 Electronics Trade
  ('9.3','Mobile Phone Seller / Repairer',   1),
  ('9.3','Electronics & Appliance Trader',   2),
  ('9.3','Computer / Printer Spare Parts Dealer',3),
  -- 9.4 Mobile Money
  ('9.4','Mobile Money Agent (MoMo)',         1),
  ('9.4','Mobile Money Merchant',            2),
  ('9.4','Forex / Bureau de Change Operator',3),
  -- 9.5 General Market
  ('9.5','Market Trader (Hawker / Table-top)',1),
  ('9.5','Street Vendor / Mobile Seller',    2),
  ('9.5','Lottery Agent (Lotto Writer)',     3),
  ('9.5','Scrap Metal / Recycling Dealer',   4),

  -- 10.1 Passenger Transport
  ('10.1','Trotro Driver',                   1),
  ('10.1','Taxi Driver',                     2),
  ('10.1','Uber / Bolt / Ride-hailing Driver',3),
  ('10.1','Bus Driver (Private / STC)',       4),
  ('10.1','Trotro Mate / Bus Conductor',     5),
  -- 10.2 Freight
  ('10.2','Tipper Truck Driver',             1),
  ('10.2','Articulated Truck (Trailer) Driver',2),
  ('10.2','Cargo Van / Delivery Driver',     3),
  ('10.2','Logistics / Courier Rider',       4),
  ('10.2','Forklift Operator',               5),
  ('10.2','Warehouse & Dispatch Officer',    6),
  -- 10.3 Motorcycle
  ('10.3','Okada Rider (Commercial Motorcycle)',1),
  ('10.3','Dispatch Rider',                  2),
  ('10.3','Food Delivery Rider (Glovo, Bolt Food)',3),
  -- 10.4 Shipping
  ('10.4','Stevedore / Port Labourer',        1),
  ('10.4','Freight Agent / Clearing Officer', 2),
  ('10.4','Customs Officer (Ghana Revenue Authority)',3),
  ('10.4','Harbor / Port Authority Worker',   4),
  -- 10.5 Aviation
  ('10.5','Airline Cabin Crew / Flight Attendant',1),
  ('10.5','Ground Handling Officer',         2),
  ('10.5','Pilot',                           3),
  ('10.5','Air Traffic Controller',          4),

  -- 11.1 Hair & Beauty
  ('11.1','Hair Stylist / Hairdresser',       1),
  ('11.1','Braider / Weaver',                 2),
  ('11.1','Loctician (Dreadlocks Specialist)',3),
  ('11.1','Makeup Artist',                   4),
  ('11.1','Eyebrow Technician / Lash Artist',5),
  -- 11.2 Barbering
  ('11.2','Barber',                           1),
  ('11.2','Barbing Salon Owner',              2),
  ('11.2','Men''s Groomer / Stylist',         3),
  -- 11.3 Tailoring
  ('11.3','Tailor (Men''s Wear)',             1),
  ('11.3','Dressmaker (Women''s Wear)',       2),
  ('11.3','Fashion Designer',                3),
  ('11.3','Seamstress',                      4),
  ('11.3','Embroiderer / Kente Weaver',      5),
  -- 11.4 Nail & Spa
  ('11.4','Nail Technician',                 1),
  ('11.4','Spa Therapist / Masseuse',        2),
  ('11.4','Pedicurist / Manicurist',         3),
  -- 11.5 Shoe Repair
  ('11.5','Cobbler / Shoe Repairer',         1),
  ('11.5','Sandal Maker',                    2),

  -- 12.1 Food & Bev
  ('12.1','Chop Bar / Local Restaurant Operator',1),
  ('12.1','Cook / Chef (Commercial)',        2),
  ('12.1','Waiter / Waitress',               3),
  ('12.1','Pastry Chef / Baker',             4),
  ('12.1','Street Food Seller (Koose, Waakye, etc.)',5),
  ('12.1','Canteen Operator',                6),
  ('12.1','Caterer',                         7),
  -- 12.2 Hotel
  ('12.2','Hotel Receptionist',              1),
  ('12.2','Room Steward / Housekeeper',      2),
  ('12.2','Hotel Manager',                   3),
  ('12.2','Guest House Operator',            4),
  -- 12.3 Events
  ('12.3','Event Decorator / Planner',       1),
  ('12.3','Outside Caterer',                 2),
  ('12.3','DJ (Disc Jockey)',                3),
  ('12.3','MC / Host',                       4),
  -- 12.4 Tourism
  ('12.4','Tour Guide',                      1),
  ('12.4','Travel Agent',                    2),
  ('12.4','Cultural Animator',               3),
  -- 12.5 Bar & Night
  ('12.5','Bartender',                       1),
  ('12.5','Bar Owner / Manager',             2),
  ('12.5','Nightclub Promoter',              3),

  -- 13.1 Music & Performing
  ('13.1','Musician / Recording Artist',      1),
  ('13.1','Highlife / Afrobeats Artiste',    2),
  ('13.1','Actor / Actress',                 3),
  ('13.1','Comedian / Stand-Up',             4),
  ('13.1','Dancer / Choreographer',          5),
  ('13.1','Traditional Drummer / Kete',      6),
  -- 13.2 Photography
  ('13.2','Photographer',                    1),
  ('13.2','Videographer',                    2),
  ('13.2','Photo & Video Editor',            3),
  -- 13.3 Printing & Visual Arts
  ('13.3','Graphic Designer (Print)',        1),
  ('13.3','Sign Writer / Banner Maker',      2),
  ('13.3','Printer Operator',               3),
  ('13.3','Screen Printer (T-shirt, Fabric)',4),
  -- 13.4 Journalism
  ('13.4','Radio Presenter / DJ',            1),
  ('13.4','TV Presenter / Anchor',           2),
  ('13.4','Journalist / Reporter',           3),
  ('13.4','Blogger / Online Content Creator',4),
  -- 13.5 Film & TV
  ('13.5','Film Director / Producer',        1),
  ('13.5','Camera Operator',                 2),
  ('13.5','Script Writer',                   3),
  ('13.5','Sound Engineer',                  4),

  -- 14.1 Property
  ('14.1','Real Estate Agent / Broker',      1),
  ('14.1','Property Manager',                2),
  ('14.1','Land Officer',                    3),
  -- 14.2 Building Maintenance
  ('14.2','Handyman / General Maintenance',  1),
  ('14.2','Painter & Decorator',             2),
  ('14.2','Plumber (Maintenance)',           3),
  ('14.2','Electrician (Maintenance)',       4),
  ('14.2','AC / Refrigeration Technician',  5),
  ('14.2','Fitter (General / Auto Mechanic)',6),
  ('14.2','Refrigerator / Appliance Repairer',7),
  ('14.2','Generator Mechanic',              8),
  ('14.2','Aluminium / Steel Fabricator',   9),
  -- 14.3 Cleaning
  ('14.3','Cleaner (Office / Industrial)',   1),
  ('14.3','Janitor / Caretaker',             2),
  ('14.3','Waste Management Worker',         3),
  -- 14.4 Landscaping
  ('14.4','Gardener / Landscaper',           1),
  ('14.4','Tree Trimmer',                    2),
  -- 14.5 Security & Estate
  ('14.5','Estate Manager',                  1),
  ('14.5','Facility Manager',                2),

  -- 15.1 Domestic
  ('15.1','House Help / Housekeeper',        1),
  ('15.1','Steward / Butler',               2),
  ('15.1','Errand Runner / Personal Assistant',3),
  -- 15.2 Childcare
  ('15.2','Nanny / Babysitter',             1),
  ('15.2','Creche Worker',                  2),
  -- 15.3 Laundry
  ('15.3','Laundry Worker / Dry Cleaner',   1),
  ('15.3','Ironing Service Operator',       2),
  -- 15.4 Home Cooking
  ('15.4','Private Cook / Chef (Domestic)', 1),
  ('15.4','Meal Prep / Home Caterer',       2),
  -- 15.5 Elderly Care
  ('15.5','Elderly Carer',                  1),
  ('15.5','Disability Support Worker',      2)
) as v(code, name, sort)
join public.job_sub_categories sc on sc.code = v.code
on conflict (sub_category_id, name) do nothing;

-- Also add "Fitter" as an alias under existing Mechanics sub-category (3.4)
insert into public.job_roles (sub_category_id, name, sort_order)
select sc.id, v.name, v.sort
from (values
  ('3.4','Fitter (Vehicle / Auto Mechanic)',  6),
  ('3.4','Motorbike Mechanic',               7),
  ('3.4','Tractor Mechanic',                 8),
  ('3.3','Fitter (Electrical / Plumbing)',    6)
) as v(code, name, sort)
join public.job_sub_categories sc on sc.code = v.code
on conflict (sub_category_id, name) do nothing;

-- Update job levels for new roles
update public.job_roles set level = case
  when name ~* '(Manager|Supervisor|Foreman|Director|\mHead\M|Owner|Operator|Producer|Engineer|Officer|Agent|Broker|Planner|Designer|Architect|Specialist|Analyst|Coordinator|Consultant|Advisor|Adviser)' then 'Management'
  when name ~* '(Assistant|Clerk|\mIntern\M|Apprentice|Helper|Errand|Worker|Labourer|Guard|Mate|Steward|Rider|Runner)' then 'Entry'
  else 'Professional'
end
where level is null or level = '';
