import * as model from '../models/labelModel.js';
import { materialError, validateMaterialId } from '../validation/materialValidation.js';

export async function readLabels({ userId, supabase }) {
    return model.getLabels(supabase, userId);
}

export async function addLabel({ userId, supabase, kind, body }) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || [...name].length > 120 || /\p{Cc}/u.test(name)) {
        throw materialError(400, 'INVALID_LABEL', 'Use a label between 1 and 120 characters.');
    }
    const row = { owner_id: userId, name };
    if (kind === 'topics') {
        validateMaterialId(body.subjectId);
        row.subject_id = body.subjectId;
    }
    try { return await model.createLabel(supabase, kind, row); }
    catch (error) {
        if (error.code === '23505') throw materialError(409, 'LABEL_EXISTS', 'This label already exists. Choose it from the list.');
        if (error.code === '23503' || error.code === '42501') throw materialError(400, 'INVALID_LABEL', 'Choose one of your own subjects.');
        throw error;
    }
}
