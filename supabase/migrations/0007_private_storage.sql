begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'modules', 'modules', false, 5242880,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- Stop rather than change the access or limits of an existing bucket.
do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'modules' and public = false and file_size_limit = 5242880
      and allowed_mime_types @> array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      and cardinality(allowed_mime_types) = 2
  ) then
    raise exception 'Existing modules bucket settings differ; inspect before applying this migration';
  end if;
end;
$$;

create policy modules_select_own
  on storage.objects for select to authenticated
  using (bucket_id = 'modules' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy modules_insert_own
  on storage.objects for insert to authenticated
  with check (bucket_id = 'modules' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy modules_update_own
  on storage.objects for update to authenticated
  using (bucket_id = 'modules' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'modules' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy modules_delete_own
  on storage.objects for delete to authenticated
  using (bucket_id = 'modules' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
