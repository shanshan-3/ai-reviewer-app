import { fetch } from 'expo/fetch';
import { supabase } from '@/lib/supabase';

function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function request(path, options = {}) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('The server address is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Please sign in again.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let response;
    try {
        response = await fetch(`${baseUrl}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                Authorization: `Bearer ${data.session.access_token}`,
            },
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            const err = new Error(
                response.status === 401
                    ? 'Please sign in again.'
                    : typeof result?.error === 'string'
                    ? result.error
                    : 'The quiz service is unavailable. Try again later.'
            );
            err.status = response.status;
            err.code = result?.code;
            const retryHeader = response.headers?.get ? response.headers.get('Retry-After') : null;
            err.retryAfter = result?.retryAfter ?? (retryHeader ? Number(retryHeader) : undefined);
            throw err;
        }
        if (!result) throw new Error('The server returned an unreadable response.');
        return result;
    } catch (err) {
        if (controller.signal.aborted) {
            throw new Error('The request timed out. Please check your connection and retry.');
        }
        if (err?.name === 'AbortError' || (!response && /\b(cancell?ed|aborted)\b/i.test(err?.message ?? ''))) {
            throw new Error('The request was interrupted. Try again.');
        }
        if (!response) {
            throw new Error('Could not reach the server. Check your connection and retry.');
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

export async function createQuizGeneration({
    source,
    questionType = 'conceptual',
    questionCount = 10,
    startingDifficulty = 'medium',
    requestId = generateUuid(),
}) {
    return request('/api/quizzes/generations', {
        method: 'POST',
        body: JSON.stringify({
            requestId,
            source,
            questionType,
            questionCount,
            startingDifficulty,
        }),
    });
}

export async function getQuizGeneration(id) {
    return request(`/api/quizzes/generations/${id}`);
}

export async function getQuiz(id) {
    return request(`/api/quizzes/${id}`);
}

export async function listUserQuizzes() {
    return request('/api/quizzes');
}

export async function deleteQuiz(quizId) {
    return request(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
    });
}

export async function startQuizSession(quizId) {
    return request(`/api/quizzes/${quizId}/sessions`, {
        method: 'POST',
    });
}

export async function getStudySession(sessionId) {
    return request(`/api/study-sessions/${sessionId}`);
}

export async function submitStudyAnswer(sessionId, questionId, optionId) {
    return request(`/api/study-sessions/${sessionId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ questionId, optionId }),
    });
}

export async function getStudySessionResults(sessionId) {
    return request(`/api/study-sessions/${sessionId}/results`);
}
