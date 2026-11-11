import { createSupabaseAdminClient } from '../config/supabase.js';
import * as model from '../models/flashcardModel.js';
import {
    validateFlashcardGenerationRequest,
    flashcardError,
} from '../validation/flashcardValidation.js';
import { selectFlashcardContext, generateFlashcards } from './flashcardGeneration.js';

function notFound(message = 'Flashcard set not found.') {
    return flashcardError(404, 'NOT_FOUND', message);
}

export async function createFlashcardSet({ userId, body }) {
    const input = validateFlashcardGenerationRequest(body);
    const admin = createSupabaseAdminClient();

    let subjectId;
    let topicId;
    let defaultTitle;
    let sourceContent;

    if (input.source_kind === 'topic') {
        const topic = await model.getSourceTopic(admin, userId, input.topic_id);
        if (!topic) throw notFound('Selected topic not found.');
        subjectId = topic.subject_id;
        topicId = topic.id;
        const topicDisplayName = topic.name && topic.name !== 'General'
            ? topic.name
            : (topic.subjects?.name || 'IT Review');
        defaultTitle = `${topicDisplayName} Flashcards`;
        sourceContent = topic;
    } else {
        const material = await model.getSourceMaterial(admin, userId, input.material_id);
        if (!material) throw notFound('Selected module not found.');
        if (material.status !== 'ready' || material.cleanup_pending) {
            throw flashcardError(409, 'MODULE_NOT_READY', 'Review and approve this module before generating flashcards.');
        }
        subjectId = material.subject_id;
        topicId = material.topic_id;
        defaultTitle = `${material.title} Flashcards`;
        sourceContent = await model.getSourceSections(admin, userId, material.id);
    }

    const title = input.title || defaultTitle;
    const selected = selectFlashcardContext(input, sourceContent);
    const generationResult = await generateFlashcards(input, selected);

    if (generationResult.outcome === 'insufficient_source' || !generationResult.cards.length) {
        throw flashcardError(422, 'INSUFFICIENT_SOURCE', 'The source material does not contain enough technical terms to generate flashcards.');
    }

    const setId = await model.publishFlashcardSet(admin, userId, {
        title,
        sourceKind: input.source_kind,
        materialId: input.material_id,
        subjectId,
        topicId,
        cards: generationResult.cards,
    });

    return {
        setId,
        title,
        cardCount: generationResult.cards.length,
        cards: generationResult.cards,
    };
}

export async function listFlashcardSets({ userId }) {
    const admin = createSupabaseAdminClient();
    const sets = await model.listUserFlashcardSets(admin, userId);
    return { sets };
}

export async function readFlashcardSet({ userId, setId }) {
    const admin = createSupabaseAdminClient();
    const set = await model.getFlashcardSetWithCards(admin, userId, setId);
    if (!set) throw notFound();
    return { set };
}

export async function recordFlashcardCompletion({ userId, setId, viewedCardCount }) {
    const admin = createSupabaseAdminClient();
    const reviewId = await model.recordReview(admin, userId, setId, viewedCardCount);
    return { reviewId, setId, completed: true };
}

export async function removeFlashcardSet({ userId, setId }) {
    const admin = createSupabaseAdminClient();
    await model.deleteFlashcardSet(admin, userId, setId);
    return { deleted: true };
}
