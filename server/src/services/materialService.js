import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createSupabaseAdminClient } from '../config/supabase.js';
import * as model from '../models/materialModel.js';
import { extractMaterial, MESSAGES } from './materialExtraction.js';
import { materialError, validateMaterialBytes, validateMaterialId, validateMaterialReview } from '../validation/materialValidation.js';

async function removeTemp(directory) {
    if (!directory) return;
    const absolute = resolve(directory);
    if (!absolute.startsWith(resolve(tmpdir()) + sep + 'reviewer-import-')) {
        throw new Error('Invalid cleanup directory.');
    }
    await rm(absolute, { recursive: true, force: true });
}

async function recoverImport(admin, record, errorCode = 'IMPORT_INTERRUPTED') {
    validateMaterialId(record.id);
    validateMaterialId(record.owner_id);
    const material = await model.getMaterial(admin, record.id, record.owner_id);
    if (!material) return;
    if (material.storage_path !== `${record.owner_id}/${record.id}/source.pdf`
        && material.storage_path !== `${record.owner_id}/${record.id}/source.docx`) {
        throw new Error('Invalid recovery storage path.');
    }
    if (material?.status !== 'needs_review' && material?.status !== 'ready') {
        await model.updateMaterial(admin, record.id, record.owner_id, {
            status: 'failed', error_code: material.error_code ?? errorCode,
        });
        await model.clearSections(admin, record.id, record.owner_id);
        await model.removeFile(admin, material.storage_path);
    }
    await model.updateMaterial(admin, record.id, record.owner_id, { cleanup_pending: false });
}

// shortcut: recovery assumes one server instance; add shared admission before scaling.
export async function recoverPendingImports(admin = createSupabaseAdminClient()) {
    for (;;) {
        const records = await model.getPendingImports(admin);
        if (!records.length) return;
        for (const record of records) await recoverImport(admin, record);
    }
}

export async function importMaterial({ userId, supabase, bytes, filename, mime, extension }) {
    validateMaterialBytes(bytes, extension);
    validateMaterialId(userId);
    const admin = createSupabaseAdminClient();
    try { await recoverPendingImports(admin); }
    catch { throw materialError(503, 'CLEANUP_PENDING', 'A previous import needs cleanup. Try again later.'); }
    const record = { id: randomUUID(), owner_id: userId };
    const storage = `${userId}/${record.id}/source${extension}`;
    let directory;
    let code = 'IMPORT_FAILED';
    try {
        await model.createMaterial(admin, {
            id: record.id, owner_id: userId, title: filename.slice(0, -extension.length).trim().slice(0, 200) || 'Untitled module',
            original_filename: filename, mime_type: mime, file_bytes: bytes.length, storage_path: storage,
            cleanup_pending: true,
        });
        await model.uploadFile(supabase, storage, bytes, mime);
        directory = await mkdtemp(join(tmpdir(), 'reviewer-import-'));
        const file = join(directory, `source${extension}`);
        await writeFile(file, bytes, { flag: 'wx' });
        const result = await extractMaterial(file);
        if (result.status !== 'needs_review') {
            code = Object.hasOwn(MESSAGES, result.code) ? result.code : 'WORKER_FAILED';
            throw materialError(422, code, MESSAGES[code]);
        }
        await model.saveSections(admin, record.id, userId, result.sections);
        const material = await model.updateMaterial(admin, record.id, userId, {
            status: 'needs_review', warnings: result.warnings, error_code: null, cleanup_pending: false,
        });
        return material;
    } catch (error) {
        try { await recoverImport(admin, record, code); }
        catch { /* Keep cleanup_pending until every remote cleanup succeeds. */ }
        // Never return a failed preview if the final status write actually committed.
        const material = await model.getMaterial(admin, record.id, userId).catch(() => null);
        if (material?.status === 'needs_review') return material;
        if (error.publicMessage) {
            error.materialId = material?.id;
            throw error;
        }
        throw materialError(503, 'IMPORT_FAILED', 'The module could not be imported. Try again later.');
    } finally {
        await removeTemp(directory).catch(() => {});
    }
}

export async function readMaterial({ userId, supabase, id }) {
    validateMaterialId(id);
    const material = await model.getMaterial(supabase, id, userId);
    if (!material) throw materialError(404, 'MATERIAL_NOT_FOUND', 'Module not found.');
    const sections = material.status === 'needs_review' || material.status === 'ready'
        ? await model.getSections(supabase, id, userId) : [];
    return { material, sections };
}

export async function listMaterials({ userId, supabase, offset = '0' }) {
    if (typeof offset !== 'string' || !/^\d{1,10}$/.test(offset) || Number(offset) > 2147483627) {
        throw materialError(400, 'INVALID_OFFSET', 'Provide a non-negative module list offset.');
    }
    const start = Number(offset);
    const rows = await model.listMaterials(supabase, userId, start);
    return { materials: rows.slice(0, 20), nextOffset: rows.length > 20 ? start + 20 : null };
}

export async function approveMaterial({ userId, id, body }) {
    validateMaterialId(id);
    const review = validateMaterialReview(body);
    try { await model.approveMaterial(createSupabaseAdminClient(), userId, id, review); }
    catch (error) {
        const failures = {
            MATERIAL_NOT_FOUND: [404, 'Module not found.'],
            MATERIAL_NOT_REVIEWABLE: [409, 'This module is not awaiting review. Reload the preview.'],
            INVALID_LABELS: [400, 'Choose your own subject and a topic belonging to it.'],
            INVALID_SECTIONS: [400, 'Choose usable sections from this module.'],
            REVIEW_CONFLICT: [409, 'This module has already been approved with a different selection. Reload the preview.'],
        };
        const failure = failures[error.message];
        if (failure) throw materialError(failure[0], error.message, failure[1]);
        throw error;
    }
}
