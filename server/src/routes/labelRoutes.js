import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getLabels, createSubject, createTopic } from '../controllers/labelController.js';

const router = Router();
const parseJson = express.json({ limit: '512kb' });

router.get('/', authMiddleware, getLabels);
router.post('/subjects', authMiddleware, parseJson, createSubject);
router.post('/topics', authMiddleware, parseJson, createTopic);

export default router;
