-- Private bucket for KYC document images. Owner-folder RLS: members manage only
-- their own {authId}/... objects; admins may read/write any (review + upload on behalf).
insert into storage.buckets (id, name, public)
values ('member-kyc', 'member-kyc', false)
on conflict (id) do nothing;

create policy "member_kyc_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'member-kyc'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

create policy "member_kyc_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'member-kyc'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

create policy "member_kyc_obj_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'member-kyc'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  )
  with check (
    bucket_id = 'member-kyc'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

create policy "member_kyc_obj_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-kyc'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );
