begin;

alter table public.quiz_generations drop constraint quiz_generations_question_type_check;
alter table public.quiz_generations add constraint quiz_generations_question_type_check
  check (question_type in ('conceptual', 'true_false', 'coding_syntax'));

alter table public.quiz_questions alter column option_c drop not null;
alter table public.quiz_questions alter column option_d drop not null;
alter table public.quiz_questions add constraint quiz_questions_option_shape check (
  (option_c is null and option_d is null and option_a = 'True' and option_b = 'False'
    and correct_option_id in ('a', 'b') and code is null and code_language is null)
  or (option_c is not null and option_d is not null)
);

create function public.guard_question_modality()
returns trigger language plpgsql set search_path = '' as $$
declare modality text;
begin
  select g.question_type into modality from public.quizzes q
    join public.quiz_generations g on g.id = q.generation_id and g.owner_id = q.owner_id
    where q.id = new.quiz_id and q.owner_id = new.owner_id;
  if not found then raise exception 'QUIZ_NOT_FOUND'; end if;
  if (modality = 'true_false') <> (new.option_c is null and new.option_d is null)
    or (modality = 'coding_syntax') <> (new.code is not null) then
    raise exception 'INVALID_QUESTION_MODALITY';
  end if;
  return new;
end;
$$;
create trigger quiz_questions_modality_guard before insert or update on public.quiz_questions
  for each row execute function public.guard_question_modality();

alter table public.session_questions drop constraint session_questions_options_valid;
alter table public.session_questions add constraint session_questions_options_valid check (
  array_ndims(option_order) = 1 and array_lower(option_order, 1) = 1
  and ((cardinality(option_order) = 2 and option_order @> array['a', 'b'])
    or (cardinality(option_order) = 4 and option_order @> array['a', 'b', 'c', 'd']))
);

create function public.guard_session_question_options()
returns trigger language plpgsql set search_path = '' as $$
declare expected integer;
begin
  select case when q.option_c is null then 2 else 4 end into expected
    from public.quiz_questions q where q.id = new.question_id
      and q.quiz_id = new.quiz_id and q.owner_id = new.owner_id;
  if not found or cardinality(new.option_order) <> expected then
    raise exception 'INVALID_OPTION_ORDER';
  end if;
  return new;
end;
$$;
create trigger session_questions_options_guard before insert or update on public.session_questions
  for each row execute function public.guard_session_question_options();

create function public.guard_submitted_answer_option()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.session_questions s
    where s.session_id = new.session_id and s.question_id = new.question_id
      and s.quiz_id = new.quiz_id and s.owner_id = new.owner_id
      and new.option_id = any(s.option_order)) then raise exception 'INVALID_ANSWER_OPTION'; end if;
  return new;
end;
$$;
create trigger submitted_answers_option_guard before insert or update on public.submitted_answers
  for each row execute function public.guard_submitted_answer_option();

revoke all on function public.guard_question_modality(), public.guard_session_question_options(),
  public.guard_submitted_answer_option() from public, anon, authenticated;
grant execute on function public.guard_question_modality(), public.guard_session_question_options(),
  public.guard_submitted_answer_option() to service_role;

commit;
