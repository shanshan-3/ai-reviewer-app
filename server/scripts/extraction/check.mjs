import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runExtraction, LIMITS } from './extract.mjs';
import { makePdf, makeDocx, createFixtures } from './fixtures.mjs';
import { verify } from './benchmark.mjs';

const directory = fileURLToPath(new URL('../../.extraction-local/check/', import.meta.url));
await mkdir(directory, { recursive: true });
try {
  const fixtures = await createFixtures(directory);
  for (const fixture of fixtures) {
    const result = await runExtraction(fixture.file);
    verify(result, fixture);
    if (fixture.name === 'ordinary.pdf') assert.deepEqual(result.sections.map(section => section.reference), [{ page: 1 }, { page: 2 }]);
    if (fixture.name === 'ordinary.docx') assert.deepEqual(result.sections.map(section => section.reference.paragraph), [1, 2]);
    console.log(`PASS ${fixture.name}`);
  }
  const file = path.join(directory, 'boundary.pdf');
  await writeFile(file, makePdf([['Meaningful text remains useful for extraction validation.']]));
  const normal = await runExtraction(file);
  const exact = await runExtraction(file, { textCharacters: normal.metrics.textCharacters, fileBytes: normal.metrics.fileBytes, pdfPages: 1 });
  assert.equal(exact.status, 'needs_review');
  assert.equal((await runExtraction(file, { textCharacters: normal.metrics.textCharacters - 1 })).code, 'TEXT_LIMIT');
  assert.equal((await runExtraction(file, { fileBytes: normal.metrics.fileBytes - 1 })).code, 'FILE_LIMIT');
  assert.equal((await runExtraction(file, { timeMs: 1 })).code, 'TIME_LIMIT');
  assert.equal((await runExtraction(file, { memoryBytes: 1 })).code, 'MEMORY_LIMIT');
  assert.equal((await runExtraction(path.join(directory, 'missing.pdf'))).code, 'INVALID_FILE');
  await assert.rejects(runExtraction(file, { memoryBytes: LIMITS.memoryBytes + 1 }), /Invalid or increased limit/);
  const docx = path.join(directory, 'boundary.docx');
  await writeFile(docx, await makeDocx(['Meaningful text remains useful for extraction validation.']));
  const expanded = (await runExtraction(docx)).metrics.docxExpandedBytes;
  assert.equal((await runExtraction(docx, { docxExpandedBytes: expanded })).status, 'needs_review');
  assert.equal((await runExtraction(docx, { docxExpandedBytes: expanded - 1 })).code, 'DOCX_EXPANDED_LIMIT');
  assert.equal((await runExtraction(file)).status, 'needs_review', 'A terminated extraction must not prevent the next run.');
  console.log(`PASS boundaries, timeout, memory termination, recovery (${fixtures.length} fixtures)`);
} finally {
  const root = fileURLToPath(new URL('../../.extraction-local/', import.meta.url));
  assert(path.resolve(directory).startsWith(path.resolve(root) + path.sep));
  await rm(directory, { recursive: true, force: true });
}
