import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import { MESSAGES } from '../src/services/materialExtractionLimits.js';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const admin = {};
let rows, sections, files, failure, rejected;

mock.module('../src/config/supabase.js', { namedExports: { createSupabaseAdminClient: () => admin } });
mock.module('../src/services/materialExtraction.js', { namedExports: {
    MESSAGES,
    extractMaterial: async () => rejected
        ? { status: 'rejected', code: 'INVALID_FILE' }
        : { status: 'needs_review', warnings: [], sections: [{ text: 'Selectable study material for private review.', reference: { page: 1 } }] },
} });
mock.module('../src/models/materialModel.js', { namedExports: {
    getPendingImports: async () => {
        if (failure === 'scan') throw new Error('offline');
        return [...rows.values()].filter(row => row.cleanup_pending).slice(0, 50);
    },
    createMaterial: async (_admin, row) => {
        rows.set(row.id, { status: 'processing', error_code: null, ...row });
        if (failure === 'create') throw new Error('lost create response');
    },
    getMaterial: async (_client, id, userId) => rows.get(id)?.owner_id === userId ? { ...rows.get(id) } : null,
    uploadFile: async (_client, path) => {
        assert.ok([...rows.values()].some(row => row.cleanup_pending && row.storage_path === path));
        files.add(path);
        if (failure === 'upload') throw new Error('lost upload response');
    },
    saveSections: async (_admin, id, _owner, value) => {
        sections.set(id, value);
        if (failure === 'sections') throw new Error('lost section response');
    },
    updateMaterial: async (_admin, id, userId, patch) => {
        assert.equal(rows.get(id).owner_id, userId);
        if (patch.status === 'needs_review' && failure === 'commit') throw new Error('offline');
        Object.assign(rows.get(id), patch);
        if (patch.status === 'needs_review' && failure === 'commit-ack') throw new Error('lost commit response');
        return { ...rows.get(id) };
    },
    clearSections: async (_admin, id, userId) => { assert.equal(rows.get(id).owner_id, userId); sections.delete(id); },
    removeFile: async (_admin, path) => {
        if (failure === 'cleanup') throw new Error('storage offline');
        files.delete(path);
    },
    getSections: async (_client, id) => sections.get(id) ?? [],
} });

const { importMaterial, readMaterial, recoverPendingImports } = await import('../src/services/materialService.js');
const upload = () => importMaterial({ userId: owner, supabase: {}, bytes: Buffer.from('%PDF-1.4 test'), filename: 'Module.pdf', mime: 'application/pdf', extension: '.pdf' });

beforeEach(() => { rows = new Map(); sections = new Map(); files = new Set(); failure = null; rejected = false; });

test('success commits preview and clears the durable marker', async () => {
    const result = await upload();
    assert.equal(result.status, 'needs_review');
    assert.equal(rows.get(result.id).cleanup_pending, false);
    assert.equal(files.size, 1);
    assert.equal((await readMaterial({ id: result.id, userId: owner, supabase: {} })).sections.length, 1);
    await assert.rejects(readMaterial({ id: result.id, userId: other, supabase: {} }), error => error.status === 404);
});

test('invalid bytes never create metadata', async () => {
    await assert.rejects(importMaterial({ bytes: Buffer.from('broken'), extension: '.pdf' }), error => error.code === 'INVALID_FILE');
    assert.equal(rows.size, 0);
});

for (const stage of ['create', 'upload', 'sections', 'commit']) {
    test(`${stage} failure removes partial sections and private object`, async () => {
        failure = stage;
        await assert.rejects(upload(), error => error.code === 'IMPORT_FAILED');
        const row = [...rows.values()][0];
        assert.equal(row.status, 'failed');
        assert.equal(row.cleanup_pending, false);
        assert.equal(files.size, 0);
        assert.equal(sections.size, 0);
    });
}

test('lost final acknowledgement preserves successful preview and file', async () => {
    failure = 'commit-ack';
    const result = await upload();
    assert.equal(result.status, 'needs_review');
    assert.equal(files.size, 1);
    assert.equal(sections.size, 1);
});

test('failed cleanup stays durable and a later recovery retries it', async () => {
    rejected = true;
    failure = 'cleanup';
    await assert.rejects(upload(), error => error.code === 'INVALID_FILE');
    const row = [...rows.values()][0];
    assert.equal(row.cleanup_pending, true);
    assert.equal(row.error_code, 'INVALID_FILE');
    failure = null;
    await recoverPendingImports(admin);
    assert.equal(row.cleanup_pending, false);
    assert.equal(row.error_code, 'INVALID_FILE');
    assert.equal(files.size, 0);
});

test('restart recovery works with database state alone', async () => {
    rows.set(owner, { id: owner, owner_id: owner, storage_path: `${owner}/${owner}/source.pdf`, cleanup_pending: true, status: 'processing' });
    files.add(rows.get(owner).storage_path);
    sections.set(owner, [{ text: 'partial output' }]);
    await recoverPendingImports(admin);
    assert.equal(rows.get(owner).status, 'failed');
    assert.equal(rows.get(owner).error_code, 'IMPORT_INTERRUPTED');
    assert.equal(rows.get(owner).cleanup_pending, false);
    assert.equal(files.size, 0);
    assert.equal(sections.size, 0);
});

test('pending completed preview is preserved during recovery', async () => {
    const row = await upload();
    rows.get(row.id).cleanup_pending = true;
    await recoverPendingImports(admin);
    assert.equal(rows.get(row.id).status, 'needs_review');
    assert.equal(files.size, 1);
    assert.equal(sections.size, 1);
});

test('unavailable recovery blocks new imports before remote writes', async () => {
    failure = 'scan';
    await assert.rejects(upload(), error => error.code === 'CLEANUP_PENDING');
    assert.equal(rows.size, 0);
});
