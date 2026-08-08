-- Migration: add logo_url column to political_parties table and update party logos
ALTER TABLE public.political_parties ADD COLUMN IF NOT EXISTS logo_url text;

-- Update logo_url for all 10 Ghana political parties
UPDATE public.political_parties SET logo_url = '/party-affiliations/New_Patriotic_Party_-_NPP.jpeg' WHERE code = 'NPP';
UPDATE public.political_parties SET logo_url = '/party-affiliations/Great_Consolidated_Popular_Party_-_GCPP.jpeg' WHERE code = 'GCPP';
UPDATE public.political_parties SET logo_url = '/party-affiliations/Ghana_Freedom_Party.jpeg' WHERE code = 'GFP';
UPDATE public.political_parties SET logo_url = '/party-affiliations/Ghana_Union_Movement_-_GUM.jpeg' WHERE code = 'GUM';
UPDATE public.political_parties SET logo_url = '/party-affiliations/Liberal_Party_of_Ghana_-_LPG.jpeg' WHERE code = 'LPG';
UPDATE public.political_parties SET logo_url = '/party-affiliations/National_Democratic_Party_-_NDP.jpeg' WHERE code = 'NDP';
UPDATE public.political_parties SET logo_url = '/party-affiliations/Convention_Peoples_Party.jpeg' WHERE code = 'CPP';
UPDATE public.political_parties SET logo_url = '/party-affiliations/National_Democratic_Congress_-_NDC.jpeg' WHERE code = 'NDC';
UPDATE public.political_parties SET logo_url = '/party-affiliations/All_Peoples_Congress_-_APC.jpeg' WHERE code = 'APC';
UPDATE public.political_parties SET logo_url = '/party-affiliations/The_New_Force_-_NF.jpeg' WHERE code = 'NF';
