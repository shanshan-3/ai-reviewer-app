import Groq from 'groq-sdk';

export const AI_LIMITS = Object.freeze({
    model: 'openai/gpt-oss-120b', promptBytes: 3072, completionTokens: 4096,
    timeoutMs: 45000, cooldownMs: 60000, sourceSections: 200,
});

export function createGroqClient() {
    if (!process.env.GROQ_API_KEY || (process.env.GROQ_MODEL && process.env.GROQ_MODEL !== AI_LIMITS.model)) {
        throw new Error('QUIZ_AI_NOT_CONFIGURED');
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 0, timeout: AI_LIMITS.timeoutMs });
}
