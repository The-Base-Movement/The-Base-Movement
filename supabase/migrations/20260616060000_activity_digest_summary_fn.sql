-- 7-day activity rollup for the weekly #notifications "week in review" digest.
-- Service-role only; the activity-digest edge function calls it.
create or replace function public.activity_digest_summary()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'registrations', jsonb_build_object(
      'total',    (select count(*) from users where joined_at > now() - interval '7 days' and deleted_at is null),
      'ghana',    (select count(*) from users where joined_at > now() - interval '7 days' and deleted_at is null and platform = 'GHANA'),
      'diaspora', (select count(*) from users where joined_at > now() - interval '7 days' and deleted_at is null and platform = 'DIASPORA')
    ),
    'donations', jsonb_build_object(
      'count',          (select count(*) from donations where created_at > now() - interval '7 days'),
      'verified_total', (select coalesce(sum(amount), 0) from donations where created_at > now() - interval '7 days' and status = 'Verified')
    ),
    'store_orders', jsonb_build_object(
      'count',      (select count(*) from store_orders where created_at > now() - interval '7 days'),
      'paid_total', (select coalesce(sum(total_amount), 0) from store_orders where created_at > now() - interval '7 days' and payment_status = 'Paid')
    ),
    'blog_posts_published', (select count(*) from blog_posts where published_at > now() - interval '7 days' and deleted_at is null),
    'newsletters', jsonb_build_object(
      'sent',       (select count(*) from newsletters where sent_at > now() - interval '7 days' and status = 'sent'),
      'recipients', (select coalesce(sum(recipient_count), 0) from newsletters where sent_at > now() - interval '7 days' and status = 'sent')
    )
  );
$$;

revoke execute on function public.activity_digest_summary() from public;
grant execute on function public.activity_digest_summary() to service_role;
