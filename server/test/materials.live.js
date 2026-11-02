import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { createClient } from '@supabase/supabase-js';
import app from '../src/app.js';
import { createSupabaseAdminClient, createSupabaseClient } from '../src/config/supabase.js';
import { makePdf, makeDocx } from './fixtures.js';

const admin = createSupabaseAdminClient();
const accounts = [];
let server;
const check = result => { if (result.error) throw result.error; return result.data; };
const prose = 'Prototyping validates design decisions before implementation.';
let passed = 0;
const pass = name => { passed++; console.log(`PASS ${name}`); };

async function account() {
    const email = `render-check-${randomUUID()}@example.com`;
    const password = `Test-${randomUUID()}-aA1!`;
    const { user } = check(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    const record = { id: user.id };
    accounts.push(record);
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { session } = check(await client.auth.signInWithPassword({ email, password }));
    record.token = session.access_token;
    record.client = createSupabaseClient(record.token);
    return record;
}

try {
    check(await admin.from('materials').select('cleanup_pending').limit(1));
    const a = await account();
    const b = await account();
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(path, user, options = {}) {
        return fetch(base + path, { ...options, headers: { ...(user && { Authorization: `Bearer ${user.token}` }), ...options.headers }, signal: AbortSignal.timeout(90000) });
    }
    async function upload(user, bytes, extension) {
        return request('/api/materials', user, { method: 'POST', body: bytes, headers: {
            'Content-Type': extension === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'X-Filename': `module${extension}`,
        } });
    }
    assert.equal((await request('/health')).status, 200);
    assert.equal((await request('/api/materials', null, { method: 'POST' })).status, 401);
    assert.equal((await request('/api/materials', { token: 'invalid' }, { method: 'POST' })).status, 401);
    for (const user of accounts) {
        const response = await request(`/api/profile?userId=${user.id === a.id ? b.id : a.id}`, user);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).id, user.id);
    }
    pass('health, authentication, and both API identities');

    for (const [user, bytes, extension] of [[a, makePdf([[prose], ['Second page with source references.']]), '.pdf'], [b, await makeDocx([prose, 'Second paragraph with source references.']), '.docx']]) {
        const response = await upload(user, bytes, extension);
        const result = await response.json();
        assert.equal(response.status, 201, JSON.stringify(result));
        const row = result.material;
        assert.equal(row.owner_id, user.id);
        assert.equal(row.status, 'needs_review');
        assert.equal(check(await admin.from('materials').select('cleanup_pending').eq('id', row.id).single()).cleanup_pending, false);
        const own = await request(`/api/materials/${row.id}`, user);
        assert.equal(own.status, 200);
        const preview = await own.json();
        assert.equal(preview.sections.length, 2);
        assert.ok(preview.sections.every(s => s.eligible_for_generation === false));
        assert.deepEqual(preview.sections[0].reference, extension === '.pdf' ? { page: 1 } : { paragraph: 1, kind: 'extracted-paragraph' });
        const unrelated = user.id === a.id ? b : a;
        assert.equal((await request(`/api/materials/${row.id}`, unrelated)).status, 404);
        assert.deepEqual(check(await unrelated.client.from('materials').select('id').eq('id', row.id)), []);
        assert.deepEqual(check(await unrelated.client.from('material_sections').select('id').eq('material_id', row.id)), []);
        assert.ok((await unrelated.client.storage.from('modules').download(row.storage_path)).error);
        const download = check(await user.client.storage.from('modules').download(row.storage_path));
        assert.equal(download.size, bytes.length);
        assert.ok((await user.client.from('materials').update({ cleanup_pending: true }).eq('id', row.id)).error);
        pass(`${extension} persisted preview, owner-only database and private Storage access`);
    }

    for (const [bytes, expected] of [[Buffer.from('%PDF-1.4 broken'), 'INVALID_FILE'], [makePdf([[]], { imagePages: [1] }), 'NO_USABLE_TEXT']]) {
        const response = await upload(a, bytes, '.pdf');
        const body = await response.json();
        assert.equal(response.status, 422);
        assert.equal(body.code, expected);
        const row = check(await admin.from('materials').select('*').eq('id', body.materialId).single());
        assert.equal(row.status, 'failed');
        assert.equal(row.cleanup_pending, false);
        assert.deepEqual(check(await admin.from('material_sections').select('id').eq('material_id', row.id)), []);
        assert.ok((await a.client.storage.from('modules').download(row.storage_path)).error);
    }
    pass('corrupt and scanned PDF rejection removes private objects and partial sections');

    assert.equal((await upload(a, Buffer.alloc(5 * 1024 * 1024 + 1), '.pdf')).status, 413);
    assert.equal((await request('/api/materials', a, { method: 'POST', body: 'text', headers: { 'Content-Type': 'text/plain', 'X-Filename': 'x.txt' } })).status, 415);
    pass('HTTP file size and MIME rejection');

    const id = randomUUID();
    const storage = `${a.id}/${id}/source.pdf`;
    check(await admin.from('materials').insert({ id, owner_id: a.id, title: 'Interrupted test', original_filename: 'module.pdf',
        mime_type: 'application/pdf', file_bytes: 10, storage_path: storage, cleanup_pending: true }));
    check(await a.client.storage.from('modules').upload(storage, makePdf([[prose]]), { contentType: 'application/pdf' }));
    check(await admin.from('material_sections').insert({ material_id: id, owner_id: a.id, section_order: 1, text: prose, reference: { page: 1 } }));
    const restartPort = server.address().port;
    await new Promise(done => server.close(done));
    server = undefined;
    // Boot the real listener with only Supabase state; no local journal is available.
    const startupCheck = `await import('./src/server.js'); const response = await fetch('http://127.0.0.1:${restartPort}/health'); process.exit(response.status === 200 ? 0 : 1);`;
    await promisify(execFile)(process.execPath, ['--input-type=module', '-e', startupCheck],
        { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: String(restartPort) }, windowsHide: true, timeout: 90000 });
    const recovered = check(await admin.from('materials').select('*').eq('id', id).single());
    assert.equal(recovered.status, 'failed');
    assert.equal(recovered.error_code, 'IMPORT_INTERRUPTED');
    assert.equal(recovered.cleanup_pending, false);
    assert.deepEqual(check(await admin.from('material_sections').select('id').eq('material_id', id)), []);
    assert.ok((await a.client.storage.from('modules').download(storage)).error);
    pass('real server startup recovers durable state before serving health');
    console.log(`${passed} live groups passed.`);
} catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
} finally {
    if (server) await new Promise(done => server.close(done));
    for (const user of accounts) {
        try {
            const rows = check(await admin.from('materials').select('storage_path').eq('owner_id', user.id));
            if (rows.length) check(await admin.storage.from('modules').remove(rows.map(row => row.storage_path)));
            check(await admin.auth.admin.deleteUser(user.id));
        } catch {
            console.error(`CLEANUP REQUIRED: disposable account ${user.id}; remove its module objects before deleting the account.`);
            process.exitCode = 1;
        }
    }
}
