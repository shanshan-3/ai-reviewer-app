import {
    AI_LIMITS,
    GEMINI_CONFIG,
    createGroqClient,
    getPrimaryProvider,
    isGeminiConfigured,
    isGroqConfigured,
} from '../config/ai.js';

/**
 * Computes the prompt byte budget scaled by requested item count.
 */
export function getPromptByteBudget(count = 10) {
    return Math.min(AI_LIMITS.promptBytes, count <= 5 ? 10240 : count <= 10 ? 16384 : 24576);
}

/**
 * Trims a string character-by-character until `measureBytes()` fits within `byteLimit`.
 */
export function trimTextToByteBudget(text, byteLimit, assignAndMeasure) {
    let result = '';
    for (const ch of text) {
        result += ch;
        if (assignAndMeasure(result) > byteLimit) {
            result = result.slice(0, -ch.length);
            break;
        }
    }
    return result;
}

/**
 * Determines whether a provider error qualifies for automatic fallback to the secondary AI provider.
 */
export function isFallbackEligible(error, { allowInvalidGeneration = false } = {}) {
    return (
        error?.status === 429 ||
        (allowInvalidGeneration && error?.code === 'INVALID_GENERATION') ||
        ['APIConnectionTimeoutError', 'AbortError', 'TimeoutError'].includes(error?.name) ||
        (typeof error?.status === 'number' && error.status >= 500)
    );
}

/**
 * Calls the Gemini REST API with structured JSON output and parses the JSON response.
 */
export async function callGeminiJson({
    systemPrompt,
    userPrompt,
    schema,
    maxOutputTokens,
    createError,
    messages = {},
}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw createError(503, 'AI_NOT_CONFIGURED', 'Gemini is not configured on this server.');
    }

    const url = `${GEMINI_CONFIG.endpoint}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;
    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            maxOutputTokens,
        },
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(GEMINI_CONFIG.timeoutMs),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 429) {
            throw createError(429, 'QUOTA_EXCEEDED', 'Gemini quota exceeded.');
        }
        throw createError(502, 'GEMINI_PROVIDER_ERROR', `Gemini returned ${message}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw createError(
            422,
            'PROVIDER_REFUSED',
            messages.refused ?? 'Gemini declined this generation request.'
        );
    }

    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) {
        throw createError(
            422,
            'INVALID_GENERATION',
            messages.empty ?? 'Gemini returned an empty response.'
        );
    }

    try {
        return JSON.parse(rawText);
    } catch {
        throw createError(
            422,
            'INVALID_GENERATION',
            messages.invalidJson ?? 'Gemini returned invalid JSON.'
        );
    }
}

/**
 * Executes generation against the configured primary AI provider, falling back
 * to the secondary provider on eligible transient or quota errors.
 */
export async function runWithAiFallback({
    label,
    runGemini,
    runGroq,
    allowInvalidGenerationFallback = false,
}) {
    const primary = getPrimaryProvider();

    if (primary === 'gemini') {
        try {
            return { result: await runGemini(), model: GEMINI_CONFIG.model };
        } catch (error) {
            if (isGroqConfigured() && isFallbackEligible(error, { allowInvalidGeneration: allowInvalidGenerationFallback })) {
                console.warn(`[${label}] Gemini attempt failed (${error?.message || error?.name}). Routing to Groq...`);
                return { result: await runGroq(createGroqClient()), model: AI_LIMITS.model };
            }
            throw error;
        }
    }

    try {
        return { result: await runGroq(createGroqClient()), model: AI_LIMITS.model };
    } catch (error) {
        if (isGeminiConfigured() && isFallbackEligible(error, { allowInvalidGeneration: allowInvalidGenerationFallback })) {
            console.warn(`[${label}] Groq attempt failed (${error?.message || error?.name}). Routing to Gemini...`);
            return { result: await runGemini(), model: GEMINI_CONFIG.model };
        }
        throw error;
    }
}
