import { createSupabaseAdminClient } from '../config/supabase.js';
import { createGroqClient, AI_LIMITS } from '../config/ai.js';
import * as model from '../models/quizModel.js';
import { validateGenerationRequest, validateQuizId, sameGenerationInput, quizError } from '../validation/quizValidation.js';
import { selectQuizContext, generateQuestions, generationFailure } from './quizGeneration.js';

// shortcut: one active process and one provider attempt per minute; shared admission is required before scaling.
let working = false;
let nextProviderAt = 0;

function existingRequest(row, input) {
    if (!sameGenerationInput(row, input)) throw quizError(409, 'REQUEST_CONFLICT', 'This request ID already belongs to different quiz choices.');
    return row;
}
function notFound() { return quizError(404, 'NOT_FOUND', 'Quiz resource not found.'); }

async function sourceFor(admin, ownerId, input) {
    if (input.source_kind === 'topic') {
        const topic = await model.getSourceTopic(admin, ownerId, input.topic_id);
        if (!topic) throw notFound();
        return { settings: { ...input, subject_id: topic.subject_id }, source: topic };
    }
    const material = await model.getSourceMaterial(admin, ownerId, input.material_id);
    if (!material) throw notFound();
    if (material.status !== 'ready' || material.cleanup_pending) throw quizError(409, 'MODULE_NOT_READY', 'Review and approve this module before generating a quiz.');
    const sections = await model.getSourceSections(admin, ownerId, material.id, AI_LIMITS.sourceSections);
    return { settings: { ...input, subject_id: material.subject_id, topic_id: material.topic_id }, source: sections };
}

async function runGeneration(admin, client, row, selected) {
    try {
        const result = await generateQuestions(client, row, selected);
        if (!result.questions.length) await model.finishGeneration(admin, row.owner_id, row.id, 'insufficient_source', result.code);
        else await model.publishQuiz(admin, row.owner_id, row.id, result.questions, AI_LIMITS.model);
    } catch (error) {
        // A lost publish acknowledgement must not turn an already committed quiz into a failure.
        try { await model.finishGeneration(admin, row.owner_id, row.id, 'failed', generationFailure(error)); }
        catch { console.error('Quiz generation status could not be saved; restart recovery is required.'); }
    } finally { working = false; }
}

export async function startGeneration({ userId, body }) {
    const input = validateGenerationRequest(body);
    const admin = createSupabaseAdminClient();
    const previous = await model.findGeneration(admin, userId, 'request_id', input.request_id);
    if (previous) return existingRequest(previous, input);
    if (working || Date.now() < nextProviderAt) {
        throw Object.assign(quizError(429, 'GENERATION_BUSY', 'Quiz generation is busy. Try again shortly.'),
            { retryAfter: Math.max(5, Math.ceil((nextProviderAt - Date.now()) / 1000)) });
    }
    working = true;
    let scheduled = false;
    try {
        let client;
        try { client = createGroqClient(); }
        catch { throw quizError(503, 'AI_NOT_CONFIGURED', 'Quiz generation is not configured on this server.'); }
        const { settings, source } = await sourceFor(admin, userId, input);
        const selected = selectQuizContext(settings, source);
        let row;
        try { row = await model.createGeneration(admin, { ...settings, owner_id: userId }); }
        catch (error) {
            if (error.code === '23505') {
                const duplicate = await model.findGeneration(admin, userId, 'request_id', input.request_id);
                if (duplicate) return existingRequest(duplicate, input);
            }
            if (error.message === 'MODULE_NOT_READY') throw quizError(409, 'MODULE_NOT_READY', 'This module is no longer ready. Reload your modules.');
            throw error;
        }
        if (row.source_kind === 'topic' || selected.sections.length) nextProviderAt = Date.now() + AI_LIMITS.cooldownMs;
        scheduled = true;
        void runGeneration(admin, client, row, selected);
        return row;
    } finally { if (!scheduled) working = false; }
}

export async function generationStatus({ userId, id, row }) {
    const admin = createSupabaseAdminClient();
    const current = row ?? await model.findGeneration(admin, userId, 'id', validateQuizId(id));
    if (!current) throw notFound();
    const quiz = current.status === 'ready' ? await model.getQuiz(admin, userId, 'generation_id', current.id) : null;
    if (current.status === 'ready' && !quiz) throw quizError(503, 'SERVICE_UNAVAILABLE', 'Quiz status could not be loaded. Retry this request.');
    return { id: current.id, status: current.status, quizId: quiz?.id ?? null, errorCode: current.error_code ?? null };
}

export async function readQuiz({ userId, id }) {
    const admin = createSupabaseAdminClient();
    const quiz = await model.getQuiz(admin, userId, 'id', validateQuizId(id));
    if (!quiz) throw notFound();
    const row = await model.findGeneration(admin, userId, 'id', quiz.generation_id);
    if (!row || row.status !== 'ready') throw notFound();
    return { id: quiz.id, source: row.source_kind === 'module' ? { kind: 'module', materialId: row.material_id }
        : { kind: 'topic', topicId: row.topic_id }, subjectId: row.subject_id, topicId: row.topic_id,
        questionType: row.question_type, requestedQuestionCount: row.requested_question_count,
        questionCount: quiz.question_count, startingDifficulty: row.starting_difficulty };
}

export async function recoverPendingGenerations() {
    await model.recoverGenerations(createSupabaseAdminClient());
}
