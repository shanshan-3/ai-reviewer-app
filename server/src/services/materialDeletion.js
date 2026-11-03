import { createSupabaseAdminClient } from '../config/supabase.js';
import * as model from '../models/materialModel.js';
import { materialError, validateMaterialId } from '../validation/materialValidation.js';

async function finishDeletion(admin, material) {
    validateMaterialId(material.id);
    validateMaterialId(material.owner_id);
    if (![`${material.owner_id}/${material.id}/source.pdf`, `${material.owner_id}/${material.id}/source.docx`].includes(material.storage_path)) {
        throw new Error('Invalid deletion storage path.');
    }
    await model.removeFile(admin, material.storage_path);
    // Section rows cascade only after the private file has been removed.
    await model.deleteMaterial(admin, material.id, material.owner_id);
}

export async function recoverPendingDeletions(admin = createSupabaseAdminClient()) {
    for (;;) {
        const records = await model.getPendingDeletions(admin);
        if (!records.length) return;
        for (const record of records) await finishDeletion(admin, record);
    }
}

export async function deleteMaterial({ userId, id }) {
    validateMaterialId(userId);
    validateMaterialId(id);
    const admin = createSupabaseAdminClient();
    try {
        const material = await model.beginMaterialDeletion(admin, userId, id);
        if (material) await finishDeletion(admin, material);
    } catch (error) {
        if (error.message === 'MATERIAL_BUSY') {
            throw materialError(409, 'MATERIAL_BUSY', 'This module is still processing or recovering. Try again shortly.');
        }
        throw materialError(503, 'DELETION_PENDING', 'Deletion could not finish. Refresh your modules and retry. Pending cleanup is retried after server restart.');
    }
}
