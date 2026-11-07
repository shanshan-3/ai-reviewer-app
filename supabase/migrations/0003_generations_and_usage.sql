begin;

-- Campus usage accounting/admission remains deferred; this migration defines generation records.
create table public.quiz_generations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid not null,
  source_kind text not null check (source_kind in ('module', 'topic')),
  material_id uuid,
  subject_id uuid not null,
  topic_id uuid not null,
  question_type text not null default 'conceptual'
    check (question_type in ('conceptual', 'coding_syntax')),
  requested_question_count integer not null default 10 check (requested_question_count in (5, 10)),
  starting_difficulty text not null default 'medium'
    check (starting_difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'insufficient_source', 'failed')),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_generations_id_owner_key unique (id, owner_id),
  constraint quiz_generations_request_key unique (owner_id, request_id),
  constraint quiz_generations_source_valid check ((source_kind = 'module') = (material_id is not null)),
  constraint quiz_generations_error_valid check (
    ((status in ('failed', 'insufficient_source')) = (error_code is not null))
    and (error_code is null or error_code ~ '^[A-Z][A-Z0-9_]{0,63}$')
  ),
  constraint quiz_generations_material_owner_fkey foreign key (material_id, owner_id)
    references public.materials (id, owner_id) on delete cascade,
  constraint quiz_generations_topic_owner_fkey foreign key (topic_id, subject_id, owner_id)
    references public.topics (id, subject_id, owner_id)
);

create index quiz_generations_material_idx on public.quiz_generations (material_id, owner_id);
create index quiz_generations_owner_created_idx on public.quiz_generations (owner_id, created_at desc);

create function public.guard_quiz_generation()
returns trigger language plpgsql set search_path = '' as $$
declare
  source public.materials%rowtype;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'processing' then raise exception 'GENERATION_MUST_START_PROCESSING'; end if;
  else
    if old.status <> 'processing' then raise exception 'GENERATION_TERMINAL'; end if;
    if row(new.id, new.owner_id, new.request_id, new.source_kind, new.material_id,
      new.subject_id, new.topic_id, new.question_type, new.requested_question_count,
      new.starting_difficulty, new.created_at) is distinct from
      row(old.id, old.owner_id, old.request_id, old.source_kind, old.material_id,
      old.subject_id, old.topic_id, old.question_type, old.requested_question_count,
      old.starting_difficulty, old.created_at) then
      raise exception 'GENERATION_INPUT_IMMUTABLE';
    end if;
    new.updated_at := now();
  end if;

  if new.material_id is not null and (tg_op = 'INSERT' or new.status = 'ready') then
    -- Serialize publication with the existing module deletion/approval row lock.
    select * into source from public.materials
      where id = new.material_id and owner_id = new.owner_id for share;
    if not found or source.status <> 'ready' or source.cleanup_pending then
      raise exception 'MODULE_NOT_READY';
    end if;
    if row(source.subject_id, source.topic_id) is distinct from row(new.subject_id, new.topic_id)
      or not exists (select 1 from public.material_sections where material_id = source.id
        and owner_id = new.owner_id and eligible_for_generation and text ~ '[[:alnum:]]') then
      raise exception 'INVALID_GENERATION_SOURCE';
    end if;
  end if;
  return new;
end;
$$;

create trigger quiz_generations_guard before insert or update on public.quiz_generations
  for each row execute function public.guard_quiz_generation();

alter table public.quiz_generations enable row level security;
revoke all on table public.quiz_generations from public, anon, authenticated;
grant select, insert, update, delete on table public.quiz_generations to service_role;
revoke all on function public.guard_quiz_generation() from public, anon, authenticated;
grant execute on function public.guard_quiz_generation() to service_role;

commit;
