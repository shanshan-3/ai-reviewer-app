function data(result) {
    if (result.error) throw result.error;
    return result.data;
}

/**
 * Fetches user's submitted answers with generation metadata (subject, topic).
 * Ordered by answered_at descending.
 */
export async function getRecentSubmittedAnswers(admin, ownerId, limit = 500) {
    const answers = data(
        await admin
            .from('submitted_answers')
            .select('question_id, is_correct, quiz_id, answered_at')
            .eq('owner_id', ownerId)
            .order('answered_at', { ascending: false })
            .limit(limit)
    );
    if (!answers.length) return [];

    const quizIds = [...new Set(answers.map(a => a.quiz_id))];
    const quizzes = data(
        await admin
            .from('quizzes')
            .select('id, generation:quiz_generations!inner(source_kind, subject_id, topic_id, materials(id, title, subjects(id, name)), topics(id, name, subjects(id, name)))')
            .eq('owner_id', ownerId)
            .in('id', quizIds)
    );

    const quizMap = new Map(quizzes.map(q => [q.id, q.generation]));

    return answers
        .map(a => {
            const gen = quizMap.get(a.quiz_id);
            const topic = gen?.topics;
            const material = gen?.materials;
            const topicId = gen?.topic_id || topic?.id;
            const subjectId = gen?.subject_id || topic?.subjects?.id || material?.subjects?.id;
            const subjectName = topic?.subjects?.name || material?.subjects?.name || 'General Subject';
            const rawTopicName = topic?.name;
            const topicName = rawTopicName && rawTopicName !== 'General'
                ? rawTopicName
                : subjectName;

            return {
                questionId: a.question_id,
                isCorrect: a.is_correct,
                answeredAt: a.answered_at,
                subjectId,
                subjectName,
                topicId,
                topicName,
            };
        })
        .filter(a => a.topicId);
}

/**
 * Fetches timestamps of all qualifying completed study events:
 * 1. Completed quiz study sessions
 * 2. Completed flashcard deck reviews
 */
export async function getCompletedStudyActivities(admin, ownerId) {
    const [sessionsResult, flashcardsResult] = await Promise.all([
        admin
            .from('study_sessions')
            .select('completed_at')
            .eq('owner_id', ownerId)
            .eq('status', 'completed')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }),
        admin
            .from('flashcard_reviews')
            .select('completed_at')
            .eq('owner_id', ownerId)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }),
    ]);

    const sessionDates = data(sessionsResult).map(s => s.completed_at);
    const flashcardDates = data(flashcardsResult).map(f => f.completed_at);

    return [...sessionDates, ...flashcardDates];
}

