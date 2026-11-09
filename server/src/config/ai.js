import Groq from 'groq-sdk';

export const AI_LIMITS = Object.freeze({
    model: 'openai/gpt-oss-120b', promptBytes: 3072, completionTokens: 8192,
    timeoutMs: 60000, cooldownMs: 15000, sourceSections: 200,
});

export function getCooldownMs(questionCount) {
    if (questionCount <= 5) return 10000;
    if (questionCount <= 10) return 15000;
    return 30000;
}

export function isGroqConfigured() {
    return Boolean(process.env.GROQ_API_KEY);
}

export function createGroqClient() {
    if (!process.env.GROQ_API_KEY || (process.env.GROQ_MODEL && process.env.GROQ_MODEL !== AI_LIMITS.model)) {
        throw new Error('QUIZ_AI_NOT_CONFIGURED');
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY, fetch: globalThis.fetch, maxRetries: 0, timeout: AI_LIMITS.timeoutMs });
}

export const GEMINI_CONFIG = Object.freeze({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timeoutMs: 45000,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
});

export function isGeminiConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
}

export function getPrimaryProvider() {
    const configured = (process.env.AI_PRIMARY_PROVIDER || '').toLowerCase().trim();
    if (configured === 'gemini') return 'gemini';
    if (configured === 'groq') return 'groq';
    if (isGroqConfigured() && !isGeminiConfigured()) return 'groq';
    return 'gemini';
}

export function isPrimaryAiConfigured() {
    const primary = getPrimaryProvider();
    return primary === 'gemini' ? isGeminiConfigured() : isGroqConfigured();
}
