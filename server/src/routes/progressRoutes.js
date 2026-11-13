import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getRecommendations, getEstimates, getStreak, getReport } from '../controllers/progressController.js';

const router = Router();
router.use(authMiddleware);

router.get('/recommendations', getRecommendations);
router.get('/estimates', getEstimates);
router.get('/streak', getStreak);
router.get('/report', getReport);

export default router;

