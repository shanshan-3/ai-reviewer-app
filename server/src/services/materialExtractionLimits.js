export const LIMITS = Object.freeze({
  fileBytes: 5 * 1024 * 1024,
  pdfPages: 100,
  textCharacters: 200_000,
  docxExpandedBytes: 20 * 1024 * 1024,
  docxEntries: 2048,
  timeMs: 30_000,
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
