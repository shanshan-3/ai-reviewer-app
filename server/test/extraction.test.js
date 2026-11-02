import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractMaterial, LIMITS } from '../src/services/materialExtraction.js';
import { makePdf, makeDocx } from './fixtures.js';

const prose = 'Prototyping validates design decisions before implementation.';

async function extract(bytes, extension, limits) {
    const directory = await mkdtemp(join(tmpdir(), 'reviewer-test-'));
    try {
        const file = join(directory, `source${extension}`);
        await writeFile(file, bytes);
        return await extractMaterial(file, limits);
    } finally {
        assert.ok(directory.startsWith(join(tmpdir(), 'reviewer-test-')));
        await rm(directory, { recursive: true, force: true });
    }
}

test('PDF keeps page references, code symbols, warnings, and review gate', async () => {
    const result = await extract(makePdf([[prose, 'if (score >= 5 && score != 9) {'], ['Second page with selectable content.']]), '.pdf');
    assert.equal(result.status, 'needs_review');
    assert.match(result.sections[0].text, /score >= 5 && score != 9/);
    assert.deepEqual(result.sections.map(s => s.reference), [{ page: 1 }, { page: 2 }]);
    assert.ok(result.sections.every(s => s.eligibleForGeneration === false));
    assert.ok(result.warnings.some(w => w.code === 'FORMATTING_REVIEW'));
    assert.ok(result.metrics.peakMemoryBytes > 0);
});

test('DOCX keeps paragraph references and excludes external resource fetching', async () => {
    const result = await extract(await makeDocx([prose, 'if (score >= 5 && score != 9) {'], { external: true }), '.docx');
    assert.equal(result.status, 'needs_review');
    assert.deepEqual(result.sections[0].reference, { paragraph: 1, kind: 'extracted-paragraph' });
    assert.match(result.sections.map(s => s.text).join(''), /score >= 5 && score != 9/);
    assert.ok(result.sections.every(s => s.eligibleForGeneration === false));
});

test('image-only PDF rejects without OCR', async () => {
    assert.equal((await extract(makePdf([[]], { imagePages: [1] }), '.pdf')).code, 'NO_USABLE_TEXT');
});

test('password PDF and malformed files reject safely', async () => {
    assert.equal((await extract(makePdf([[prose]], { password: true }), '.pdf')).code, 'PASSWORD_REQUIRED');
    for (const extension of ['.pdf', '.docx']) {
        assert.equal((await extract(Buffer.from('x'), extension)).code, 'INVALID_FILE');
    }
});

test('PDF page and file size limits reject', async () => {
    assert.equal((await extract(makePdf(Array.from({ length: 101 }, () => [prose])), '.pdf')).code, 'PAGE_LIMIT');
    assert.equal((await extract(Buffer.alloc(LIMITS.fileBytes + 1), '.pdf')).code, 'FILE_LIMIT');
});

test('DOCX text and archive entry limits reject', async () => {
    assert.equal((await extract(await makeDocx(['a'.repeat(LIMITS.textCharacters + 1)]), '.docx')).code, 'TEXT_LIMIT');
    assert.equal((await extract(await makeDocx([prose], { extraEntries: LIMITS.docxEntries }), '.docx')).code, 'DOCX_ENTRY_LIMIT');
});

test('DOCX expansion is bounded even when ZIP metadata lies', async () => {
    const bytes = await makeDocx([prose], { expandedBytes: LIMITS.docxExpandedBytes + 1 });
    assert.equal((await extract(bytes, '.docx')).code, 'DOCX_EXPANDED_LIMIT');
    for (let i = 0; i < bytes.length - 46; i++) {
        if (bytes.readUInt32LE(i) === 0x02014b50
            && bytes.subarray(i + 46, i + 46 + bytes.readUInt16LE(i + 28)).toString() === 'word/media/padding.bin') {
            bytes.writeUInt32LE(1, i + 24);
            bytes.writeUInt32LE(1, bytes.readUInt32LE(i + 42) + 22);
            break;
        }
    }
    assert.equal((await extract(bytes, '.docx')).code, 'DOCX_EXPANDED_LIMIT');
});

test('parent deadline terminates worker; reported peak RSS enforces memory budget', async () => {
    assert.equal((await extract(makePdf([[prose]]), '.pdf', { timeMs: 1 })).code, 'TIME_LIMIT');
    assert.equal((await extract(makePdf([[prose]]), '.pdf', { memoryBytes: 1 })).code, 'MEMORY_LIMIT');
    await assert.rejects(extract(makePdf([[prose]]), '.pdf', { fileBytes: LIMITS.fileBytes + 1 }), /Invalid or increased limit/);
});
