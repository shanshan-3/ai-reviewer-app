import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createJsonParser } from '../middleware/errorHandler.js';
import { getLabels, createSubject, createTopic } from '../controllers/labelController.js';

const router = Router();
const parseJson = createJsonParser('512kb');

router.get('/', authMiddleware, getLabels);
router.post('/subjects', authMiddleware, parseJson, createSubject);
router.post('/topics', authMiddleware, parseJson, createTopic);

export default router;
