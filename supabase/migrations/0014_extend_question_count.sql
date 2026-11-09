begin;

-- 1. Allow 20 questions in quiz_generations requested count
alter table public.quiz_generations drop constraint quiz_generations_requested_question_count_check;
alter table public.quiz_generations add constraint quiz_generations_requested_question_count_check
  check (requested_question_count in (5, 10, 20));

-- 2. Allow up to 20 questions in quizzes
alter table public.quizzes drop constraint quizzes_question_count_check;
alter table public.quizzes add constraint quizzes_question_count_check
  check (question_count between 1 and 20);

-- 3. Allow up to 20 questions in study_sessions
alter table public.study_sessions drop constraint study_sessions_question_count_check;
alter table public.study_sessions add constraint study_sessions_question_count_check
  check (question_count between 1 and 20);

commit;
