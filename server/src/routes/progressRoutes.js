import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getRecommendations, getEstimates, getStreak } from '../controllers/progressController.js';

const router = Router();
router.use(authMiddleware);

router.get('/recommendations', getRecommendations);
router.get('/estimates', getEstimates);
router.get('/streak', getStreak);

export default router;

