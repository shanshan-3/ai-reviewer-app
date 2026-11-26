import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createJsonParser, createRouteErrorHandler } from '../middleware/errorHandler.js';
import {
    generateDeck,
    getUserDecks,
    getDeck,
    postReview,
    deleteDeck,
} from '../controllers/flashcardController.js';

const parseJson = createJsonParser('8kb', { inflate: false });
const errorHandler = createRouteErrorHandler({
    tooLargeMessage: 'The request payload is too large.',
    fallbackMessage: 'The flashcard service is temporarily unavailable.',
});

const router = Router();
router.use(authMiddleware);

router.get('/', getUserDecks);
router.post('/', parseJson, generateDeck);
router.get('/:id', getDeck);
router.post('/:id/reviews', parseJson, postReview);
router.delete('/:id', deleteDeck);

router.use(errorHandler);

export default router;
