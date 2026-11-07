const GENERATION_FIELDS = 'id,owner_id,request_id,source_kind,material_id,subject_id,topic_id,question_type,requested_question_count,starting_difficulty,status,error_code';
function data(result) { if (result.error) throw result.error; return result.data; }

export async function findGeneration(admin, ownerId, column, id) {
    return data(await admin.from('quiz_generations').select(GENERATION_FIELDS).eq('owner_id', ownerId).eq(column, id).maybeSingle());
}
export async function createGeneration(admin, row) {
    return data(await admin.from('quiz_generations').insert(row).select(GENERATION_FIELDS).single());
}
export async function getSourceMaterial(admin, ownerId, id) {
    return data(await admin.from('materials').select('id,status,cleanup_pending,subject_id,topic_id').eq('owner_id', ownerId).eq('id', id).maybeSingle());
}
export async function getSourceTopic(admin, ownerId, id) {
    return data(await admin.from('topics').select('id,subject_id,name,subjects!inner(name)').eq('owner_id', ownerId).eq('id', id).maybeSingle());
}
export async function getSourceSections(admin, ownerId, id, limit) {
    return data(await admin.from('material_sections').select('id,text,reference').eq('owner_id', ownerId)
        .eq('material_id', id).eq('eligible_for_generation', true).order('section_order').limit(limit));
}
export async function getQuiz(admin, ownerId, column, id) {
    return data(await admin.from('quizzes').select('id,generation_id,question_count').eq('owner_id', ownerId).eq(column, id).maybeSingle());
}
export async function publishQuiz(admin, ownerId, generationId, questions, model) {
    return data(await admin.rpc('publish_quiz', { p_owner_id: ownerId, p_generation_id: generationId,
        p_questions: questions, p_model: model }));
}
export async function finishGeneration(admin, ownerId, id, status, code) {
    return data(await admin.from('quiz_generations').update({ status, error_code: code }).eq('owner_id', ownerId)
        .eq('id', id).eq('status', 'processing').select('id'));
}
export async function recoverGenerations(admin) {
    data(await admin.rpc('recover_quiz_generations'));
}
