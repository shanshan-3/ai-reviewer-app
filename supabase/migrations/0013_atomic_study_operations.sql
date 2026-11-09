begin;

create or replace function public.start_study_session(p_owner_id uuid, p_quiz_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  quiz record;
  existing_session record;
  session record;
  q record;
  first_question_id uuid := null;
  pos integer := 0;
  options text[];
  new_session_id uuid;
begin
  select qz.id, qz.owner_id, qz.question_count, g.starting_difficulty, g.question_type
    into quiz
    from public.quizzes qz
    join public.quiz_generations g on g.id = qz.generation_id and g.owner_id = qz.owner_id
    where qz.id = p_quiz_id and qz.owner_id = p_owner_id;
  if not found then raise exception 'QUIZ_NOT_FOUND'; end if;

  select s.id, s.quiz_id, s.question_count, s.status, s.starting_difficulty,
         s.current_difficulty, s.current_question_id, s.answered_count, s.correct_count,
         s.started_at, s.completed_at
    into existing_session
    from public.study_sessions s
    where s.quiz_id = p_quiz_id and s.owner_id = p_owner_id;

  if found then
    return jsonb_build_object(
      'session', row_to_json(existing_session),
      'is_new', false
    );
  end if;

  new_session_id := gen_random_uuid();

  select qq.id into first_question_id
    from public.quiz_questions qq
    where qq.quiz_id = p_quiz_id and qq.owner_id = p_owner_id and qq.difficulty = quiz.starting_difficulty
    order by qq.pool_position
    limit 1;

  if first_question_id is null then
    select qq.id into first_question_id
      from public.quiz_questions qq
      where qq.quiz_id = p_quiz_id and qq.owner_id = p_owner_id
      order by qq.pool_position
      limit 1;
  end if;

  insert into public.study_sessions (
    id, owner_id, quiz_id, question_count, status, starting_difficulty,
    current_difficulty, current_question_id, answered_count, correct_count
  ) values (
    new_session_id, p_owner_id, p_quiz_id, quiz.question_count, 'active',
    quiz.starting_difficulty, quiz.starting_difficulty, first_question_id, 0, 0
  ) returning * into session;

  for q in (
    select qq.id, qq.difficulty, qq.pool_position, qq.option_c
      from public.quiz_questions qq
      where qq.quiz_id = p_quiz_id and qq.owner_id = p_owner_id
      order by qq.pool_position
  ) loop
    pos := pos + 1;
    if q.option_c is null then
      options := array['a', 'b'];
    else
      options := array['a', 'b', 'c', 'd'];
    end if;

    insert into public.session_questions (
      session_id, quiz_id, owner_id, question_id, candidate_position, option_order
    ) values (
      new_session_id, p_quiz_id, p_owner_id, q.id, pos, options
    );
  end loop;

  return jsonb_build_object(
    'session', row_to_json(session),
    'is_new', true
  );
end;
$$;

create or replace function public.submit_study_answer(
  p_owner_id uuid, p_session_id uuid, p_question_id uuid, p_option_id text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  sess record;
  q record;
  existing_ans record;
  next_qid uuid := null;
  is_ans_correct boolean;
  new_answered_count integer;
  new_correct_count integer;
  new_status text;
  new_completed_at timestamptz := null;
begin
  select * into sess
    from public.study_sessions
    where id = p_session_id and owner_id = p_owner_id
    for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;

  if sess.status <> 'active' then
    select * into existing_ans from public.submitted_answers
      where session_id = p_session_id and question_id = p_question_id and owner_id = p_owner_id;
    if found and existing_ans.option_id = p_option_id then
      return jsonb_build_object(
        'submission', jsonb_build_object('questionId', p_question_id, 'selectedOptionId', p_option_id),
        'session', row_to_json(sess),
        'currentQuestion', null
      );
    end if;
    raise exception 'SESSION_COMPLETED';
  end if;

  if sess.current_question_id <> p_question_id then
    select * into existing_ans from public.submitted_answers
      where session_id = p_session_id and question_id = p_question_id and owner_id = p_owner_id;
    if found then
      if existing_ans.option_id = p_option_id then
        return jsonb_build_object(
          'submission', jsonb_build_object('questionId', p_question_id, 'selectedOptionId', p_option_id),
          'session', row_to_json(sess),
          'is_retry', true
        );
      else
        raise exception 'ANSWER_CONFLICT';
      end if;
    end if;
    raise exception 'QUESTION_NOT_CURRENT';
  end if;

  select * into q from public.quiz_questions
    where id = p_question_id and quiz_id = sess.quiz_id and owner_id = p_owner_id;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;

  is_ans_correct := (p_option_id = q.correct_option_id);
  new_answered_count := sess.answered_count + 1;
  new_correct_count := sess.correct_count + (case when is_ans_correct then 1 else 0 end);

  insert into public.submitted_answers (
    session_id, question_id, quiz_id, owner_id, sequence_position,
    option_id, difficulty, correct_option_id
  ) values (
    p_session_id, p_question_id, sess.quiz_id, p_owner_id, new_answered_count,
    p_option_id, q.difficulty, q.correct_option_id
  );

  if new_answered_count >= sess.question_count then
    new_status := 'completed';
    new_completed_at := clock_timestamp();
    next_qid := null;
  else
    new_status := 'active';
    select sq.question_id into next_qid
      from public.session_questions sq
      where sq.session_id = p_session_id and sq.owner_id = p_owner_id
        and not exists (
          select 1 from public.submitted_answers sa
            where sa.session_id = p_session_id and sa.question_id = sq.question_id
        )
      order by sq.candidate_position
      limit 1;
  end if;

  update public.study_sessions
    set answered_count = new_answered_count,
        correct_count = new_correct_count,
        status = new_status,
        completed_at = new_completed_at,
        current_question_id = next_qid
    where id = p_session_id;

  select * into sess from public.study_sessions where id = p_session_id;

  return jsonb_build_object(
    'submission', jsonb_build_object('questionId', p_question_id, 'selectedOptionId', p_option_id),
    'session', row_to_json(sess),
    'nextQuestionId', next_qid
  );
end;
$$;

revoke all on function public.start_study_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_study_session(uuid, uuid) to service_role;

revoke all on function public.submit_study_answer(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.submit_study_answer(uuid, uuid, uuid, text) to service_role;

commit;
