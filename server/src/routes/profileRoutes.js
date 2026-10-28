import { Router } from 'express';
import authMiddleware  from '../middleware/authMiddleware.js';
import { getOwnProfile } from '../controllers/profileController.js';

const router = Router();

router.get('/', authMiddleware, getOwnProfile);

export default router;