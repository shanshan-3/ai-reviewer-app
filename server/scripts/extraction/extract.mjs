import { fork, spawn } from 'node:child_process';
import { open, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const LIMITS = Object.freeze({
  fileBytes: 5 * 1024 * 1024,
  pdfPages: 100,
  textCharacters: 200_000,
  docxExpandedBytes: 20 * 1024 * 1024,
  docxEntries: 2048,
  timeMs: 10_000,
  memoryBytes: 384 * 1024 * 1024,
});

export const MESSAGES = Object.freeze({
  UNSUPPORTED_TYPE: 'Choose a selectable-text PDF or a .docx file. Other formats are not supported.',
  INVALID_FILE: 'This file could not be read as a valid PDF or DOCX. Export a new copy and try again.',
  PASSWORD_REQUIRED: 'Password-protected documents are not supported. Upload an authorized, unprotected copy.',
  NO_USABLE_TEXT: 'No usable selectable text was found. Upload a text-based PDF or DOCX; scanned images are not read.',
  FILE_LIMIT: `The file exceeds ${LIMITS.fileBytes} bytes (5 MiB). Split it into smaller documents.`,
  PAGE_LIMIT: `The PDF exceeds ${LIMITS.pdfPages} pages. Split it into smaller documents.`,
  TEXT_LIMIT: `Extracted text exceeds ${LIMITS.textCharacters} characters. Split the document into smaller sections.`,
  DOCX_EXPANDED_LIMIT: `Expanded DOCX content exceeds ${LIMITS.docxExpandedBytes} bytes (20 MiB). Remove large embedded content or split the document.`,
  DOCX_ENTRY_LIMIT: `The DOCX contains more than ${LIMITS.docxEntries} archive entries. Export a simpler copy.`,
  TIME_LIMIT: `Extraction exceeded ${LIMITS.timeMs / 1000} seconds. Split or simplify the document and try again.`,
  MEMORY_LIMIT: `Extraction exceeded its ${LIMITS.memoryBytes / 1024 / 1024} MiB memory budget. Split or simplify the document.`,
  WORKER_FAILED: 'Extraction stopped unexpectedly. Export a simpler copy and try again.',
});

const IMAGE_WARNING = 'Only selectable text was extracted. Images and scanned content are excluded. Review the extracted text before continuing.';
const FORMAT_WARNING = 'Some code or tables may have lost their layout. Affected content cannot support questions until verified.';
const require = createRequire(import.meta.url);
// Resolve the ZIP reader Mammoth itself uses, rather than adding a second ZIP dependency.
export const JSZip = createRequire(require.resolve('mammoth'))('jszip');
const scriptPath = fileURLToPath(import.meta.url);

function reject(code) {
  throw Object.assign(new Error(MESSAGES[code]), { code });
}

function meaningful(text) {
  return (text.match(/[\p{L}\p{N}]/gu) || []).length >= 20;
}

async function readDocx(buffer, limits, metrics, warnings) {
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter(entry => !entry.dir);
  if (entries.length > limits.docxEntries) reject('DOCX_ENTRY_LIMIT');
  if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) reject('INVALID_FILE');
  // shortcut: JSZip's declared sizes use its pinned internal _data field; recheck on a Mammoth/JSZip upgrade.
  const declared = entries.reduce((total, entry) => total + entry._data.uncompressedSize, 0);
  if (!Number.isSafeInteger(declared) || declared > limits.docxExpandedBytes) reject('DOCX_EXPANDED_LIMIT');
  let expanded = 0;
  for (const entry of entries) {
    await new Promise((resolve, fail) => {
      const stream = entry.internalStream('uint8array');
      stream.on('data', chunk => {
        expanded += chunk.length;
        if (expanded > limits.docxExpandedBytes) {
          stream.pause();
          fail(Object.assign(new Error(MESSAGES.DOCX_EXPANDED_LIMIT), { code: 'DOCX_EXPANDED_LIMIT' }));
        }
      }).on('error', fail).on('end', resolve).resume();
    });
  }
  metrics.docxExpandedBytes = expanded;
  const xml = await zip.file('word/document.xml').async('string');
  if (/<!(?:DOCTYPE|ENTITY)\b/i.test(xml)) reject('INVALID_FILE');
  const { default: mammoth } = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  if (result.messages.length) warnings.push({ code: 'LIBRARY_WARNING', message: 'The DOCX reader reported unsupported content; review the extracted text.' });
  if (entries.some(entry => entry.name.startsWith('word/media/')) || /<(?:\w+:)?(?:drawing|pict)\b/.test(xml)) {
    warnings.push({ code: 'IMAGES_EXCLUDED', message: IMAGE_WARNING });
  }
  warnings.push({ code: 'FORMATTING_REVIEW', message: FORMAT_WARNING });
  return result.value.split(/\n\n/).filter(text => text.trim()).map((text, index) => ({
    reference: { paragraph: index + 1, kind: 'extracted-paragraph' }, text, eligibleForGeneration: false,
  }));
}

async function readPdf(buffer, limits, metrics, warnings) {
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: false });
  try {
    const document = await task.promise;
    metrics.pdfPages = document.numPages;
    if (document.numPages > limits.pdfPages) reject('PAGE_LIMIT');
    const sections = [];
    const imageOps = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject,
      OPS.paintImageXObjectRepeat, OPS.paintImageMaskXObject, OPS.paintImageMaskXObjectRepeat]);
    let characters = 0;
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      let text = '';
      let previous;
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        if (previous && Math.abs(item.transform[5] - previous.transform[5]) > Math.max(2, item.height * 0.4) && !text.endsWith('\n')) text += '\n';
        if (previous && !text.endsWith('\n') && item.str && !/^\s/.test(item.str)) {
          const gap = item.transform[4] - previous.transform[4] - previous.width;
          if (gap > Math.max(1, item.height * 0.15)) text += ' ';
        }
        text += item.str;
        if (item.hasEOL) text += '\n';
        previous = item;
      }
      if (text && !text.endsWith('\n')) text += '\n';
      characters += text.length;
      if (characters > limits.textCharacters) reject('TEXT_LIMIT');
      const operations = await page.getOperatorList();
      const hasImages = operations.fnArray.some(op => imageOps.has(op));
      if (hasImages || !meaningful(text)) warnings.push({
        code: hasImages ? 'IMAGES_EXCLUDED' : 'PAGE_WITHOUT_USABLE_TEXT', page: number, message: IMAGE_WARNING,
      });
      sections.push({ reference: { page: number }, text, hasImages, eligibleForGeneration: false });
      page.cleanup();
    }
    warnings.push({ code: 'FORMATTING_REVIEW', message: FORMAT_WARNING });
    return sections;
  } finally {
    await task.destroy();
  }
}

async function extractInChild(file, limits) {
  const metrics = {};
  const warnings = [];
  try {
    const info = await stat(file);
    metrics.fileBytes = info.size;
    if (!info.isFile()) reject('INVALID_FILE');
    if (info.size > limits.fileBytes) reject('FILE_LIMIT');
    const extension = path.extname(file).toLowerCase();
    if (!['.pdf', '.docx'].includes(extension)) reject('UNSUPPORTED_TYPE');
    const handle = await open(file, 'r');
    let buffer;
    try {
      const storage = Buffer.alloc(limits.fileBytes + 1);
      let length = 0;
      while (length < storage.length) {
        const { bytesRead } = await handle.read(storage, length, storage.length - length, null);
        if (!bytesRead) break;
        length += bytesRead;
      }
      if (length > limits.fileBytes) reject('FILE_LIMIT');
      buffer = storage.subarray(0, length);
    } finally { await handle.close(); }
    if (extension === '.pdf' ? !buffer.subarray(0, 1024).includes(Buffer.from('%PDF-')) : buffer.readUInt32LE(0) !== 0x04034b50) reject('INVALID_FILE');
    const sections = extension === '.pdf'
      ? await readPdf(buffer, limits, metrics, warnings)
      : await readDocx(buffer, limits, metrics, warnings);
    metrics.textCharacters = sections.reduce((sum, section) => sum + section.text.length, 0);
    if (metrics.textCharacters > limits.textCharacters) reject('TEXT_LIMIT');
    if (!meaningful(sections.map(section => section.text).join(''))) reject('NO_USABLE_TEXT');
    return { status: 'needs_review', sections, warnings, metrics };
  } catch (error) {
    const code = error.name === 'PasswordException' || /encrypted|password/i.test(error.message)
      ? 'PASSWORD_REQUIRED' : Object.hasOwn(MESSAGES, error.code) ? error.code : 'INVALID_FILE';
    return { status: 'rejected', code, message: MESSAGES[code], sections: [], warnings, metrics };
  }
}

export async function runExtraction(file, overrides = {}) {
  const totalStarted = performance.now();
  if (process.platform !== 'win32') throw new Error('This benchmark requires Windows PowerShell for independent memory monitoring.');
  const limits = { ...LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) {
    if (!Object.hasOwn(LIMITS, key) || !Number.isSafeInteger(value) || value < 1 || value > LIMITS[key]) throw new Error(`Invalid or increased limit: ${key}`);
  }
  const worker = fork(scriptPath, ['--worker'], {
    execArgv: ['--max-old-space-size=192'], stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
  });
  const guard = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File',
    fileURLToPath(new URL('memory-guard.ps1', import.meta.url)),
    '-TargetId', String(worker.pid), '-OwnerId', String(process.pid), '-LimitBytes', String(limits.memoryBytes)],
  { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let guardOutput = '';
  let stderr = '';
  let outcome;
  let timedOut = false;
  let started;
  let timeout;
  let guardError = '';
  let guardClosed;
  let ready = false;
  const setupTimeout = setTimeout(() => { guardError = 'Memory monitor did not start.'; worker.kill(); guard.kill(); }, 10_000);
  guard.stderr.on('data', chunk => { guardError = (guardError + chunk).slice(-2000); });
  guard.stdout.on('data', chunk => {
    guardOutput += chunk;
    if (!ready && guardOutput.includes('ready')) {
      ready = true;
      clearTimeout(setupTimeout);
      started = performance.now();
      timeout = setTimeout(() => { timedOut = true; worker.kill(); }, limits.timeMs);
      worker.send({ file: path.resolve(file), limits }, () => {});
    }
  });
  worker.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-2000); });
  worker.on('message', message => { outcome = message; });
  const guardDone = new Promise(resolve => {
    guard.on('error', error => { guardError = error.message; worker.kill(); });
    guard.on('close', code => {
      guardClosed = code;
      if (!outcome && code !== 0) worker.kill();
      resolve();
    });
  });
  await new Promise((resolve, fail) => { worker.on('error', fail); worker.on('close', resolve); });
  const elapsedMs = started ? performance.now() - started : 0;
  clearTimeout(timeout);
  clearTimeout(setupTimeout);
  await guardDone;
  if (guardError || guardClosed !== 0 || !guardOutput.includes('peak:')) throw new Error(`Memory monitor failed: ${guardError || guardClosed}`);
  const peakMemoryBytes = Math.max(Number(guardOutput.match(/peak:(\d+)/)?.[1] || 0), (outcome?.metrics?.childMaxRssKiB || 0) * 1024);
  const code = guardOutput.includes('MEMORY_LIMIT') || peakMemoryBytes > limits.memoryBytes || /heap out of memory/i.test(stderr)
    ? 'MEMORY_LIMIT' : timedOut ? 'TIME_LIMIT' : !outcome ? 'WORKER_FAILED' : null;
  if (code) outcome = { status: 'rejected', code, message: MESSAGES[code], sections: [], warnings: [], metrics: {} };
  return { ...outcome, metrics: { ...outcome.metrics, elapsedMs: Math.round(elapsedMs),
    totalElapsedMs: Math.round(performance.now() - totalStarted), peakMemoryBytes }, limits };
}

if (process.argv[2] === '--worker') {
  process.once('message', async ({ file, limits }) => {
    const outcome = await extractInChild(file, limits);
    const usage = process.resourceUsage();
    outcome.metrics.childMaxRssKiB = usage.maxRSS;
    outcome.metrics.cpuMs = Math.round((usage.userCPUTime + usage.systemCPUTime) / 1000);
    process.send(outcome, () => process.exit(0));
  });
}
