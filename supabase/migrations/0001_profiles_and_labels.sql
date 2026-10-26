begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint subjects_name_valid check (
    char_length(name) between 1 and 120
    and name !~ '^[[:space:]]|[[:space:]]$'
  ),
  constraint subjects_id_owner_key unique (id, owner_id)
);

create unique index subjects_owner_name_key
  on public.subjects (owner_id, lower(name));

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint topics_name_valid check (
    char_length(name) between 1 and 120
    and name !~ '^[[:space:]]|[[:space:]]$'
  ),
  constraint topics_subject_owner_fkey foreign key (subject_id, owner_id)
    references public.subjects (id, owner_id) on delete cascade
);

create unique index topics_owner_subject_name_key
  on public.topics (owner_id, subject_id, lower(name));

alter table public.subjects enable row level security;
alter table public.topics enable row level security;

revoke all on table public.subjects, public.topics from public, anon, authenticated;
grant select, delete on table public.subjects, public.topics to authenticated;
grant insert (owner_id, name) on table public.subjects to authenticated;
grant insert (owner_id, subject_id, name) on table public.topics to authenticated;
grant update (name) on table public.subjects, public.topics to authenticated;
grant select, insert, update, delete on table public.subjects, public.topics to service_role;

create policy subjects_select_own
  on public.subjects for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy subjects_insert_own
  on public.subjects for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy subjects_update_own
  on public.subjects for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy subjects_delete_own
  on public.subjects for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy topics_select_own
  on public.topics for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy topics_insert_own
  on public.topics for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy topics_update_own
  on public.topics for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy topics_delete_own
  on public.topics for delete to authenticated
  using ((select auth.uid()) = owner_id);

commit;
