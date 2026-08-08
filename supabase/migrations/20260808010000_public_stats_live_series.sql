-- get_public_stats(): return real 12-week trend series for the home
-- "Movement at a glance" sparklines, which until now were hardcoded arrays
-- in StatsSection.tsx.
--
-- Each series is the CUMULATIVE total at the end of each of the last 12 weeks,
-- which is what a sparkline under a running total should show. Regions are
-- matched against the canonical ghana_regions list rather than counted as
-- distinct user-entered strings — casing variants ("EASTERN", "Eastern region")
-- would otherwise push the count past Ghana's 16 regions.
--
-- Supersedes 20260808000000_public_stats_live_deltas.sql; the 30-day delta
-- counts added there are carried forward unchanged.
CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  ghana_count     bigint := 0;
  diaspora_count  bigint := 0;
  chapters_count  bigint := 0;
  regions_count   bigint := 0;
  countries_count bigint := 0;
  ghana_delta     bigint := 0;
  diaspora_delta  bigint := 0;
  series          json;
begin
  -- Only fully-verified members are counted publicly.
  select count(*) into ghana_count
  from users
  where lower(platform) = 'ghana'
    and deleted_at is null
    and verification_status in ('Approved','Verified');

  select count(*) into diaspora_count
  from users
  where lower(platform) = 'diaspora'
    and deleted_at is null
    and verification_status in ('Approved','Verified');

  select count(*) into chapters_count from chapters;
  select count(*) into regions_count  from ghana_regions;

  -- Distinct countries among verified DIASPORA members only.
  select count(distinct upper(trim(country))) into countries_count
  from users
  where lower(platform) = 'diaspora'
    and deleted_at is null
    and verification_status in ('Approved','Verified')
    and country is not null and trim(country) <> '';

  -- Verified joins in the trailing 30 days, per platform.
  select count(*) into ghana_delta
  from users
  where lower(platform) = 'ghana'
    and deleted_at is null
    and verification_status in ('Approved','Verified')
    and joined_at >= now() - interval '30 days';

  select count(*) into diaspora_delta
  from users
  where lower(platform) = 'diaspora'
    and deleted_at is null
    and verification_status in ('Approved','Verified')
    and joined_at >= now() - interval '30 days';

  -- Cumulative totals at each of the last 12 week boundaries.
  with bounds as (
    select gs.i,
           date_trunc('week', now()) + interval '1 week'
             - ((11 - gs.i) || ' weeks')::interval as cutoff
    from generate_series(0, 11) as gs(i)
  ),
  agg as (
    select b.i,
      count(*) filter (where lower(u.platform) = 'ghana')    as members,
      count(*) filter (where lower(u.platform) = 'diaspora') as diaspora,
      count(distinct upper(trim(u.country))) filter (
        where lower(u.platform) = 'diaspora'
          and coalesce(trim(u.country), '') <> '')           as countries,
      (select count(*) from ghana_regions r
        where exists (
          select 1 from users u2
          where u2.deleted_at is null
            and u2.verification_status in ('Approved','Verified')
            and lower(u2.platform) = 'ghana'
            and trim(u2.region) = r.name
            and u2.joined_at < b.cutoff))                    as regions
    from bounds b
    left join users u
      on u.deleted_at is null
     and u.verification_status in ('Approved','Verified')
     and u.joined_at < b.cutoff
    group by b.i, b.cutoff
  )
  select json_build_object(
    'members',   coalesce(json_agg(members   order by i), '[]'::json),
    'diaspora',  coalesce(json_agg(diaspora  order by i), '[]'::json),
    'countries', coalesce(json_agg(countries order by i), '[]'::json),
    'regions',   coalesce(json_agg(regions   order by i), '[]'::json)
  ) into series
  from agg;

  return json_build_object(
    'members',   ghana_count,
    'diaspora',  diaspora_count,
    'chapters',  chapters_count,
    'regions',   coalesce(nullif(regions_count, 0), 16),
    'countries', countries_count,
    'members_delta_30d',  ghana_delta,
    'diaspora_delta_30d', diaspora_delta,
    'members_series',   series -> 'members',
    'diaspora_series',  series -> 'diaspora',
    'countries_series', series -> 'countries',
    'regions_series',   series -> 'regions'
  );
end;
$function$;
