import {
    AI_LIMITS,
    GEMINI_CONFIG,
    createGroqClient,
    isGroqConfigured,
    isGeminiConfigured,
    getPrimaryProvider,
} from '../config/ai.js';
import { flashcardSchema, buildGeminiFlashcardSchema, flashcardMessages } from './flashcardPrompts.js';
import { validateGeneratedFlashcards, flashcardError } from '../validation/flashcardValidation.js';

export function selectFlashcardContext(settings, source) {
    const sections = [];
    const schema = flashcardSchema(settings.source_kind);
    const context = settings.source_kind === 'topic'
        ? { subject: source.subjects?.name, topic: source.name }
        : { sections };

    const count = settings.card_count || 10;
    const byteLimit = Math.min(AI_LIMITS.promptBytes, count <= 5 ? 10240 : count <= 10 ? 16384 : 24576);
    const bytes = () =>
        Buffer.byteLength(JSON.stringify(flashcardMessages(settings, context))) +
        Buffer.byteLength(JSON.stringify(schema));

    if (settings.source_kind === 'module') {
        for (const item of source) {
            const compact = item.text.replace(/\s+/g, ' ').trim();
            if (!/[\p{L}\p{N}]/u.test(compact)) continue;
            const selected = { text: compact };
            sections.push(selected);
            if (bytes() > byteLimit) {
                selected.text = '';
                for (const character of compact) {
                    selected.text += character;
                    if (bytes() > byteLimit) {
                        selected.text = selected.text.slice(0, -character.length);
                        break;
                    }
                }
            }
            if (!/[\p{L}\p{N}]/u.test(selected.text)) sections.pop();
            if (bytes() >= byteLimit - 100) break;
        }
    }

    if (bytes() > byteLimit) {
        throw flashcardError(422, 'INSUFFICIENT_SOURCE', 'The selected context exceeds the generation limit.');
    }

    return { context, sections };
}

async function generateWithGroq(client, settings, selected) {
    if (settings.source_kind === 'module' && !selected.sections.length) {
        return { outcome: 'insufficient_source', cards: [] };
    }

    const maxTokens = Math.min(AI_LIMITS.completionTokens, Math.max(1024, (settings.card_count || 10) * 180));
    const response = await client.chat.completions.create({
        model: AI_LIMITS.model,
        messages: flashcardMessages(settings, selected.context),
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'it_flashcards',
                strict: true,
                schema: flashcardSchema(settings.source_kind),
            },
        },
        max_completion_tokens: maxTokens,
        reasoning_effort: 'low',
        stream: false,
    });

    const choice = response.choices?.[0];
    if (choice?.message?.refusal) {
        throw flashcardError(422, 'PROVIDER_REFUSED', 'The provider declined this generation request.');
    }
    if (choice?.finish_reason !== 'stop') {
        throw flashcardError(422, 'INVALID_GENERATION', 'The provider returned incomplete flashcards.');
    }

    let output;
    try {
        output = JSON.parse(choice.message.content);
    } catch {
        throw flashcardError(422, 'INVALID_GENERATION', 'The provider returned unreadable flashcard JSON.');
    }

    return validateGeneratedFlashcards(output, settings);
}

async function generateWithGemini(settings, selected) {
    if (settings.source_kind === 'module' && !selected.sections.length) {
        return { outcome: 'insufficient_source', cards: [] };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw flashcardError(503, 'AI_NOT_CONFIGURED', 'Gemini is not configured on this server.');

    const messages = flashcardMessages(settings, selected.context);
    const systemPrompt = messages[0].content;
    const userPrompt = messages[1].content;
    const schema = buildGeminiFlashcardSchema(settings.source_kind);
    const maxOutputTokens = Math.min(4096, Math.max(1024, (settings.card_count || 10) * 180));

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
            const err = flashcardError(429, 'QUOTA_EXCEEDED', 'Gemini quota exceeded.');
            err.status = 429;
            throw err;
        }
        throw flashcardError(502, 'GEMINI_PROVIDER_ERROR', `Gemini returned ${message}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw flashcardError(422, 'PROVIDER_REFUSED', 'Gemini declined this flashcard generation request.');
    }

    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) throw flashcardError(422, 'INVALID_GENERATION', 'Gemini returned an empty flashcard response.');

    let output;
    try {
        output = JSON.parse(rawText);
    } catch {
        throw flashcardError(422, 'INVALID_GENERATION', 'Gemini returned unreadable flashcard JSON.');
    }

    return validateGeneratedFlashcards(output, settings);
}

function isFallbackEligible(error) {
    return (
        error?.status === 429 ||
        ['APIConnectionTimeoutError', 'AbortError', 'TimeoutError'].includes(error?.name) ||
        (typeof error?.status === 'number' && error.status >= 500)
    );
}

export async function generateFlashcards(settings, selected) {
    const primary = getPrimaryProvider();

    if (primary === 'gemini') {
        try {
            return await generateWithGemini(settings, selected);
        } catch (error) {
            if (isGroqConfigured() && isFallbackEligible(error)) {
                console.warn(`[Flashcard AI Fallback] Gemini attempt failed (${error?.message}). Routing to Groq...`);
                const groqClient = createGroqClient();
                return await generateWithGroq(groqClient, settings, selected);
            }
            throw error;
        }
    } else {
        try {
            const groqClient = createGroqClient();
            return await generateWithGroq(groqClient, settings, selected);
        } catch (error) {
            if (isGeminiConfigured() && isFallbackEligible(error)) {
                console.warn(`[Flashcard AI Fallback] Groq attempt failed (${error?.message}). Routing to Gemini...`);
                return await generateWithGemini(settings, selected);
            }
            throw error;
        }
    }
}
