insert into public.site_settings (key, value, updated_at)
values ('hero_bg_url', '/branding/hero-background-image.webp', now())
on conflict (key)
do update set
  value = excluded.value,
  updated_at = excluded.updated_at;
