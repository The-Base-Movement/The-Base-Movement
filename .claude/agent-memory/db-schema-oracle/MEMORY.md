# Memory Index

- [users-table-schema-and-drift](schema_users_table.md) — full users column list (no registration_source column) and TS↔DB drift in User interface
- [users-table-rls-policies](rls_users_table.md) — RLS on public.users: members see only own row; chapter-leader read is constituency-scoped, not chapter-scoped; INSERT is public
- [mobilization-ledger-schema](schema_mobilization_ledger.md) — mobilization_ledger columns, no FKs, RLS: SuperAdmin-only writes, regional admin SELECT scoped by chapter
- [avatar-storage-conventions-and-drift](schema_avatar_storage.md) — avatars bucket, full URL in users.avatar_url, naming drift between code and live rows; chapter_leaders.image_url is Unsplash seed data
- [blog-posts-table-and-no-engagement-infra](schema_blog_posts.md) — blog_posts column list; no likes/reactions/comments/views tables or counters exist (as of 2026-05-29)
- [job-applications-schema-and-missing-fk](schema_job_applications.md) — job_applications.member_id has no FK, breaking PostgREST embeds; no profiles table exists; RLS uses is_admin()
- [donation-campaigns-schema-and-missing-write-rls](schema_donation_campaigns.md) — donation_campaigns has only a public SELECT policy; all INSERT/UPDATE/DELETE return 403
