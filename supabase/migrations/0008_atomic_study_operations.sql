begin;

-- Session creation and answer-submission operations will be added in the answering milestone.
create function public.publish_quiz(
  p_owner_id uuid, p_generation_id uuid, p_questions jsonb, p_model text
) returns uuid
language plpgsql set search_path = '' as $$
declare
  generation public.quiz_generations%rowtype;
  source public.materials%rowtype;
  quiz_id uuid;
  question_id uuid;
  question jsonb;
  citation jsonb;
  position integer := 0;
begin
  select * into generation from public.quiz_generations
    where id = p_generation_id and owner_id = p_owner_id for update;
  if not found then raise exception 'GENERATION_NOT_FOUND'; end if;
  if generation.status = 'ready' then
    select id into quiz_id from public.quizzes
      where generation_id = generation.id and owner_id = p_owner_id;
    return quiz_id;
  end if;
  if generation.status <> 'processing' then raise exception 'GENERATION_TERMINAL'; end if;
  if jsonb_typeof(p_questions) is distinct from 'array' then raise exception 'INVALID_GENERATION'; end if;
  if jsonb_array_length(p_questions) not between 1 and generation.requested_question_count then
    raise exception 'INVALID_GENERATION';
  end if;

  if generation.material_id is not null then
    select * into source from public.materials
      where id = generation.material_id and owner_id = p_owner_id for share;
    if not found or source.status <> 'ready' or source.cleanup_pending then raise exception 'MODULE_NOT_READY'; end if;
  end if;

  insert into public.quizzes(owner_id, generation_id, question_count, provider, model)
    values (p_owner_id, generation.id, jsonb_array_length(p_questions), 'groq', p_model)
    returning id into quiz_id;
  for question in select value from jsonb_array_elements(p_questions) loop
    position := position + 1;
    insert into public.quiz_questions(owner_id, quiz_id, pool_position, prompt, difficulty,
      code, code_language, option_a, option_b, option_c, option_d, correct_option_id, explanation)
    values (p_owner_id, quiz_id, position, question->>'prompt', question->>'difficulty',
      question->>'code', question->>'code_language', question->>'option_a', question->>'option_b',
      question->>'option_c', question->>'option_d', question->>'correct_option_id', question->>'explanation')
    returning id into question_id;
    if jsonb_typeof(question->'sources') is distinct from 'array' then raise exception 'INVALID_QUESTION_SOURCE'; end if;
    if generation.source_kind = 'topic' and jsonb_array_length(question->'sources') <> 0 then
      raise exception 'INVALID_QUESTION_SOURCE';
    end if;
    for citation in select value from jsonb_array_elements(question->'sources') loop
      insert into public.quiz_question_sources(question_id, quiz_id, owner_id, section_id, reference, excerpt)
      values (question_id, quiz_id, p_owner_id, (citation->>'section_id')::uuid,
        citation->'reference', citation->>'excerpt');
    end loop;
  end loop;
  update public.quiz_generations set status = 'ready', error_code = null where id = generation.id;
  return quiz_id;
end;
$$;

revoke all on function public.publish_quiz(uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.publish_quiz(uuid, uuid, jsonb, text) to service_role;

create function public.recover_quiz_generations()
returns void language sql set search_path = '' as $$
  update public.quiz_generations set status = 'failed', error_code = 'GENERATION_INTERRUPTED'
    where status = 'processing';
$$;
revoke all on function public.recover_quiz_generations() from public, anon, authenticated;
grant execute on function public.recover_quiz_generations() to service_role;

commit;
