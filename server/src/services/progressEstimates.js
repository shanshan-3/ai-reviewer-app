export const ESTIMATE_CONFIG = {
    WINDOW_SIZE: 20, // Rolling window of latest 20 first-submission answers per topic
    MIN_SAMPLE_COUNT: 5, // Minimum answers required for an eligible estimate
};

/**
 * Calculates topic practice estimates from submitted answers.
 * Groups by topic, takes the latest 20 first-submission answers,
 * requires at least 5 answers, and calculates accuracy percentage.
 */
export function calculateTopicEstimates(answers = []) {
    const topicGroups = new Map();

    for (const a of answers) {
        if (!a.topicId) continue;
        if (!topicGroups.has(a.topicId)) {
            topicGroups.set(a.topicId, {
                topicId: a.topicId,
                topicName: a.topicName || 'General',
                subjectId: a.subjectId,
                subjectName: a.subjectName || 'IT Subject',
                answers: [],
            });
        }
        const group = topicGroups.get(a.topicId);
        if (group.answers.length < ESTIMATE_CONFIG.WINDOW_SIZE) {
            group.answers.push(a);
        }
    }

    const estimates = [];

    for (const group of topicGroups.values()) {
        const sampleCount = group.answers.length;
        const eligible = sampleCount >= ESTIMATE_CONFIG.MIN_SAMPLE_COUNT;
        const correctCount = group.answers.filter(a => a.isCorrect).length;
        const accuracy = sampleCount > 0 ? Math.round((correctCount / sampleCount) * 100) : 0;

        estimates.push({
            topicId: group.topicId,
            topicName: group.topicName,
            subjectId: group.subjectId,
            subjectName: group.subjectName,
            sampleCount,
            correctCount,
            accuracy,
            eligible,
            status: eligible
                ? (accuracy >= 80 ? 'mastered' : accuracy >= 60 ? 'proficient' : 'needs_practice')
                : 'insufficient_data',
        });
    }

    return estimates;
}
