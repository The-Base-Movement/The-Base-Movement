-- Per-tier accent colour so the public leader profile can colour-code every
-- tier from data instead of a hardcoded index map. Stored as a full CSS colour
-- (design-system token) so it stays theme-aware.
alter table public.party_tiers add column if not exists accent_color text;

update public.party_tiers set accent_color = 'hsl(var(--destructive))' where name = 'committee' and accent_color is null;
update public.party_tiers set accent_color = 'hsl(var(--accent))'      where name = 'executive' and accent_color is null;
update public.party_tiers set accent_color = 'hsl(var(--primary))'     where name = 'regional'  and accent_color is null;
update public.party_tiers set accent_color = 'hsl(var(--on-surface))'  where name = 'base'      and accent_color is null;

-- Any other / future tier defaults to brand green.
update public.party_tiers set accent_color = 'hsl(var(--primary))' where accent_color is null;
