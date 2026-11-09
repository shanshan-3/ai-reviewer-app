import { GEMINI_CONFIG } from '../config/ai.js';
import { quizMessages } from './quizPrompts.js';
import { validateGeneratedQuestions, quizError } from '../validation/quizValidation.js';

function buildGeminiSchema(questionType) {
    const questionProperties = {
        prompt: { type: 'STRING' },
        difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] },
        options: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    id: { type: 'STRING', enum: questionType === 'true_false' ? ['a', 'b'] : ['a', 'b', 'c', 'd'] },
                    text: questionType === 'true_false' ? { type: 'STRING', enum: ['True', 'False'] } : { type: 'STRING' }
                },
                required: ['id', 'text']
            }
        },
        correctOptionId: { type: 'STRING', enum: questionType === 'true_false' ? ['a', 'b'] : ['a', 'b', 'c', 'd'] },
        explanation: { type: 'STRING' },
        sources: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    sectionId: { type: 'STRING' },
                    excerpt: { type: 'STRING' }
                },
                required: ['sectionId', 'excerpt']
            }
        }
    };

    if (questionType === 'coding_syntax') {
        questionProperties.code = {
            type: 'OBJECT',
            properties: {
                language: { type: 'STRING' },
                text: { type: 'STRING' }
            },
            required: ['language', 'text']
        };
    }

    return {
        type: 'OBJECT',
        properties: {
            outcome: { type: 'STRING', enum: ['ready', 'insufficient_source', 'unsupported_topic'] },
            questions: {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: questionProperties,
                    required: Object.keys(questionProperties)
                }
            }
        },
        required: ['outcome', 'questions']
    };
}

export async function generateQuestionsWithGemini(settings, selected) {
    if (settings.source_kind === 'module' && !selected.sections.length) {
        return { questions: [], code: settings.question_type === 'coding_syntax' ? 'CODE_SOURCE_REQUIRED' : 'INSUFFICIENT_SOURCE' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw quizError(503, 'AI_NOT_CONFIGURED', 'Gemini backup is not configured on this server.');

    const messages = quizMessages(settings, selected.context);
    const systemPrompt = messages[0].content;
    const userPrompt = messages[1].content;
    const schema = buildGeminiSchema(settings.question_type);

    const url = `${GEMINI_CONFIG.endpoint}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;

    const payload = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }]
            }
        ],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(GEMINI_CONFIG.timeoutMs)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 429) throw Object.assign(quizError(429, 'QUOTA_EXCEEDED', 'Gemini quota exceeded.'), { status: 429 });
        throw quizError(502, 'GEMINI_PROVIDER_ERROR', `Gemini returned ${message}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw quizError(422, 'PROVIDER_REFUSED', 'Gemini declined this generation request.');
    }

    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) throw quizError(422, 'INVALID_GENERATION', 'Gemini returned an empty response.');

    let output;
    try {
        output = JSON.parse(rawText);
    } catch {
        throw quizError(422, 'INVALID_GENERATION', 'Gemini returned invalid JSON.');
    }

    if (settings.question_type !== 'coding_syntax' && Array.isArray(output.questions)) {
        for (const q of output.questions) {
            if (!q.code) q.code = null;
        }
    }

    return validateGeneratedQuestions(output, settings, selected.sections);
}
