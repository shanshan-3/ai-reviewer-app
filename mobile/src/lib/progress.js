import { fetch } from 'expo/fetch';
import { supabase } from '@/lib/supabase';
import { getDeviceTimeZone } from '@/lib/study-date';

async function request(path, options = {}) {

    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('The server address is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Please sign in again.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
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
                    : 'The progress service is unavailable.'
            );
            err.status = response.status;
            err.code = result?.code;
            throw err;
        }
        if (!result) throw new Error('The server returned an unreadable response.');
        return result;
    } finally {
        clearTimeout(timeout);
    }
}

export async function getTopicRecommendations() {
    return request('/api/progress/recommendations');
}

export async function getTopicEstimates() {
    return request('/api/progress/estimates');
}

export async function getUserStreak() {
    const tz = getDeviceTimeZone();
    return request(`/api/progress/streak?tz=${encodeURIComponent(tz)}`);
}

