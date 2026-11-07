import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { generateQuiz, getGeneration, getQuiz } from '../controllers/quizController.js';

const router = Router();
router.use(authMiddleware);
router.post('/generations', express.json({ limit: '8kb', inflate: false }), generateQuiz);
router.get('/generations/:id', getGeneration);
router.get('/:id', getQuiz);
router.use((error, _req, res, _next) => {
    if (res.headersSent) return res.end();
    const parseError = error.type === 'entity.parse.failed';
    const tooLarge = error.type === 'entity.too.large';
    const encoding = error.type === 'encoding.unsupported';
    if (error.retryAfter) res.set('Retry-After', String(error.retryAfter));
    res.status(parseError ? 400 : tooLarge ? 413 : encoding ? 415 : error.publicMessage ? error.status : 503).json({
        error: parseError ? 'Provide valid JSON.' : tooLarge ? 'The quiz request is too large.'
            : encoding ? 'Compressed request bodies are not supported.' : error.publicMessage ?? 'The quiz service is unavailable. Try again later.',
        code: parseError ? 'INVALID_JSON' : tooLarge ? 'REQUEST_LIMIT' : encoding ? 'UNSUPPORTED_ENCODING'
            : error.publicMessage ? error.code : 'SERVICE_UNAVAILABLE',
    });
});
export default router;
