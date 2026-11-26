import { AI_LIMITS } from '../config/ai.js';
import { flashcardSchema, buildGeminiFlashcardSchema, flashcardMessages } from './flashcardPrompts.js';
import { validateGeneratedFlashcards, flashcardError } from '../validation/flashcardValidation.js';
import {
    callGeminiJson,
    getPromptByteBudget,
    runWithAiFallback,
    trimTextToByteBudget,
} from './aiProvider.js';

export function selectFlashcardContext(settings, source) {
    const sections = [];
    const schema = flashcardSchema(settings.source_kind);
    const context = settings.source_kind === 'topic'
        ? { subject: source.subjects?.name, topic: source.name }
        : { sections };

    const count = settings.card_count || 10;
    const byteLimit = getPromptByteBudget(count);
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
                selected.text = trimTextToByteBudget(compact, byteLimit, text => {
                    selected.text = text;
                    return bytes();
                });
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

    const messages = flashcardMessages(settings, selected.context);
    const schema = buildGeminiFlashcardSchema(settings.source_kind);
    const maxOutputTokens = Math.min(4096, Math.max(1024, (settings.card_count || 10) * 180));

    const output = await callGeminiJson({
        systemPrompt: messages[0].content,
        userPrompt: messages[1].content,
        schema,
        maxOutputTokens,
        createError: flashcardError,
        messages: {
            refused: 'Gemini declined this flashcard generation request.',
            empty: 'Gemini returned an empty flashcard response.',
            invalidJson: 'Gemini returned unreadable flashcard JSON.',
        },
    });

    return validateGeneratedFlashcards(output, settings);
}

export async function generateFlashcards(settings, selected) {
    const { result } = await runWithAiFallback({
        label: 'Flashcard AI Fallback',
        runGemini: () => generateWithGemini(settings, selected),
        runGroq: client => generateWithGroq(client, settings, selected),
    });
    return result;
}
