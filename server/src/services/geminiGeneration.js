import { quizMessages } from './quizPrompts.js';
import { validateGeneratedQuestions, quizError } from '../validation/quizValidation.js';
import { callGeminiJson } from './aiProvider.js';

function buildGeminiSchema(questionType, difficulty, sourceKind = 'module') {
    const questionProperties = {
        prompt: { type: 'STRING' },
        difficulty: { type: 'STRING', enum: difficulty ? [difficulty] : ['easy', 'medium', 'hard'] },
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
    };

    if (sourceKind === 'module') {
        questionProperties.sources = {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    sectionId: { type: 'STRING' },
                    excerpt: { type: 'STRING' }
                },
                required: ['sectionId', 'excerpt']
            }
        };
    }

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

    const messages = quizMessages(settings, selected.context);
    const schema = buildGeminiSchema(settings.question_type, settings.starting_difficulty, settings.source_kind);
    const maxOutputTokens = Math.min(8192, Math.max(1536, (settings.requested_question_count || 10) * 320));

    const output = await callGeminiJson({
        systemPrompt: messages[0].content,
        userPrompt: messages[1].content,
        schema,
        maxOutputTokens,
        createError: quizError,
    });

    if (Array.isArray(output.questions)) {
        for (const q of output.questions) {
            if (settings.question_type !== 'coding_syntax' && !q.code) q.code = null;
            if (settings.source_kind === 'topic' && !Array.isArray(q.sources)) q.sources = [];
        }
    }

    return validateGeneratedQuestions(output, settings, selected.sections);
}
