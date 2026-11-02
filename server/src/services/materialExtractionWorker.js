import { open, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import { LIMITS, MESSAGES } from './materialExtractionLimits.js';

const IMAGE_WARNING = 'Only selectable text was extracted. Images and scanned content are excluded. Review the extracted text before continuing.';
const FORMAT_WARNING = 'Some code or tables may have lost their layout. Affected content cannot support questions until verified.';
const require = createRequire(import.meta.url);
// Resolve the ZIP reader Mammoth itself uses, rather than adding a second ZIP dependency.
const JSZip = createRequire(require.resolve('mammoth'))('jszip');


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
    if (extension === '.pdf' ? !buffer.subarray(0, 1024).includes(Buffer.from('%PDF-')) : (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50)) reject('INVALID_FILE');
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


process.once('disconnect', () => process.exit(0));
process.once('message', async ({ file, limits }) => {
  const outcome = await extractInChild(file, limits);
  outcome.metrics.childMaxRssKiB = process.resourceUsage().maxRSS;
  process.send(outcome, () => process.exit(0));
});
