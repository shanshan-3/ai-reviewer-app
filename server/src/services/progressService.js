import { createSupabaseAdminClient } from '../config/supabase.js';
import * as model from '../models/progressModel.js';
import { calculateTopicEstimates } from './progressEstimates.js';
import { generateTopicRecommendations } from './topicRecommendations.js';
import { calculateStreak } from './studyStreaks.js';

export async function getUserRecommendations({ userId }) {
    const admin = createSupabaseAdminClient();
    const answers = await model.getRecentSubmittedAnswers(admin, userId);
    return generateTopicRecommendations(answers);
}

export async function getUserEstimates({ userId }) {
    const admin = createSupabaseAdminClient();
    const answers = await model.getRecentSubmittedAnswers(admin, userId);
    const estimates = calculateTopicEstimates(answers);
    return { estimates };
}

export async function getUserStreak({ userId, timeZone }) {
    const admin = createSupabaseAdminClient();
    const timestamps = await model.getCompletedStudyActivities(admin, userId);
    return calculateStreak(timestamps, timeZone);
}

