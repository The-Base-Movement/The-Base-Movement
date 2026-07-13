-- Migration: Add missing constituencies for Northern and Western regions
INSERT INTO public.ghana_constituencies (region_id, name) VALUES
( (SELECT id FROM public.ghana_regions WHERE name = 'Northern'), 'Tatale-Sanguli' ),
( (SELECT id FROM public.ghana_regions WHERE name = 'Northern'), 'Tolon' ),
( (SELECT id FROM public.ghana_regions WHERE name = 'Northern'), 'Zabzugu' ),
( (SELECT id FROM public.ghana_regions WHERE name = 'Western'), 'Amenfi Central' ),
( (SELECT id FROM public.ghana_regions WHERE name = 'Western'), 'Amenfi East' ),
( (SELECT id FROM public.ghana_regions WHERE name = 'Western'), 'Amenfi West' )
ON CONFLICT DO NOTHING;
