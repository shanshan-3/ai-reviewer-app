function data(result) {
    if (result.error) throw result.error;
    return result.data;
}

export async function getSourceMaterial(admin, ownerId, materialId) {
    const rows = data(
        await admin
            .from('materials')
            .select('id, title, status, cleanup_pending, subject_id, topic_id')
            .eq('id', materialId)
            .eq('owner_id', ownerId)
            .limit(1)
    );
    return rows[0] ?? null;
}

export async function getSourceTopic(admin, ownerId, topicId) {
    const rows = data(
        await admin
            .from('topics')
            .select('id, name, subject_id, subjects(id, name)')
            .eq('id', topicId)
            .eq('owner_id', ownerId)
            .limit(1)
    );
    return rows[0] ?? null;
}

export async function getSourceSections(admin, ownerId, materialId, limit = 200) {
    return data(
        await admin
            .from('material_sections')
            .select('id, section_order, text, reference')
            .eq('material_id', materialId)
            .eq('owner_id', ownerId)
            .eq('eligible_for_generation', true)
            .order('section_order', { ascending: true })
            .limit(limit)
    );
}

export async function publishFlashcardSet(admin, ownerId, {
    title,
    sourceKind,
    materialId,
    subjectId,
    topicId,
    cards,
}) {
    const result = await admin.rpc('publish_flashcard_set', {
        p_owner_id: ownerId,
        p_title: title,
        p_source_kind: sourceKind,
        p_material_id: materialId,
        p_subject_id: subjectId,
        p_topic_id: topicId,
        p_cards: cards,
    });
    return data(result);
}

export async function listUserFlashcardSets(admin, ownerId) {
    const sets = data(
        await admin
            .from('flashcard_sets')
            .select(`
                id,
                title,
                source_kind,
                material_id,
                subject_id,
                topic_id,
                card_count,
                created_at,
                updated_at,
                materials (id, title),
                topics (id, name, subjects (id, name)),
                flashcard_reviews (id, completed_at)
            `)
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })
    );

    return sets.map(set => {
        const reviews = set.flashcard_reviews || [];
        reviews.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        const lastReviewedAt = reviews[0]?.completed_at ?? null;

        return {
            id: set.id,
            title: set.title,
            sourceKind: set.source_kind,
            materialId: set.material_id,
            materialTitle: set.materials?.title ?? null,
            topicId: set.topic_id,
            topicName: set.topics?.name ?? null,
            subjectName: set.topics?.subjects?.name ?? null,
            cardCount: set.card_count,
            reviewCount: reviews.length,
            lastReviewedAt,
            createdAt: set.created_at,
        };
    });
}

export async function getFlashcardSetWithCards(admin, ownerId, setId) {
    const setRows = data(
        await admin
            .from('flashcard_sets')
            .select(`
                id,
                title,
                source_kind,
                material_id,
                subject_id,
                topic_id,
                card_count,
                created_at,
                materials (id, title),
                topics (id, name, subjects (id, name))
            `)
            .eq('id', setId)
            .eq('owner_id', ownerId)
            .limit(1)
    );

    const set = setRows[0];
    if (!set) return null;

    const cards = data(
        await admin
            .from('flashcards')
            .select('id, card_order, term, definition, source_excerpt, created_at')
            .eq('set_id', setId)
            .eq('owner_id', ownerId)
            .order('card_order', { ascending: true })
    );

    return {
        id: set.id,
        title: set.title,
        sourceKind: set.source_kind,
        materialId: set.material_id,
        materialTitle: set.materials?.title ?? null,
        topicId: set.topic_id,
        topicName: set.topics?.name ?? null,
        subjectName: set.topics?.subjects?.name ?? null,
        cardCount: set.card_count,
        createdAt: set.created_at,
        cards: cards.map(c => ({
            id: c.id,
            order: c.card_order,
            term: c.term,
            definition: c.definition,
            sourceExcerpt: c.source_excerpt,
        })),
    };
}

export async function recordReview(admin, ownerId, setId, viewedCardCount) {
    const result = await admin.rpc('record_flashcard_review', {
        p_owner_id: ownerId,
        p_set_id: setId,
        p_viewed_card_count: viewedCardCount,
    });
    return data(result);
}

export async function deleteFlashcardSet(admin, ownerId, setId) {
    const result = await admin
        .from('flashcard_sets')
        .delete()
        .eq('id', setId)
        .eq('owner_id', ownerId);
    return data(result);
}
