begin;

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  generation_id uuid not null unique,
  question_count integer not null check (question_count between 1 and 10),
  provider text not null check (provider = 'groq'),
  model text not null check (length(btrim(model)) > 0),
  created_at timestamptz not null default now(),
  constraint quizzes_id_owner_key unique (id, owner_id),
  constraint quizzes_id_owner_count_key unique (id, owner_id, question_count),
  constraint quizzes_generation_owner_fkey foreign key (generation_id, owner_id)
    references public.quiz_generations (id, owner_id) on delete cascade
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  quiz_id uuid not null,
  pool_position integer not null check (pool_position > 0),
  prompt text not null check (length(btrim(prompt)) > 0),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  code text,
  code_language text,
  option_a text not null check (length(btrim(option_a)) > 0),
  option_b text not null check (length(btrim(option_b)) > 0),
  option_c text not null check (length(btrim(option_c)) > 0),
  option_d text not null check (length(btrim(option_d)) > 0),
  correct_option_id text not null check (correct_option_id in ('a', 'b', 'c', 'd')),
  explanation text not null check (length(btrim(explanation)) > 0),
  constraint quiz_questions_options_distinct check (
    btrim(option_a) <> btrim(option_b) and btrim(option_a) <> btrim(option_c)
    and btrim(option_a) <> btrim(option_d) and btrim(option_b) <> btrim(option_c)
    and btrim(option_b) <> btrim(option_d) and btrim(option_c) <> btrim(option_d)
  ),
  constraint quiz_questions_code_valid check (
    (code is null and code_language is null)
    or (code is not null and code_language is not null
      and length(btrim(code)) > 0 and length(btrim(code_language)) > 0)
  ),
  constraint quiz_questions_pool_key unique (quiz_id, pool_position),
  constraint quiz_questions_id_quiz_owner_key unique (id, quiz_id, owner_id),
  constraint quiz_questions_answer_key unique (id, quiz_id, owner_id, difficulty, correct_option_id),
  constraint quiz_questions_quiz_owner_fkey foreign key (quiz_id, owner_id)
    references public.quizzes (id, owner_id) on delete cascade
);

alter table public.material_sections add constraint material_sections_id_owner_key unique (id, owner_id);

create table public.quiz_question_sources (
  question_id uuid not null,
  quiz_id uuid not null,
  owner_id uuid not null,
  section_id uuid not null,
  reference jsonb not null check (jsonb_typeof(reference) = 'object'),
  excerpt text not null check (length(btrim(excerpt)) > 0),
  primary key (question_id, section_id),
  constraint quiz_question_sources_question_fkey foreign key (question_id, quiz_id, owner_id)
    references public.quiz_questions (id, quiz_id, owner_id) on delete cascade,
  constraint quiz_question_sources_section_fkey foreign key (section_id, owner_id)
    references public.material_sections (id, owner_id) on delete cascade
);
create index quiz_question_sources_section_idx on public.quiz_question_sources (section_id, owner_id);

create function public.guard_quiz_question_source()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.material_sections s
    join public.quizzes q on q.id = new.quiz_id and q.owner_id = new.owner_id
    join public.quiz_generations g on g.id = q.generation_id and g.owner_id = q.owner_id
    where s.id = new.section_id and s.owner_id = new.owner_id and s.eligible_for_generation
      and s.material_id = g.material_id and s.reference = new.reference
      and strpos(s.text, new.excerpt) > 0
  ) then raise exception 'INVALID_QUESTION_SOURCE'; end if;
  return new;
end;
$$;
create trigger quiz_question_sources_guard before insert or update on public.quiz_question_sources
  for each row execute function public.guard_quiz_question_source();

create function public.check_quiz_generation_ready()
returns trigger language plpgsql set search_path = '' as $$
declare
  generation_id uuid;
  generation public.quiz_generations%rowtype;
  quiz public.quizzes%rowtype;
begin
  if tg_table_name = 'quiz_generations' then generation_id := new.id;
  elsif tg_op = 'DELETE' then generation_id := old.generation_id;
  else generation_id := new.generation_id;
  end if;
  select * into generation from public.quiz_generations where id = generation_id;
  if not found then return null; end if;
  select * into quiz from public.quizzes where quizzes.generation_id = generation.id;
  if (generation.status = 'ready') <> found then raise exception 'GENERATION_QUIZ_STATE_MISMATCH'; end if;
  if generation.status = 'ready' then
    if quiz.question_count > generation.requested_question_count
      or (select count(*) from public.quiz_questions where quiz_id = quiz.id) < quiz.question_count
      or exists (select 1 from public.quiz_questions q where q.quiz_id = quiz.id and (
        (generation.question_type = 'coding_syntax' and q.code is null)
        or (generation.question_type = 'conceptual' and q.code is not null)
        or (generation.source_kind = 'module' and not exists (
          select 1 from public.quiz_question_sources s where s.question_id = q.id))
      )) then raise exception 'QUIZ_NOT_VALIDATED'; end if;
  end if;
  return null;
end;
$$;

-- The quiz, its questions/sources and the ready status must commit together.
create constraint trigger quiz_generations_ready_check after insert or update on public.quiz_generations
  deferrable initially deferred for each row execute function public.check_quiz_generation_ready();
create constraint trigger quizzes_ready_check after insert or update or delete on public.quizzes
  deferrable initially deferred for each row execute function public.check_quiz_generation_ready();

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_question_sources enable row level security;
revoke all on table public.quizzes, public.quiz_questions, public.quiz_question_sources from public, anon, authenticated;
grant select, insert, update, delete on table public.quizzes, public.quiz_questions, public.quiz_question_sources to service_role;
revoke all on function public.guard_quiz_question_source(), public.check_quiz_generation_ready() from public, anon, authenticated;
grant execute on function public.guard_quiz_question_source(), public.check_quiz_generation_ready() to service_role;

commit;
