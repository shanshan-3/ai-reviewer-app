import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createJsonParser, createRouteErrorHandler } from '../middleware/errorHandler.js';
import { uploadMaterial, getMaterial, listMaterials, deleteMaterial, approveMaterial } from '../controllers/materialController.js';
import labelRoutes from './labelRoutes.js';
import { validateMaterialHeaders, MATERIAL_TYPES } from '../validation/materialValidation.js';
import { LIMITS, MESSAGES } from '../services/materialExtraction.js';

const router = Router();
const parseFile = express.raw({ type: Object.keys(MATERIAL_TYPES), limit: LIMITS.fileBytes, inflate: false });
const parseJson = createJsonParser('512kb');
const errorHandler = createRouteErrorHandler({
    tooLargeMessage: req => (req.is('application/json') ? 'The review request is too large.' : MESSAGES.FILE_LIMIT),
    tooLargeCode: 'FILE_LIMIT',
    fallbackMessage: 'The module service is unavailable. Try again later.',
    includeMaterialId: true,
});
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
router.get('/', authMiddleware, listMaterials);
router.use('/labels', labelRoutes);
router.delete('/:id', authMiddleware, deleteMaterial);
router.post('/:id/approve', authMiddleware, parseJson, approveMaterial);
router.get('/:id', authMiddleware, getMaterial);
router.use(errorHandler);
export default router;
