const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function flashcardError(status, code, publicMessage) {
    const error = new Error(publicMessage);
    error.status = status;
    error.code = code;
    error.publicMessage = publicMessage;
    return error;
}

export function validateFlashcardGenerationRequest(body) {
    if (!body || typeof body !== 'object') {
        throw flashcardError(400, 'INVALID_REQUEST', 'Request body must be a JSON object.');
    }

    const { source, cardCount = 10, title } = body;

    if (!source || typeof source !== 'object') {
        throw flashcardError(400, 'INVALID_SOURCE', 'Select a module or topic.');
    }

    const sourceKind = source.kind;
    if (sourceKind !== 'module' && sourceKind !== 'topic') {
        throw flashcardError(400, 'INVALID_SOURCE_KIND', 'Source must be "module" or "topic".');
    }

    let materialId = null;
    let topicId = null;

    if (sourceKind === 'module') {
        if (!source.materialId || !UUID_PATTERN.test(String(source.materialId))) {
            throw flashcardError(400, 'INVALID_MATERIAL_ID', 'Select a valid module.');
        }
        materialId = String(source.materialId).toLowerCase();
    } else {
        if (!source.topicId || !UUID_PATTERN.test(String(source.topicId))) {
            throw flashcardError(400, 'INVALID_TOPIC_ID', 'Select a valid topic.');
        }
        topicId = String(source.topicId).toLowerCase();
    }

    const parsedCount = Number(cardCount);
    if (![5, 10, 15, 20].includes(parsedCount)) {
        throw flashcardError(400, 'INVALID_CARD_COUNT', 'Card count must be 5, 10, 15, or 20.');
    }

    const cleanTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : null;

    return {
        source_kind: sourceKind,
        material_id: materialId,
        topic_id: topicId,
        card_count: parsedCount,
        title: cleanTitle,
    };
}

export function validateGeneratedFlashcards(output, settings) {
    if (!output || typeof output !== 'object') {
        throw flashcardError(422, 'INVALID_GENERATION', 'The provider returned an invalid format.');
    }

    if (output.outcome === 'unsupported_topic') {
        throw flashcardError(422, 'UNSUPPORTED_TOPIC', 'The selected topic is outside IT curriculum scope.');
    }

    if (output.outcome === 'insufficient_source') {
        return { outcome: 'insufficient_source', cards: [] };
    }

    if (!Array.isArray(output.cards) || output.cards.length === 0) {
        if (settings.source_kind === 'module') {
            return { outcome: 'insufficient_source', cards: [] };
        }
        throw flashcardError(422, 'INVALID_GENERATION', 'The provider generated no cards.');
    }

    const seenTerms = new Set();
    const validCards = [];

    for (const card of output.cards) {
        if (!card || typeof card !== 'object') continue;
        const term = String(card.term ?? '').trim();
        const definition = String(card.definition ?? '').trim();
        const sourceExcerpt = card.sourceExcerpt ? String(card.sourceExcerpt).trim().slice(0, 500) : null;

        if (!term || !definition) continue;

        const normalizedTerm = term.toLowerCase();
        if (seenTerms.has(normalizedTerm)) continue;
        seenTerms.add(normalizedTerm);

        validCards.push({
            term: term.slice(0, 150),
            definition: definition.slice(0, 600),
            source_excerpt: sourceExcerpt,
        });

        if (validCards.length >= settings.card_count) break;
    }

    if (validCards.length === 0) {
        return { outcome: 'insufficient_source', cards: [] };
    }

    return {
        outcome: 'ready',
        cards: validCards,
    };
}
