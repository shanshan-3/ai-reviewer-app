import { createSupabaseAdminClient } from '../config/supabase.js';
import {
    createGroqClient,
    AI_LIMITS,
    GEMINI_CONFIG,
    isGroqConfigured,
    isGeminiConfigured,
    getPrimaryProvider,
    isPrimaryAiConfigured,
    getCooldownMs,
} from '../config/ai.js';
import * as model from '../models/quizModel.js';
import { validateGenerationRequest, validateQuizId, sameGenerationInput, quizError } from '../validation/quizValidation.js';
import { selectQuizContext, generateQuestions, generationFailure } from './quizGeneration.js';
import { generateQuestionsWithGemini } from './geminiGeneration.js';

// shortcut: one active process and one provider attempt per minute; shared admission is required before scaling.
let working = false;
let nextProviderAt = 0;

function isFallbackEligible(error) {
    return (
        error?.status === 429 ||
        ['APIConnectionTimeoutError', 'AbortError', 'TimeoutError'].includes(error?.name) ||
        (typeof error?.status === 'number' && error.status >= 500)
    );
}

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

async function runGeneration(admin, row, selected) {
    try {
        let result;
        let providerModel;
        const primary = getPrimaryProvider();

        if (primary === 'gemini') {
            try {
                result = await generateQuestionsWithGemini(row, selected);
                providerModel = GEMINI_CONFIG.model;
            } catch (error) {
                if (isGroqConfigured() && isFallbackEligible(error)) {
                    console.warn(`[AI Fallback] Gemini primary attempt failed (${error?.message || error?.name}). Routing to Groq backup...`);
                    const groqClient = createGroqClient();
                    result = await generateQuestions(groqClient, row, selected);
                    providerModel = AI_LIMITS.model;
                } else {
                    throw error;
                }
            }
        } else {
            try {
                const groqClient = createGroqClient();
                result = await generateQuestions(groqClient, row, selected);
                providerModel = AI_LIMITS.model;
            } catch (error) {
                if (isGeminiConfigured() && isFallbackEligible(error)) {
                    console.warn(`[AI Fallback] Groq primary attempt failed (${error?.message || error?.name}). Routing to Gemini backup...`);
                    result = await generateQuestionsWithGemini(row, selected);
                    providerModel = GEMINI_CONFIG.model;
                } else {
                    throw error;
                }
            }
        }

        if (!result.questions.length) await model.finishGeneration(admin, row.owner_id, row.id, 'insufficient_source', result.code);
        else await model.publishQuiz(admin, row.owner_id, row.id, result.questions, providerModel);
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
    if (working) {
        throw Object.assign(quizError(429, 'GENERATION_BUSY', 'A quiz is currently being generated. Please wait a moment.'),
            { retryAfter: 5 });
    }
    if (Date.now() < nextProviderAt) {
        const secondsRemaining = Math.max(1, Math.ceil((nextProviderAt - Date.now()) / 1000));
        throw Object.assign(quizError(429, 'GENERATION_BUSY', `Rate limit cooldown active. Please wait ${secondsRemaining}s before generating.`),
            { retryAfter: secondsRemaining });
    }
    working = true;
    let scheduled = false;
    try {
        if (!isPrimaryAiConfigured()) {
            throw quizError(503, 'AI_NOT_CONFIGURED', 'Quiz generation is not configured on this server.');
        }
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
        if (row.source_kind === 'topic' || selected.sections.length) nextProviderAt = Date.now() + getCooldownMs(row.requested_question_count);
        scheduled = true;
        void runGeneration(admin, row, selected);
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

export async function startSession({ userId, quizId }) {
    const validQuizId = validateQuizId(quizId);
    const admin = createSupabaseAdminClient();
    let res;
    try {
        res = await model.startStudySession(admin, userId, validQuizId);
    } catch (err) {
        if (err.message === 'QUIZ_NOT_FOUND') throw notFound();
        throw err;
    }
    const session = res.session;
    const currentQuestion = session.current_question_id
        ? await model.getSafeQuestion(admin, userId, session.id, session.current_question_id)
        : null;
    const answers = await model.getSessionAnswers(admin, userId, session.id);
    return { isNew: res.is_new, session, currentQuestion, answers };
}

export async function readSession({ userId, sessionId }) {
    const validSessionId = validateQuizId(sessionId);
    const admin = createSupabaseAdminClient();
    const session = await model.findStudySession(admin, userId, validSessionId);
    if (!session) throw notFound();
    const currentQuestion = session.status === 'active' && session.current_question_id
        ? await model.getSafeQuestion(admin, userId, session.id, session.current_question_id)
        : null;
    const answers = await model.getSessionAnswers(admin, userId, session.id);
    return { session, currentQuestion, answers };
}

export async function recordAnswer({ userId, sessionId, questionId, optionId }) {
    const validSessionId = validateQuizId(sessionId);
    const validQuestionId = validateQuizId(questionId);
    if (typeof optionId !== 'string' || !['a', 'b', 'c', 'd'].includes(optionId.toLowerCase())) {
        throw quizError(400, 'INVALID_OPTION', 'Choose a valid option.');
    }
    const admin = createSupabaseAdminClient();
    let res;
    try {
        res = await model.submitStudyAnswer(admin, userId, validSessionId, validQuestionId, optionId.toLowerCase());
    } catch (err) {
        if (err.message === 'SESSION_NOT_FOUND' || err.message === 'QUESTION_NOT_FOUND') throw notFound();
        if (err.message === 'ANSWER_CONFLICT') throw quizError(409, 'ANSWER_CONFLICT', 'This question was already answered with a different choice.');
        if (err.message === 'QUESTION_NOT_CURRENT') throw quizError(409, 'QUESTION_NOT_CURRENT', 'Answer the current question first.');
        if (err.message === 'SESSION_COMPLETED') throw quizError(409, 'SESSION_COMPLETED', 'This session has already been completed.');
        throw err;
    }

    const currentQuestion = res.nextQuestionId
        ? await model.getSafeQuestion(admin, userId, validSessionId, res.nextQuestionId)
        : null;

    return {
        submission: res.submission,
        session: res.session,
        currentQuestion,
    };
}

export async function readResults({ userId, sessionId }) {
    const validSessionId = validateQuizId(sessionId);
    const admin = createSupabaseAdminClient();
    const results = await model.getCompletedResults(admin, userId, validSessionId);
    if (!results) throw notFound();
    if (results.status === 'incomplete') {
        throw quizError(409, 'SESSION_INCOMPLETE', 'Results are available only after completing the entire quiz.');
    }
    return results;
}

export async function listQuizzes({ userId }) {
    const admin = createSupabaseAdminClient();
    return await model.listUserQuizzes(admin, userId);
}

export async function removeQuiz({ userId, quizId }) {
    const validQuizId = validateQuizId(quizId);
    const admin = createSupabaseAdminClient();
    const deleted = await model.deleteQuiz(admin, userId, validQuizId);
    if (!deleted) throw notFound();
    return { success: true };
}
