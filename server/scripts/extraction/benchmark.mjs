import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runExtraction, LIMITS } from './extract.mjs';
import { createFixtures } from './fixtures.mjs';

export function verify(result, fixture) {
  assert.equal(result.status, fixture.status, `${fixture.name}: ${result.code || result.status}`);
  if (fixture.code) assert.equal(result.code, fixture.code, fixture.name);
  if (fixture.warning) assert(result.warnings.some(warning => warning.code === fixture.warning), fixture.name);
  if (fixture.exact) assert.deepEqual(result.sections.map(section => section.text.trimEnd()), fixture.exact, fixture.name);
  if (fixture.textCharacters) assert.equal(result.metrics.textCharacters, fixture.textCharacters, fixture.name);
  if (fixture.expandedBytes) assert.equal(result.metrics.docxExpandedBytes, fixture.expandedBytes, fixture.name);
  if (fixture.contains) assert(result.sections.some(section => section.text.includes(fixture.contains)), fixture.name);
  if (result.status === 'rejected') assert.deepEqual(result.sections, [], 'Rejected content must not be exposed as usable text.');
  else {
    assert(result.sections.every(section => section.eligibleForGeneration === false));
    assert(result.metrics.peakMemoryBytes > 0 && result.metrics.peakMemoryBytes <= LIMITS.memoryBytes);
  }
}

export async function renderPdf(file, directory) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const require = createRequire(import.meta.url);
  const { createCanvas } = createRequire(require.resolve('pdfjs-dist/package.json'))('@napi-rs/canvas');
  await mkdir(directory, { recursive: true });
  const task = getDocument({ data: new Uint8Array(await readFile(file)), isEvalSupported: false });
  try {
    const doc = await task.promise;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      await writeFile(path.join(directory, `page-${i}.png`), canvas.toBuffer('image/png'));
      page.cleanup();
    }
  } finally { await task.destroy(); }
}

async function main() {
  const samples = process.argv.slice(2);
  if (!samples.length) throw new Error('Pass at least one authorized local PDF/DOCX path. No files are uploaded.');
  const directory = fileURLToPath(new URL('../../.extraction-local/', import.meta.url));
  await mkdir(directory, { recursive: true });
  const fixtures = await createFixtures(path.join(directory, 'fixtures'));
  const require = createRequire(import.meta.url);
  const report = {
    measuredAt: new Date().toISOString(), runtime: process.version,
    platform: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model,
    totalMemoryBytes: os.totalmem(), versions: {
      pdfjs: require('pdfjs-dist/package.json').version, mammoth: require('mammoth/package.json').version,
      jszip: createRequire(require.resolve('mammoth'))('jszip/package.json').version,
    }, limits: LIMITS, results: [],
  };
  const corpus = [...samples.map(file => ({ file: path.resolve(file), name: path.basename(file), status: 'needs_review', real: true })), ...fixtures];
  for (const fixture of corpus) {
    const runs = [];
    let result;
    let stableTextHash;
    const repetitions = fixture.status === 'rejected' ? 1 : 5;
    for (let i = 0; i < repetitions; i++) {
      result = await runExtraction(fixture.file);
      verify(result, fixture);
      const textHash = createHash('sha256').update(JSON.stringify(result.sections)).digest('hex');
      if (i) assert.equal(textHash, stableTextHash, `${fixture.name}: unstable extraction`);
      stableTextHash = textHash;
      runs.push(result.metrics);
    }
    let codeFidelity;
    if (fixture.codeLines) {
      const text = result.sections.map(section => section.text).join('\n');
      codeFidelity = { operatorsPreserved: ['>=', '&&', '!=', '<='].every(symbol => text.includes(symbol)),
        exactLines: fixture.codeLines.every(line => text.split('\n').includes(line)),
        eligibleWithoutReview: false };
      assert(codeFidelity.operatorsPreserved, `${fixture.name}: code operator loss`);
    }
    const entry = { name: fixture.name, real: !!fixture.real,
      sha256: createHash('sha256').update(await readFile(fixture.file)).digest('hex'),
      status: result.status, code: result.code, warnings: result.warnings,
      codeFidelity, runs, maxElapsedMs: Math.max(...runs.map(run => run.elapsedMs)),
      maxMemoryBytes: Math.max(...runs.map(run => run.peakMemoryBytes)), textHash: stableTextHash };
    report.results.push(entry);
    await writeFile(path.join(directory, `${fixture.name}.result.json`), JSON.stringify(result, null, 2));
    await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`${fixture.name}: ${result.code || result.status}, ${runs.length} run(s), ${entry.maxElapsedMs} ms, ${(entry.maxMemoryBytes / 1024 / 1024).toFixed(1)} MiB`);
    if (fixture.real && path.extname(fixture.file).toLowerCase() === '.pdf') await renderPdf(fixture.file, path.join(directory, 'previews', fixture.name));
  }
  console.log(`Measured ${corpus.length} samples. Private results: ${path.join(directory, 'report.json')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
