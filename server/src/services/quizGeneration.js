import { AI_LIMITS } from '../config/ai.js';
import { quizSchema, quizMessages } from './quizPrompts.js';
import { validateGeneratedQuestions, quizError } from '../validation/quizValidation.js';

export function selectQuizContext(settings, source) {
    const sections = [];
    const promptSections = [];
    const schema = quizSchema(settings.question_type, settings.starting_difficulty, settings.source_kind);
    const context = settings.source_kind === 'topic' ? { subject: source.subjects?.name, topic: source.name } : { sections: promptSections };
    const count = settings.requested_question_count || 10;
    const byteLimit = Math.min(AI_LIMITS.promptBytes, count <= 5 ? 10240 : count <= 10 ? 16384 : 24576);
    const bytes = () => Buffer.byteLength(JSON.stringify(quizMessages(settings, context)))
        + Buffer.byteLength(JSON.stringify(schema));
    if (settings.source_kind === 'module') {
        // shortcut: inspect the first 200 approved sections; add retrieval ranking when evaluation warrants it.
        for (const item of source) {
            if (settings.question_type === 'coding_syntax'
                && !/[{};]|\b(?:def |function |class |SELECT\b[\s\S]*\bFROM|console\.)/i.test(item.text)) continue;
            const compact = item.text.replace(/\s+/g, ' ').trim();
            if (!/[\p{L}\p{N}]/u.test(compact)) continue;
            const entry = { id: item.id, text: compact };
            promptSections.push(entry);
            if (bytes() > byteLimit) {
                entry.text = '';
                for (const character of compact) {
                    entry.text += character;
                    if (bytes() > byteLimit) { entry.text = entry.text.slice(0, -character.length); break; }
                }
            }
            if (!/[\p{L}\p{N}]/u.test(entry.text)) {
                promptSections.pop();
            } else {
                sections.push({ id: item.id, text: item.text, reference: item.reference });
            }
            if (bytes() >= byteLimit - 100) break;
        }
    }
    if (bytes() > byteLimit) throw quizError(422, 'INSUFFICIENT_SOURCE', 'The selected topic exceeds the generation context limit.');
    return { context, sections };
}

export async function generateQuestions(client, settings, selected) {
    if (settings.source_kind === 'module' && !selected.sections.length) {
        return { questions: [], code: settings.question_type === 'coding_syntax' ? 'CODE_SOURCE_REQUIRED' : 'INSUFFICIENT_SOURCE' };
    }
    const maxTokens = Math.min(AI_LIMITS.completionTokens, Math.max(1536, (settings.requested_question_count || 10) * 320));
    const response = await client.chat.completions.create({
        model: AI_LIMITS.model, messages: quizMessages(settings, selected.context),
        response_format: { type: 'json_schema', json_schema: { name: 'it_quiz', strict: true, schema: quizSchema(settings.question_type, settings.starting_difficulty, settings.source_kind) } },
        max_completion_tokens: maxTokens, reasoning_effort: 'low', stream: false,
    });
    const choice = response.choices?.[0];
    if (choice?.message?.refusal) throw quizError(422, 'PROVIDER_REFUSED', 'The provider declined this generation request.');
    if (choice?.finish_reason !== 'stop') throw quizError(422, 'INVALID_GENERATION', 'The provider returned an incomplete quiz.');
    let output;
    try { output = JSON.parse(choice.message.content); }
    catch { throw quizError(422, 'INVALID_GENERATION', 'The provider returned an unreadable quiz.'); }
    if (settings.source_kind === 'topic' && Array.isArray(output.questions)) {
        for (const q of output.questions) {
            if (!Array.isArray(q.sources)) q.sources = [];
        }
    }
    return validateGeneratedQuestions(output, settings, selected.sections);
}

export function generationFailure(error) {
    if (error?.status === 429) return 'QUOTA_EXCEEDED';
    if (['APIConnectionTimeoutError', 'AbortError', 'TimeoutError'].includes(error?.name)) return 'PROVIDER_TIMEOUT';
    if (['PROVIDER_REFUSED', 'INVALID_GENERATION'].includes(error?.code)) return error.code;
    return 'GENERATION_FAILED';
}
