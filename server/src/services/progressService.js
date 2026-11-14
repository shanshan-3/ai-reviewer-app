import { createSupabaseAdminClient } from '../config/supabase.js';
import * as model from '../models/progressModel.js';
import { calculateTopicEstimates } from './progressEstimates.js';
import { generateTopicRecommendations } from './topicRecommendations.js';
import { calculateStreak, getLocalDateString, getPreviousDateString } from './studyStreaks.js';

export async function getUserRecommendations({ userId, client }) {
    const admin = client || createSupabaseAdminClient();
    const answers = await model.getRecentSubmittedAnswers(admin, userId);
    return generateTopicRecommendations(answers);
}

export async function getUserEstimates({ userId, client }) {
    const admin = client || createSupabaseAdminClient();
    const answers = await model.getRecentSubmittedAnswers(admin, userId);
    const estimates = calculateTopicEstimates(answers);
    return { estimates };
}

export async function getUserStreak({ userId, timeZone, client }) {
    const admin = client || createSupabaseAdminClient();
    const timestamps = await model.getCompletedStudyActivities(admin, userId);
    return calculateStreak(timestamps, timeZone);
}

export async function getUserReport({ userId, timeZone, client }) {
    const admin = client || createSupabaseAdminClient();
    const [answers, timestamps, quizSessionsResult, flashcardCountResult] = await Promise.all([
        model.getRecentSubmittedAnswers(admin, userId),
        model.getCompletedStudyActivities(admin, userId),
        admin
            .from('study_sessions')
            .select('id, question_count, correct_count, completed_at', { count: 'exact' })
            .eq('owner_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(10),
        admin.from('flashcard_reviews').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    ]);

    const estimates = calculateTopicEstimates(answers);
    const streak = calculateStreak(timestamps, timeZone);
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const overallAccuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    const eligible = estimates.filter(e => e.eligible);
    const strengths = eligible.filter(e => e.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);
    const weaknesses = eligible.filter(e => e.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy);

    const completedSessions = quizSessionsResult?.data || [];
    const totalQuizzesCompleted = quizSessionsResult?.count ?? completedSessions.length;

    // Score trend for recent completed quizzes (chronological order)
    const quizScoreTrend = completedSessions
        .filter(s => s.question_count > 0 && s.completed_at)
        .map(s => Math.round((s.correct_count / s.question_count) * 100))
        .reverse();

    // 7-day daily activity counts (answers submitted per calendar date)
    const todayStr = getLocalDateString(new Date(), timeZone);
    const past7Days = [];
    let curr = todayStr;
    for (let i = 0; i < 7; i++) {
        if (curr) {
            past7Days.unshift(curr);
            curr = getPreviousDateString(curr);
        }
    }

    const answersPerDay = {};
    for (const a of answers) {
        if (a.answeredAt) {
            const dateStr = getLocalDateString(a.answeredAt, timeZone);
            if (dateStr) {
                answersPerDay[dateStr] = (answersPerDay[dateStr] || 0) + 1;
            }
        }
    }

    const dailyActivity = past7Days.map(date => ({
        date,
        count: answersPerDay[date] || 0,
        hasStudied: (streak.recentDays || []).includes(date),
    }));

    return {
        summary: {
            totalQuizzesCompleted,
            totalFlashcardReviews: flashcardCountResult.count || 0,
            totalQuestionsAnswered: totalAnswers,
            overallAccuracy,
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            totalStudyDays: streak.totalStudyDays,
            lastStudiedDate: streak.lastStudiedDate,
        },
        strengths,
        weaknesses,
        estimates,
        recentDays: streak.recentDays || [],
        dailyActivity,
        quizScoreTrend,
        isEmpty: totalAnswers === 0 && (streak.totalStudyDays || 0) === 0,
        hasSparseData: estimates.length > 0 && eligible.length === 0,
        disclaimer: 'Subject mastery estimates are calculated from your latest practice sessions and do not certify formal examination readiness.',
    };
}

