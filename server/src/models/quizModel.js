const GENERATION_FIELDS = 'id,owner_id,request_id,source_kind,material_id,subject_id,topic_id,question_type,requested_question_count,starting_difficulty,status,error_code';
function data(result) { if (result.error) throw result.error; return result.data; }

export async function findGeneration(admin, ownerId, column, id) {
    return data(await admin.from('quiz_generations').select(GENERATION_FIELDS).eq('owner_id', ownerId).eq(column, id).maybeSingle());
}
export async function createGeneration(admin, row) {
    return data(await admin.from('quiz_generations').insert(row).select(GENERATION_FIELDS).single());
}
export async function getSourceMaterial(admin, ownerId, id) {
    return data(await admin.from('materials').select('id,status,cleanup_pending,subject_id,topic_id').eq('owner_id', ownerId).eq('id', id).maybeSingle());
}
export async function getSourceTopic(admin, ownerId, id) {
    return data(await admin.from('topics').select('id,subject_id,name,subjects!inner(name)').eq('owner_id', ownerId).eq('id', id).maybeSingle());
}
export async function getSourceSections(admin, ownerId, id, limit) {
    return data(await admin.from('material_sections').select('id,text,reference').eq('owner_id', ownerId)
        .eq('material_id', id).eq('eligible_for_generation', true).order('section_order').limit(limit));
}
export async function getQuiz(admin, ownerId, column, id) {
    return data(await admin.from('quizzes').select('id,generation_id,question_count').eq('owner_id', ownerId).eq(column, id).maybeSingle());
}
export async function publishQuiz(admin, ownerId, generationId, questions, model) {
    return data(await admin.rpc('publish_quiz', { p_owner_id: ownerId, p_generation_id: generationId,
        p_questions: questions, p_model: model }));
}
export async function finishGeneration(admin, ownerId, id, status, code) {
    return data(await admin.from('quiz_generations').update({ status, error_code: code }).eq('owner_id', ownerId)
        .eq('id', id).eq('status', 'processing').select('id'));
}
export async function recoverGenerations(admin) {
    data(await admin.rpc('recover_quiz_generations'));
}

export async function startStudySession(admin, ownerId, quizId) {
    return data(await admin.rpc('start_study_session', { p_owner_id: ownerId, p_quiz_id: quizId }));
}

export async function submitStudyAnswer(admin, ownerId, sessionId, questionId, optionId) {
    return data(await admin.rpc('submit_study_answer', {
        p_owner_id: ownerId,
        p_session_id: sessionId,
        p_question_id: questionId,
        p_option_id: optionId,
    }));
}

export async function findStudySession(admin, ownerId, sessionId) {
    return data(await admin.from('study_sessions').select('*')
        .eq('owner_id', ownerId).eq('id', sessionId).maybeSingle());
}

export async function findActiveSessionForQuiz(admin, ownerId, quizId) {
    return data(await admin.from('study_sessions').select('*')
        .eq('owner_id', ownerId).eq('quiz_id', quizId).maybeSingle());
}

export async function getSafeQuestion(admin, ownerId, sessionId, questionId) {
    const sq = data(await admin.from('session_questions')
        .select('option_order')
        .eq('owner_id', ownerId).eq('session_id', sessionId).eq('question_id', questionId).single());

    const q = data(await admin.from('quiz_questions')
        .select('id, pool_position, prompt, difficulty, code, code_language, option_a, option_b, option_c, option_d, quizzes!inner(generation_id, quiz_generations!inner(question_type))')
        .eq('owner_id', ownerId).eq('id', questionId).single());

    const options = (sq.option_order || ['a', 'b', 'c', 'd']).map(optId => ({
        id: optId,
        text: q[`option_${optId}`],
    }));

    const questionType = q.quizzes?.quiz_generations?.question_type ?? 'conceptual';

    return {
        id: q.id,
        questionType,
        difficulty: q.difficulty,
        prompt: q.prompt,
        code: q.code ? { language: q.code_language, text: q.code } : null,
        options,
    };
}

export async function getSessionAnswers(admin, ownerId, sessionId) {
    const list = data(await admin.from('submitted_answers')
        .select('question_id, option_id, sequence_position')
        .eq('owner_id', ownerId).eq('session_id', sessionId).order('sequence_position'));
    return list.map(a => ({ questionId: a.question_id, selectedOptionId: a.option_id }));
}

export async function getCompletedResults(admin, ownerId, sessionId) {
    const session = data(await admin.from('study_sessions').select('*')
        .eq('owner_id', ownerId).eq('id', sessionId).maybeSingle());
    if (!session) return null;
    if (session.status !== 'completed') return { status: 'incomplete' };

    const answers = data(await admin.from('submitted_answers')
        .select('question_id, option_id, difficulty, correct_option_id, is_correct, sequence_position')
        .eq('owner_id', ownerId).eq('session_id', sessionId).order('sequence_position'));

    const qIds = answers.map(a => a.question_id);
    const questions = data(await admin.from('quiz_questions')
        .select('id, prompt, difficulty, code, code_language, option_a, option_b, option_c, option_d, explanation')
        .eq('owner_id', ownerId).in('id', qIds));

    const sources = data(await admin.from('quiz_question_sources')
        .select('question_id, section_id, reference, excerpt')
        .eq('owner_id', ownerId).in('question_id', qIds));

    const qMap = new Map(questions.map(q => [q.id, q]));
    const sMap = new Map();
    for (const src of sources) {
        if (!sMap.has(src.question_id)) sMap.set(src.question_id, []);
        sMap.get(src.question_id).push({
            sectionId: src.section_id,
            reference: src.reference,
            excerpt: src.excerpt,
        });
    }

    const detailedAnswers = answers.map(a => {
        const q = qMap.get(a.question_id);
        const options = [
            { id: 'a', text: q?.option_a },
            { id: 'b', text: q?.option_b },
            ...(q?.option_c ? [{ id: 'c', text: q?.option_c }] : []),
            ...(q?.option_d ? [{ id: 'd', text: q?.option_d }] : []),
        ];
        return {
            questionId: a.question_id,
            prompt: q?.prompt ?? '',
            code: q?.code ? { language: q?.code_language, text: q?.code } : null,
            options,
            selectedOptionId: a.option_id,
            correct: a.is_correct,
            correctOptionId: a.correct_option_id,
            explanation: q?.explanation ?? '',
            sources: sMap.get(a.question_id) ?? [],
        };
    });

    return {
        status: 'completed',
        sessionId: session.id,
        quizId: session.quiz_id,
        correctCount: session.correct_count,
        answeredCount: session.answered_count,
        questionCount: session.question_count,
        startingDifficulty: session.starting_difficulty,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        answers: detailedAnswers,
    };
}

export async function deleteQuiz(admin, ownerId, quizId) {
    const quiz = data(await admin.from('quizzes').select('id, generation_id').eq('owner_id', ownerId).eq('id', quizId).maybeSingle());
    if (!quiz) return false;
    if (quiz.generation_id) {
        data(await admin.from('quiz_generations').delete().eq('owner_id', ownerId).eq('id', quiz.generation_id));
    } else {
        data(await admin.from('quizzes').delete().eq('owner_id', ownerId).eq('id', quizId));
    }
    return true;
}

export async function listUserQuizzes(admin, ownerId) {
    const list = data(await admin.from('quizzes')
        .select('id, question_count, created_at, generation_id, quiz_generations!inner(source_kind, material_id, subject_id, topic_id, question_type, starting_difficulty, status, materials(title), topics(name)), study_sessions(id, status, answered_count, correct_count, completed_at)')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(20));

    return list.map(item => {
        const gen = item.quiz_generations;
        const session = item.study_sessions?.[0] ?? null;
        return {
            id: item.id,
            questionCount: item.question_count,
            createdAt: item.created_at,
            questionType: gen?.question_type,
            startingDifficulty: gen?.starting_difficulty,
            sourceKind: gen?.source_kind,
            sourceTitle: gen?.source_kind === 'module' ? gen?.materials?.title : gen?.topics?.name,
            session: session ? {
                id: session.id,
                status: session.status,
                answeredCount: session.answered_count,
                correctCount: session.correct_count,
                completedAt: session.completed_at,
            } : null,
        };
    });
}
