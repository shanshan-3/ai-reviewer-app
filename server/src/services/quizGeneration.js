import { AI_LIMITS } from '../config/ai.js';
import { quizSchema, quizMessages } from './quizPrompts.js';
import { validateGeneratedQuestions, quizError } from '../validation/quizValidation.js';

export function selectQuizContext(settings, source) {
    const sections = [];
    const schema = quizSchema(settings.question_type);
    const context = settings.source_kind === 'topic' ? { subject: source.subjects?.name, topic: source.name } : { sections };
    const bytes = () => Buffer.byteLength(JSON.stringify(quizMessages(settings, context)))
        + Buffer.byteLength(JSON.stringify(schema));
    if (settings.source_kind === 'module') {
        // shortcut: inspect the first 200 approved sections; add retrieval ranking when evaluation warrants it.
        for (const item of source) {
            if (settings.question_type === 'coding_syntax'
                && !/[{};]|\b(?:def |function |class |SELECT\b[\s\S]*\bFROM|console\.)/i.test(item.text)) continue;
            const selected = { id: item.id, text: '', reference: item.reference };
            sections.push(selected);
            for (const character of item.text) {
                selected.text += character;
                if (bytes() > AI_LIMITS.promptBytes) { selected.text = selected.text.slice(0, -character.length); break; }
            }
            if (!/[\p{L}\p{N}]/u.test(selected.text)) sections.pop();
            if (bytes() >= AI_LIMITS.promptBytes - 100) break;
        }
    }
    if (bytes() > AI_LIMITS.promptBytes) throw quizError(422, 'INSUFFICIENT_SOURCE', 'The selected topic exceeds the generation context limit.');
    return { context, sections };
}

export async function generateQuestions(client, settings, selected) {
    if (settings.source_kind === 'module' && !selected.sections.length) {
        return { questions: [], code: settings.question_type === 'coding_syntax' ? 'CODE_SOURCE_REQUIRED' : 'INSUFFICIENT_SOURCE' };
    }
    const response = await client.chat.completions.create({
        model: AI_LIMITS.model, messages: quizMessages(settings, selected.context),
        response_format: { type: 'json_schema', json_schema: { name: 'it_quiz', strict: true, schema: quizSchema(settings.question_type) } },
        max_completion_tokens: AI_LIMITS.completionTokens, reasoning_effort: 'low', stream: false,
    });
    const choice = response.choices?.[0];
    if (choice?.message?.refusal) throw quizError(422, 'PROVIDER_REFUSED', 'The provider declined this generation request.');
    if (choice?.finish_reason !== 'stop') throw quizError(422, 'INVALID_GENERATION', 'The provider returned an incomplete quiz.');
    let output;
    try { output = JSON.parse(choice.message.content); }
    catch { throw quizError(422, 'INVALID_GENERATION', 'The provider returned an unreadable quiz.'); }
    return validateGeneratedQuestions(output, settings, selected.sections);
}

export function generationFailure(error) {
    if (error?.status === 429) return 'QUOTA_EXCEEDED';
    if (['APIConnectionTimeoutError', 'AbortError'].includes(error?.name)) return 'PROVIDER_TIMEOUT';
    if (['PROVIDER_REFUSED', 'INVALID_GENERATION'].includes(error?.code)) return error.code;
    return 'GENERATION_FAILED';
}
