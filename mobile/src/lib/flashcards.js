import { fetch } from 'expo/fetch';
import { supabase } from '@/lib/supabase';

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
                    : 'The flashcard service is unavailable. Try again later.'
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

export async function listFlashcardDecks() {
    return request('/api/flashcards');
}

export async function createFlashcardDeck({ source, cardCount = 10, title }) {
    return request('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({ source, cardCount, title }),
    });
}

export async function getFlashcardDeck(id) {
    return request(`/api/flashcards/${id}`);
}

export async function recordFlashcardReview(id, viewedCardCount) {
    return request(`/api/flashcards/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ viewedCardCount }),
    });
}

export async function deleteFlashcardDeck(id) {
    return request(`/api/flashcards/${id}`, {
        method: 'DELETE',
    });
}
