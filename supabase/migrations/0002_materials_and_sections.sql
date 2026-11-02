begin;

alter table public.topics
  add constraint topics_id_subject_owner_key unique (id, subject_id, owner_id);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  original_filename text not null,
  mime_type text not null,
  file_bytes bigint not null,
  storage_path text not null unique,
  subject_id uuid,
  topic_id uuid,
  status text not null default 'processing',
  warnings jsonb not null default '[]'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  constraint materials_id_owner_key unique (id, owner_id),
  constraint materials_title_valid check (
    char_length(title) between 1 and 200 and title !~ '^[[:space:]]|[[:space:]]$'
  ),
  constraint materials_filename_valid check (
    char_length(original_filename) between 1 and 255
    and original_filename !~ '^[[:space:]]|[[:space:]]$'
    and position('/' in original_filename) = 0
    and position(chr(92) in original_filename) = 0
  ),
  constraint materials_file_type_valid check (
    (mime_type = 'application/pdf' and original_filename ~* '\.pdf$')
    or (mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      and original_filename ~* '\.docx$')
  ),
  constraint materials_file_bytes_valid check (file_bytes between 1 and 5242880),
  constraint materials_storage_path_valid check (
    char_length(storage_path) between 1 and 1024
    and split_part(storage_path, '/', 1) = owner_id::text
    and storage_path ~ '^[^/]+/[^/]+/[^/]+$'
    and storage_path !~ '(^|/)\.{1,2}(/|$)'
    and position(chr(92) in storage_path) = 0
  ),
  constraint materials_status_valid check (status in ('processing', 'needs_review', 'ready', 'failed')),
  constraint materials_warnings_valid check (jsonb_typeof(warnings) = 'array'),
  constraint materials_error_valid check (
    (status = 'failed') = (error_code is not null)
    and (error_code is null or error_code ~ '^[A-Z][A-Z0-9_]{0,63}$')
  ),
  constraint materials_labels_valid check (topic_id is null or subject_id is not null),
  constraint materials_ready_labels check (status <> 'ready' or (subject_id is not null and topic_id is not null)),
  constraint materials_subject_owner_fkey foreign key (subject_id, owner_id)
    references public.subjects (id, owner_id),
  constraint materials_topic_subject_owner_fkey foreign key (topic_id, subject_id, owner_id)
    references public.topics (id, subject_id, owner_id)
);

create index materials_owner_created_idx on public.materials (owner_id, created_at desc);

create table public.material_sections (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null,
  owner_id uuid not null,
  section_order integer not null check (section_order > 0),
  text text not null check (char_length(text) <= 200000),
  reference jsonb not null,
  eligible_for_generation boolean not null default false,
  constraint material_sections_material_owner_fkey foreign key (material_id, owner_id)
    references public.materials (id, owner_id) on delete cascade,
  constraint material_sections_order_key unique (material_id, section_order),
  constraint material_sections_reference_valid check (coalesce(
    jsonb_typeof(reference) = 'object' and (
      (jsonb_typeof(reference -> 'page') = 'number'
        and (reference ->> 'page') ~ '^[1-9][0-9]*$'
        and not (reference ? 'paragraph'))
      or
      (jsonb_typeof(reference -> 'paragraph') = 'number'
        and (reference ->> 'paragraph') ~ '^[1-9][0-9]*$'
        and reference ->> 'kind' = 'extracted-paragraph'
        and not (reference ? 'page'))
    ), false
  ))
);

alter table public.materials enable row level security;
alter table public.material_sections enable row level security;

revoke all on table public.materials, public.material_sections from public, anon, authenticated;
grant select on table public.materials, public.material_sections to authenticated;
grant select, insert, update, delete on table public.materials, public.material_sections to service_role;

create policy materials_select_own
  on public.materials for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy material_sections_select_own
  on public.material_sections for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Storage files are removed by the future deletion service, never by SQL cascades.
commit;
