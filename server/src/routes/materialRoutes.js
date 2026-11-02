import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { uploadMaterial, getMaterial } from '../controllers/materialController.js';
import { validateMaterialHeaders, MATERIAL_TYPES } from '../validation/materialValidation.js';
import { LIMITS, MESSAGES } from '../services/materialExtraction.js';

const router = Router();
const parseFile = express.raw({ type: Object.keys(MATERIAL_TYPES), limit: LIMITS.fileBytes, inflate: false });
// shortcut: one import per process; use a shared admission limit before running multiple server instances.
let importing = false;

router.post('/', authMiddleware, async (req, res, next) => {
    if (importing) return res.status(429).set('Retry-After', '5').json({ error: 'Another import is running. Try again shortly.', code: 'IMPORT_BUSY' });
    importing = true;
    try {
        req.materialUpload = validateMaterialHeaders(req);
        req.setTimeout(15000, () => req.destroy());
        await new Promise((resolve, reject) => parseFile(req, res, error => error ? reject(error) : resolve()));
        req.setTimeout(0);
        if (!req.aborted && !res.destroyed) await uploadMaterial(req, res);
    } catch (error) { next(error); }
    finally { importing = false; req.setTimeout(0); }
});
router.get('/:id', authMiddleware, getMaterial);
router.use((error, _req, res, _next) => {
    if (res.headersSent) return res.end();
    const tooLarge = error.type === 'entity.too.large';
    const encoding = error.type === 'encoding.unsupported';
    res.status(tooLarge ? 413 : encoding ? 415 : error.publicMessage ? error.status : 503).json({
        error: tooLarge ? MESSAGES.FILE_LIMIT : encoding ? 'Compressed request bodies are not supported.'
            : error.publicMessage ?? 'The module service is unavailable. Try again later.',
        code: tooLarge ? 'FILE_LIMIT' : encoding ? 'UNSUPPORTED_ENCODING' : error.publicMessage ? error.code : 'SERVICE_UNAVAILABLE',
        ...(error.materialId && { materialId: error.materialId }),
    });
});
export default router;
