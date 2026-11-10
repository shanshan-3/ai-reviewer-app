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
            .select('id, generation:quiz_generations!inner(subject_id, topic_id, subjects!inner(id, name), topics!inner(id, name))')
            .eq('owner_id', ownerId)
            .in('id', quizIds)
    );

    const quizMap = new Map(quizzes.map(q => [q.id, q.generation]));

    return answers
        .map(a => {
            const gen = quizMap.get(a.quiz_id);
            return {
                questionId: a.question_id,
                isCorrect: a.is_correct,
                answeredAt: a.answered_at,
                subjectId: gen?.subject_id,
                subjectName: gen?.subjects?.name,
                topicId: gen?.topic_id,
                topicName: gen?.topics?.name,
            };
        })
        .filter(a => a.topicId);
}
