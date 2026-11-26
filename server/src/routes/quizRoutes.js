import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createJsonParser, createRouteErrorHandler } from '../middleware/errorHandler.js';
import {
    generateQuiz,
    getGeneration,
    getQuiz,
    createSession,
    getSession,
    postAnswer,
    getResults,
    getUserQuizzes,
    deleteQuiz,
} from '../controllers/quizController.js';

const parseJson = createJsonParser('8kb', { inflate: false });
const errorHandler = createRouteErrorHandler({
    tooLargeMessage: 'The quiz request is too large.',
    fallbackMessage: 'The quiz service is unavailable. Try again later.',
});

const router = Router();
router.use(authMiddleware);

router.get('/', getUserQuizzes);
router.post('/generations', parseJson, generateQuiz);
router.get('/generations/:id', getGeneration);
router.post('/:id/sessions', createSession);
router.get('/:id', getQuiz);
router.delete('/:id', deleteQuiz);
router.use(errorHandler);

export const studySessionRouter = Router();
studySessionRouter.use(authMiddleware);
studySessionRouter.get('/:id', getSession);
studySessionRouter.post('/:id/answers', parseJson, postAnswer);
studySessionRouter.get('/:id/results', getResults);
studySessionRouter.use(errorHandler);

export default router;
