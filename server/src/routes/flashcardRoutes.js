import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    generateDeck,
    getUserDecks,
    getDeck,
    postReview,
    deleteDeck,
} from '../controllers/flashcardController.js';

const parseJson = express.json({ limit: '8kb', inflate: false });

function errorHandler(error, _req, res, _next) {
    if (res.headersSent) return res.end();
    const parseError = error.type === 'entity.parse.failed';
    const tooLarge = error.type === 'entity.too.large';
    const encoding = error.type === 'encoding.unsupported';
    if (error.retryAfter) res.set('Retry-After', String(error.retryAfter));

    const status = parseError ? 400 : tooLarge ? 413 : encoding ? 415 : error.publicMessage ? error.status : 503;
    const message = parseError
        ? 'Provide valid JSON.'
        : tooLarge
        ? 'The request payload is too large.'
        : encoding
        ? 'Compressed request bodies are not supported.'
        : error.publicMessage ?? 'The flashcard service is temporarily unavailable.';
    const code = parseError
        ? 'INVALID_JSON'
        : tooLarge
        ? 'REQUEST_LIMIT'
        : encoding
        ? 'UNSUPPORTED_ENCODING'
        : error.publicMessage
        ? error.code
        : 'SERVICE_UNAVAILABLE';

    res.status(status).json({
        error: message,
        code,
        ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
    });
}

const router = Router();
router.use(authMiddleware);

router.get('/', getUserDecks);
router.post('/', parseJson, generateDeck);
router.get('/:id', getDeck);
router.post('/:id/reviews', parseJson, postReview);
router.delete('/:id', deleteDeck);

router.use(errorHandler);

export default router;
