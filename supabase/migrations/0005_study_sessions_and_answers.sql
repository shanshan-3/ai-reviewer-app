begin;

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  quiz_id uuid not null unique,
  question_count integer not null check (question_count between 1 and 10),
  status text not null default 'active' check (status in ('active', 'completed')),
  starting_difficulty text not null default 'medium' check (starting_difficulty in ('easy', 'medium', 'hard')),
  current_difficulty text not null default 'medium' check (current_difficulty in ('easy', 'medium', 'hard')),
  correct_streak integer not null default 0 check (correct_streak between 0 and 2),
  incorrect_streak integer not null default 0 check (incorrect_streak between 0 and 2),
  current_question_id uuid,
  answered_count integer not null default 0 check (answered_count >= 0 and answered_count <= question_count),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= answered_count),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint study_sessions_id_quiz_owner_key unique (id, quiz_id, owner_id),
  constraint study_sessions_quiz_fkey foreign key (quiz_id, owner_id, question_count)
    references public.quizzes (id, owner_id, question_count) on delete cascade,
  constraint study_sessions_completion_valid check (
    (status = 'active' and current_question_id is not null and completed_at is null and answered_count < question_count)
    or (status = 'completed' and current_question_id is null and completed_at is not null
      and completed_at >= started_at and answered_count = question_count)
  ),
  constraint study_sessions_streaks_valid check (correct_streak = 0 or incorrect_streak = 0)
);

create table public.session_questions (
  session_id uuid not null,
  quiz_id uuid not null,
  owner_id uuid not null,
  question_id uuid not null,
  candidate_position integer not null check (candidate_position > 0),
  option_order text[] not null default array['a', 'b', 'c', 'd'],
  primary key (session_id, question_id),
  constraint session_questions_position_key unique (session_id, candidate_position),
  constraint session_questions_session_fkey foreign key (session_id, quiz_id, owner_id)
    references public.study_sessions (id, quiz_id, owner_id) on delete cascade,
  constraint session_questions_question_fkey foreign key (question_id, quiz_id, owner_id)
    references public.quiz_questions (id, quiz_id, owner_id) on delete cascade,
  constraint session_questions_options_valid check (
    array_ndims(option_order) = 1 and array_lower(option_order, 1) = 1
    and cardinality(option_order) = 4 and option_order @> array['a', 'b', 'c', 'd']
  )
);

alter table public.study_sessions add constraint study_sessions_current_question_fkey
  foreign key (id, current_question_id) references public.session_questions (session_id, question_id)
  deferrable initially deferred;

create table public.submitted_answers (
  session_id uuid not null,
  question_id uuid not null,
  quiz_id uuid not null,
  owner_id uuid not null,
  sequence_position integer not null check (sequence_position > 0),
  option_id text not null check (option_id in ('a', 'b', 'c', 'd')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  correct_option_id text not null,
  is_correct boolean generated always as (option_id = correct_option_id) stored,
  answered_at timestamptz not null default now(),
  primary key (session_id, question_id),
  constraint submitted_answers_sequence_key unique (session_id, sequence_position),
  constraint submitted_answers_session_fkey foreign key (session_id, quiz_id, owner_id)
    references public.study_sessions (id, quiz_id, owner_id) on delete cascade,
  constraint submitted_answers_member_fkey foreign key (session_id, question_id)
    references public.session_questions (session_id, question_id) on delete cascade,
  constraint submitted_answers_key_fkey foreign key (question_id, quiz_id, owner_id, difficulty, correct_option_id)
    references public.quiz_questions (id, quiz_id, owner_id, difficulty, correct_option_id) on delete cascade
);

create index study_sessions_owner_started_idx on public.study_sessions (owner_id, started_at desc);
create index session_questions_question_idx on public.session_questions (question_id, quiz_id, owner_id);
create index submitted_answers_question_idx on public.submitted_answers (question_id, quiz_id, owner_id);

alter table public.study_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.submitted_answers enable row level security;
revoke all on table public.study_sessions, public.session_questions, public.submitted_answers from public, anon, authenticated;
grant select, insert, update, delete on table public.study_sessions, public.session_questions, public.submitted_answers to service_role;

commit;
