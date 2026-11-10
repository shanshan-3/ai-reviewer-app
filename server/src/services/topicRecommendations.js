import { calculateTopicEstimates } from './progressEstimates.js';

export const RECOMMENDATION_THRESHOLD = 70; // Topics below 70% accuracy are recommended for review

/**
 * Generates weak-topic recommendations based on eligible practice estimates.
 * Identifies topics with accuracy < 70% (minimum 5 answers) and prioritizes
 * the weakest topics first.
 *
 * Rule (from roadmap): Recommendations remain suggestions. Users choose the next topic.
 * Does not override user selection or auto-generate a quiz.
 */
export function generateTopicRecommendations(submittedAnswers = []) {
    const estimates = calculateTopicEstimates(submittedAnswers);

    // Filter for eligible topics with accuracy below the threshold
    const weakTopics = estimates
        .filter(est => est.eligible && est.accuracy < RECOMMENDATION_THRESHOLD)
        .sort((a, b) => a.accuracy - b.accuracy); // Lowest accuracy first

    const recommendations = weakTopics.map(item => ({
        topicId: item.topicId,
        topicName: item.topicName,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        accuracy: item.accuracy,
        sampleCount: item.sampleCount,
        reason: `Your accuracy is ${item.accuracy}% over the latest ${item.sampleCount} questions. Focused practice is recommended to strengthen understanding.`,
        suggestedQuestionCount: 10,
        suggestedDifficulty: item.accuracy < 50 ? 'easy' : 'medium',
    }));

    return {
        hasRecommendations: recommendations.length > 0,
        totalEvaluatedTopics: estimates.length,
        eligibleTopicCount: estimates.filter(e => e.eligible).length,
        recommendations,
    };
}
