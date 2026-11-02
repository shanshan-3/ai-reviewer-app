const MATERIAL_FIELDS = 'id,owner_id,title,original_filename,mime_type,file_bytes,storage_path,subject_id,topic_id,status,warnings,error_code,created_at';
function data(result) {
    if (result.error) throw result.error;
    return result.data;
}

export async function createMaterial(admin, row) {
    return data(await admin.from('materials').insert(row).select(MATERIAL_FIELDS).single());
}
export async function getPendingImports(admin) {
    return data(await admin.from('materials').select('id,owner_id,storage_path')
        .eq('cleanup_pending', true).order('id').limit(50));
}
export async function getMaterial(client, id, ownerId) {
    return data(await client.from('materials').select(MATERIAL_FIELDS).eq('id', id).eq('owner_id', ownerId).maybeSingle());
}
export async function getSections(client, id, ownerId) {
    return data(await client.from('material_sections').select('id,section_order,text,reference,eligible_for_generation')
        .eq('material_id', id).eq('owner_id', ownerId).order('section_order'));
}
export async function saveSections(admin, id, ownerId, sections) {
    data(await admin.from('material_sections').insert(sections.map((section, index) => ({
        material_id: id, owner_id: ownerId, section_order: index + 1,
        text: section.text, reference: section.reference, eligible_for_generation: false,
    }))));
}
export async function updateMaterial(admin, id, ownerId, patch) {
    return data(await admin.from('materials').update(patch).eq('id', id).eq('owner_id', ownerId)
        .select(MATERIAL_FIELDS).single());
}
export async function clearSections(admin, id, ownerId) {
    data(await admin.from('material_sections').delete().eq('material_id', id).eq('owner_id', ownerId));
}
export async function uploadFile(client, storagePath, bytes, mime) {
    data(await client.storage.from('modules').upload(storagePath, bytes, { contentType: mime, upsert: false }));
}
export async function removeFile(admin, storagePath) {
    data(await admin.storage.from('modules').remove([storagePath]));
}
