import { LIMITS, MESSAGES } from '../services/materialExtractionLimits.js';

export const MATERIAL_TYPES = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

export function materialError(status, code, message) {
    return Object.assign(new Error(message), { status, code, publicMessage: message });
}

export function validateMaterialHeaders(req) {
    const mime = req.get('Content-Type')?.split(';')[0].trim().toLowerCase();
    if (!Object.hasOwn(MATERIAL_TYPES, mime ?? '')) {
        throw materialError(415, 'UNSUPPORTED_TYPE', MESSAGES.UNSUPPORTED_TYPE);
    }
    let filename;
    try { filename = decodeURIComponent(req.get('X-Filename') ?? ''); }
    catch { throw materialError(400, 'INVALID_FILENAME', 'Provide a valid X-Filename header.'); }
    if (!filename || filename.length > 255 || filename !== filename.trim()
        || /[\\/\p{Cc}]/u.test(filename) || !filename.toLowerCase().endsWith(MATERIAL_TYPES[mime])) {
        throw materialError(400, 'INVALID_FILENAME', 'Provide a PDF or DOCX filename matching the file type.');
    }
    return { filename, mime, extension: MATERIAL_TYPES[mime] };
}

export function validateMaterialBytes(bytes, extension) {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
        throw materialError(400, 'INVALID_FILE', MESSAGES.INVALID_FILE);
    }
    if (bytes.length > LIMITS.fileBytes) throw materialError(413, 'FILE_LIMIT', MESSAGES.FILE_LIMIT);
    const signature = extension === '.pdf'
        ? bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))
        : bytes.length >= 4 && bytes.readUInt32LE(0) === 0x04034b50;
    if (!signature) throw materialError(422, 'INVALID_FILE', MESSAGES.INVALID_FILE);
}

export function validateMaterialId(id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw materialError(400, 'INVALID_ID', 'Provide a valid material ID.');
    }
}
